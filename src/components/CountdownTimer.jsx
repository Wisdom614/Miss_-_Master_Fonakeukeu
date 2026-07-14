import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, Trophy, Sparkles } from 'lucide-react';

const CountdownTimer = ({ 
  targetDate, 
  title = 'Le concours se termine dans',
  subtitle = 'Votez maintenant !',
  onExpiry,
  className = '',
  showIcon = true,
  size = 'default' // 'small', 'default', 'large'
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!targetDate || !isClient) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        if (onExpiry) onExpiry();
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
    };

    // Initial calculation
    updateTimer();

    // Start interval
    timerRef.current = setInterval(updateTimer, 1000);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [targetDate, onExpiry, isClient]);

  if (!isClient) {
    return null;
  }

  // Size configurations
  const sizes = {
    small: {
      wrapper: 'gap-1 p-2',
      number: 'text-lg font-bold',
      label: 'text-[8px]',
      unit: 'text-[8px]',
      gap: 'gap-0.5'
    },
    default: {
      wrapper: 'gap-2 p-3',
      number: 'text-2xl md:text-3xl font-bold',
      label: 'text-[10px] md:text-xs',
      unit: 'text-[10px] md:text-xs',
      gap: 'gap-1'
    },
    large: {
      wrapper: 'gap-3 p-4',
      number: 'text-3xl md:text-5xl font-bold',
      label: 'text-xs md:text-sm',
      unit: 'text-xs md:text-sm',
      gap: 'gap-1.5'
    }
  };

  const config = sizes[size] || sizes.default;

  const units = [
    { key: 'days', label: 'Jours' },
    { key: 'hours', label: 'Heures' },
    { key: 'minutes', label: 'Minutes' },
    { key: 'seconds', label: 'Secondes' }
  ];

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-r from-gold-500/20 to-gold-600/10 border border-gold-500/30 rounded-2xl p-4 text-center ${className}`}
      >
        <div className="flex items-center justify-center gap-2 text-gold-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="font-semibold">Le vote est terminé !</span>
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <p className="text-sm text-gray-400 mt-1">Merci à tous les participants</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-500/10 via-gold-500/5 to-transparent border border-gold-500/20 backdrop-blur-sm ${className}`}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl translate-x-16 -translate-y-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold-500/5 rounded-full blur-2xl -translate-x-16 translate-y-16" />

      <div className={`relative ${config.wrapper}`}>
        {/* Title */}
        {title && (
          <div className="flex items-center justify-center gap-2 mb-2">
            {showIcon && <Clock className="w-4 h-4 text-gold-400" />}
            <p className="text-sm text-gray-300">{title}</p>
          </div>
        )}
        
        {subtitle && (
          <p className="text-xs text-gold-400 text-center mb-3 font-medium">
            {subtitle}
          </p>
        )}

        {/* Countdown Numbers */}
        <div className={`flex justify-center items-center ${config.gap}`}>
          {units.map(({ key, label }) => (
            <div key={key} className="text-center">
              <motion.div
                key={timeLeft[key]}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-charcoal-900/50 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[50px] border border-white/10"
              >
                <span className={`text-gold-400 ${config.number}`}>
                  {String(timeLeft[key]).padStart(2, '0')}
                </span>
              </motion.div>
              <p className={`text-gray-500 mt-1 ${config.label}`}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CountdownTimer;