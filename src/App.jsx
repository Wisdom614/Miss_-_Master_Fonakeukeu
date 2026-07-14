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
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import { Toaster } from 'react-hot-toast';

import PaymentProcessing from './pages/PaymentProcessing';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isVotingExpired, setIsVotingExpired] = useState(false);
  const [settings, setSettings] = useState(null);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load settings and check countdown
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, 'system', 'settings');
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings(data);
          
          // Check if voting has expired
          if (data.countdown?.enabled && data.countdown?.targetDate) {
            const now = new Date().getTime();
            const target = new Date(data.countdown.targetDate).getTime();
            setIsVotingExpired(now > target);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
    
    // Check every minute
    const interval = setInterval(loadSettings, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-dark">
        <Navbar user={user} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route 
            path="/vote" 
            element={
              isVotingExpired ? 
                <Navigate to="/results" /> : 
                <Voting />
            } 
          />
          <Route path="/payment-processing" element={<PaymentProcessing />} />
          <Route path="/results" element={<Results />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              user?.email === 'admin@fonakeukeu.com' ? 
                <AdminDashboard /> : 
                <Navigate to="/admin" />
            } 
          />
          
          {/* 404 - Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        {/* Toast Notifications */}
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