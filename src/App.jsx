import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import Home from './pages/Home';
import Voting from './pages/Voting';
import Results from './pages/Results';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PaymentResult from './pages/PaymentResult';
import WinnerAnnouncement from './pages/WinnerAnnouncement';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import SystemShutdown from './components/SystemShutdown';
import DeveloperBanner from './components/DeveloperBanner';
import MinimalFooter from './components/MinimalFooter';
import { Toaster } from 'react-hot-toast';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isVotingExpired, setIsVotingExpired] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isSystemShutdown, setIsSystemShutdown] = useState(false);
  const [shutdownSettings, setShutdownSettings] = useState(null);
  const [showWinners, setShowWinners] = useState(false);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, 'system', 'settings');
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings(data);
          
          if (data.countdown?.enabled && data.countdown?.targetDate) {
            const now = new Date().getTime();
            const target = new Date(data.countdown.targetDate).getTime();
            const expired = now > target;
            setIsVotingExpired(expired);
            if (expired) setShowWinners(true);
          }
          
          if (data.showWinners === true) setShowWinners(true);
          
          const shutdown = data.systemShutdown || {};
          setIsSystemShutdown(shutdown.enabled || false);
          setShutdownSettings(shutdown);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
    const interval = setInterval(loadSettings, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-dark flex flex-col">
        {/* ✅ Developer Banner - Above Navbar */}
        {!isSystemShutdown && !showWinners && <DeveloperBanner />}
        
        {!isSystemShutdown && !showWinners && <Navbar user={user} />}
        
        <div className="flex-1">
          <Routes>
            <Route 
              path="/" 
              element={
                isSystemShutdown ? 
                  <SystemShutdown settings={{ systemShutdown: shutdownSettings }} /> : 
                  (showWinners ? <Navigate to="/winners" /> : <Home />)
              } 
            />
            <Route 
              path="/vote" 
              element={
                isSystemShutdown ? 
                  <SystemShutdown settings={{ systemShutdown: shutdownSettings }} /> : 
                  (showWinners ? <Navigate to="/winners" /> : 
                    (isVotingExpired ? <Navigate to="/winners" /> : <Voting />))
              } 
            />
            <Route 
              path="/results" 
              element={
                isSystemShutdown ? 
                  <SystemShutdown settings={{ systemShutdown: shutdownSettings }} /> : 
                  <Results />
              } 
            />
            <Route path="/payment-result" element={<PaymentResult />} />
            <Route path="/winners" element={<WinnerAnnouncement />} />
            
            <Route path="/admin" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                user?.email === 'admin@fonakeukeu.com' ? 
                  <AdminDashboard /> : 
                  <Navigate to="/admin" />
              } 
            />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        
        {/* ✅ Minimal Footer */}
        {!isSystemShutdown && !showWinners && <MinimalFooter />}
        
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid rgba(212, 168, 0, 0.2)',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#d4a800',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;