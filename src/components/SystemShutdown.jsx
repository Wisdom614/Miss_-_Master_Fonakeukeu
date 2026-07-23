import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, Clock, RefreshCw, Diamond, 
  Sparkles, Heart, Star, Award,
  Shield, Zap, Gift, Trophy
} from 'lucide-react';

const SystemShutdown = ({ settings, isPreview }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [progress, setProgress] = useState(100);
  const shutdown = settings?.systemShutdown || {};
  
  const { 
    enabled = false, 
    title = '🔧 Système indisponible',
    message = 'Le système est temporairement indisponible. Veuillez réessayer dans quelques minutes.',
    estimatedTime = '30 minutes',
    showTimer = false,
  } = shutdown;

  // Elegant countdown timer
  useEffect(() => {
    if (!showTimer || !estimatedTime) return;

    const minutes = parseInt(estimatedTime);
    if (!isNaN(minutes) && minutes > 0) {
      let seconds = minutes * 60;
      const totalSeconds = seconds;
      
      const interval = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
          clearInterval(interval);
          setTimeLeft('Bientôt disponible');
          setProgress(0);
        } else {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
          setProgress((seconds / totalSeconds) * 100);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showTimer, estimatedTime]);

  // Floating particles for background
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 10 + 5,
    delay: Math.random() * 5,
  }));

  // Decorative icons that float
  const floatingIcons = [
    { Icon: Crown, color: 'text-gold-500', size: 24, delay: 0 },
    { Icon: Sparkles, color: 'text-gold-400', size: 16, delay: 1 },
    { Icon: Star, color: 'text-gold-300', size: 20, delay: 2 },
    { Icon: Award, color: 'text-gold-500', size: 18, delay: 0.5 },
    { Icon: Diamond, color: 'text-gold-400', size: 14, delay: 1.5 },
  ];

  if (!enabled && !isPreview) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gold-500/10"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 10, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, color, size, delay }, index) => (
        <motion.div
          key={index}
          className={`absolute ${color}`}
          style={{
            left: `${15 + index * 20}%`,
            top: `${10 + index * 15}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 4 + index,
            delay: delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Icon className={`w-${size/4} h-${size/4} opacity-20`} />
        </motion.div>
      ))}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-lg w-full"
      >
        {/* Card Container */}
        <div className="relative bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl shadow-gold-500/5 overflow-hidden">
          {/* Glowing Border Animation */}
          <motion.div
            className="absolute inset-0 rounded-3xl border-2 border-gold-500/20"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Top Decorative Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

          {/* Crown Icon with Animation */}
          <motion.div 
            className="flex justify-center mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-gold-500/20 to-gold-600/5 rounded-full p-4 border border-gold-500/30">
                <Crown className="w-14 h-14 text-gold-400" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 
            className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {title.replace('🔧', '') || 'Système en maintenance'}
          </motion.h1>

          {/* Decorative Divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Diamond className="w-4 h-4 text-gold-500/50" />
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
            <Sparkles className="w-4 h-4 text-gold-400/50 animate-pulse" />
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
            <Diamond className="w-4 h-4 text-gold-500/50" />
          </div>

          {/* Message */}
          <motion.p 
            className="text-gray-300 text-center leading-relaxed mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {message}
          </motion.p>

          {/* Timer / Estimated Time */}
          {(estimatedTime || timeLeft) && (
            <motion.div
              className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-center gap-3 text-sm">
                <Clock className="w-5 h-5 text-gold-400" />
                <span className="text-gray-400">Disponible dans environ</span>
                <span className="text-gold-400 font-display text-lg font-bold">
                  {showTimer && timeLeft ? timeLeft : estimatedTime}
                </span>
              </div>

              {/* Progress Bar */}
              {showTimer && timeLeft && (
                <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-gold-400 to-gold-600 rounded-full"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Decorative Brand Message */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
              <Heart className="w-3 h-3 text-gold-500/50" />
              <span>Miss & Master Fonakeukeu</span>
              <Heart className="w-3 h-3 text-gold-500/50" />
            </p>
          </motion.div>

          {/* Auto-refresh Button - Elegant */}
          <motion.button
            onClick={() => window.location.reload()}
            className="mt-6 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 group flex items-center justify-center gap-2 text-gray-400 hover:text-gold-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm">Vérifier si le système est de retour</span>
          </motion.button>

          {/* Decorative Bottom Elements */}
          <div className="absolute bottom-4 left-4 opacity-20">
            <Sparkles className="w-4 h-4 text-gold-400 animate-pulse" />
          </div>
          <div className="absolute bottom-4 right-4 opacity-20">
            <Sparkles className="w-4 h-4 text-gold-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Nous revenons très bientôt</span>
            <Zap className="w-3 h-3" />
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SystemShutdown;