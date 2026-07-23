import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, Trophy, Award, Sparkles, Star, 
  Heart, Diamond, Gift, Medal, Users, 
  CheckCircle, ArrowLeft, PartyPopper, 
  Music, Camera, Share2, Settings
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const WinnerAnnouncement = () => {
  const [loading, setLoading] = useState(true);
  const [missWinner, setMissWinner] = useState(null);
  const [masterWinner, setMasterWinner] = useState(null);
  const [settings, setSettings] = useState(null);
  const [activeConfetti, setActiveConfetti] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    fetchWinners();
    loadSettings();
    checkVisibility();
  }, []);

  const checkVisibility = async () => {
    try {
      const settingsRef = doc(db, 'system', 'settings');
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        // If winners are not supposed to be shown, redirect
        if (!data.showWinners) {
          setIsVisible(false);
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error checking visibility:', error);
    }
  };

  const fetchWinners = async () => {
    try {
      const candidatesRef = collection(db, 'candidates');
      const snapshot = await getDocs(candidatesRef);
      
      let missCandidates = [];
      let masterCandidates = [];
      
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.category?.includes('Miss')) {
          missCandidates.push(data);
        } else if (data.category?.includes('Master')) {
          masterCandidates.push(data);
        }
      });
      
      missCandidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      masterCandidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      
      setMissWinner(missCandidates[0] || null);
      setMasterWinner(masterCandidates[0] || null);
      setLoading(false);
      
      // Trigger celebration when winners are found
      if (missCandidates[0] || masterCandidates[0]) {
        setTimeout(() => triggerCelebration(), 500);
      }
    } catch (error) {
      console.error('Error fetching winners:', error);
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsRef = doc(db, 'system', 'settings');
      const settingsDoc = await getDoc(settingsRef);
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const triggerCelebration = () => {
    if (activeConfetti) return;
    setActiveConfetti(true);
    
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#d4a800', '#f3d05f', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff'];

    (function frame() {
      confetti({
        particleCount: 7,
        startVelocity: 30,
        spread: 60,
        origin: { y: 0.6, x: Math.random() },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: colors,
        startVelocity: 40,
      });
    }, 1000);

    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.4, x: 0.2 },
        colors: colors,
        startVelocity: 35,
      });
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.4, x: 0.8 },
        colors: colors,
        startVelocity: 35,
      });
    }, 2000);

    setTimeout(() => setActiveConfetti(false), 4000);
  };

  const handleCelebrate = () => {
    triggerCelebration();
  };

  const WinnerCard = ({ winner, title, icon: Icon, color, bgColor }) => {
    if (!winner) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`relative bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-xl rounded-3xl p-6 border border-white/10 overflow-hidden shadow-2xl ${color}`}
      >
        <div className={`absolute inset-0 ${bgColor} opacity-20 blur-2xl`} />
        <div className="absolute -top-10 -right-10 opacity-10">
          <Crown className="w-40 h-40 text-gold-500" />
        </div>

        <div className="absolute top-4 right-4">
          <div className="bg-gold-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-gold-500/30 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-xs font-bold text-gold-400">GAGNANT</span>
          </div>
        </div>

        <div className="relative w-32 h-32 mx-auto mb-4">
          <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative rounded-full overflow-hidden border-4 border-gold-500/30 w-32 h-32 mx-auto">
            <img
              src={winner.image || 'https://via.placeholder.com/128x128/1a1a1a/d4a800?text=?'}
              alt={winner.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/128x128/1a1a1a/d4a800?text=?';
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1">
            <Crown className="w-8 h-8 text-gold-400 drop-shadow-lg" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-white text-center mb-1">
          {winner.name}
        </h3>
        <p className="text-sm text-gray-400 text-center mb-3">{title}</p>

        <div className="flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gold-400">
            <Star className="w-4 h-4" />
            <span className="font-bold">{winner.votes || 0}</span>
            <span className="text-gray-500">votes</span>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Crown className="w-16 h-16 text-gold-500" />
          </motion.div>
          <p className="mt-4 text-gold-400 font-display text-xl">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  const siteName = settings?.siteName || 'Miss & Master Fonakeukeu';
  const editionYear = settings?.editionYear || '2026';

  return (
    <div ref={containerRef} className="relative min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gold-500/5"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              delay: Math.random() * 5,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating Decorations */}
      {[
        { Icon: Crown, x: '5%', y: '10%', size: 32, delay: 0 },
        { Icon: Trophy, x: '90%', y: '15%', size: 28, delay: 1 },
        { Icon: Sparkles, x: '10%', y: '80%', size: 24, delay: 2 },
        { Icon: Award, x: '85%', y: '85%', size: 30, delay: 0.5 },
      ].map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-gold-500/20 pointer-events-none"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4 + index,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <item.Icon className={`w-${item.size/4} h-${item.size/4}`} />
        </motion.div>
      ))}

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="relative inline-block mb-2">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gold-500/20 blur-2xl"
            />
            <h1 className="relative font-display text-4xl md:text-6xl font-bold text-white flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-gold-400 animate-pulse" />
              <span className="text-transparent bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text">
                Gagnants
              </span>
              <Sparkles className="w-8 h-8 text-gold-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </h1>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            {siteName} • Édition {editionYear}
          </p>
        </motion.div>

        {/* Winners Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full mx-auto">
          <WinnerCard
            winner={missWinner}
            title="👑 Miss Fonakeukeu"
            icon={Crown}
            color="shadow-pink-500/10"
            bgColor="bg-pink-500"
          />
          <WinnerCard
            winner={masterWinner}
            title="🎩 Master Fonakeukeu"
            icon={Trophy}
            color="shadow-blue-500/10"
            bgColor="bg-blue-500"
          />
        </div>

        {/* If no winners found */}
        {!missWinner && !masterWinner && (
          <div className="text-center text-gray-400 py-12">
            <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-lg">Aucun gagnant pour le moment</p>
            <p className="text-sm">Les résultats seront annoncés bientôt</p>
          </div>
        )}

        {/* Celebration Button */}
        {missWinner && masterWinner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCelebrate}
              className="bg-gradient-gold text-charcoal-900 px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 transition-all duration-300"
            >
              <PartyPopper className="w-5 h-5" />
              🎉 Célébrer encore
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/vote')}
              className="border-2 border-white/20 text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Retour au vote
            </motion.button>
          </motion.div>
        )}

        {/* Decorative Footer */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-600 text-xs">
            <Heart className="w-3 h-3 text-gold-500/50" />
            <span>Félicitations aux gagnants</span>
            <Heart className="w-3 h-3 text-gold-500/50" />
          </div>
        </div>

        {/* Admin Access */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-700 hover:text-gray-500 text-xs transition-colors duration-300 flex items-center gap-1 opacity-50 hover:opacity-100"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerAnnouncement;