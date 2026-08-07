import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, Vote, BarChart3, Settings, Sparkles, Menu, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase/config';

const CountdownTicker = ({ countdown }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!countdown?.targetDate) return undefined;
    const update = () => {
      const remaining = Math.max(0, new Date(countdown.targetDate).getTime() - Date.now());
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft({ days, hours, minutes, seconds, expired: remaining === 0 });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [countdown?.enabled, countdown?.targetDate]);

  if (!countdown?.targetDate || !timeLeft) return null;
  const timerText = timeLeft.expired
    ? 'Les votes sont maintenant clos'
    : `${timeLeft.days}j ${String(timeLeft.hours).padStart(2, '0')}h ${String(timeLeft.minutes).padStart(2, '0')}m ${String(timeLeft.seconds).padStart(2, '0')}s`;
  const message = timeLeft.expired
    ? 'Merci pour votre participation'
    : (countdown.title || 'Le vote se termine bientôt');

  return (
    <div className="countdown-strip relative overflow-hidden border-b border-gold-400/20 bg-[#090e0b]/95 px-3 py-2" aria-live="polite" aria-label="Temps restant pour voter">
      <div className="nav-marquee flex w-max min-w-full items-center gap-10 whitespace-nowrap text-xs">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-3 text-gray-300">
            <Sparkles className="h-3.5 w-3.5 text-gold-300" />
            <span className="font-medium uppercase tracking-[0.14em] text-gold-200">{message}</span>
            <span className="rounded-full border border-gold-400/30 bg-gold-500/10 px-3 py-0.5 font-semibold tabular-nums text-gold-200">{timerText}</span>
            <span className="text-gray-400">Soutenez votre favori avant la clôture</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Navbar = ({ countdown, resultsVisible = true }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/vote', icon: Vote, label: 'Voter' },
    ...(resultsVisible ? [{ path: '/results', icon: BarChart3, label: 'Résultats' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 shadow-[0_12px_35px_rgba(0,0,0,.24)]">
        <CountdownTicker countdown={countdown} />
      <nav className="border-b border-gold-500/25 bg-[#101713]/95 backdrop-blur-xl">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between sm:h-16">
            {/* Logo - Fixed Gradient */}
            <Link to="/" className="flex items-center space-x-2.5 flex-shrink-0 group" aria-label="Miss & Master FK - Accueil">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-gold-400/35 bg-gold-500/10 shadow-[0_0_24px_rgba(212,168,0,.14)] transition-transform duration-300 group-hover:scale-105"><Crown className="w-5 h-5 text-gold-300 drop-shadow-lg" /></span>
              <span className="text-sm sm:text-base md:text-lg font-display font-bold whitespace-nowrap tracking-wide">
                <span className="text-white">Miss &amp; Master</span>
                <span className="text-transparent bg-gradient-to-r from-yellow-300 via-gold-400 to-yellow-500 bg-clip-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {' '}FK
                </span>
              </span>
              <Sparkles className="w-3 h-3 text-gold-400 animate-pulse-gold hidden lg:inline" />
            </Link>
            
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive(path)
                      ? 'text-gold-300 bg-gold-500/15 shadow-[inset_0_0_0_1px_rgba(212,168,0,.18)]'
                      : 'text-gray-300 hover:text-gold-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
              
              {/* ✅ Admin link removed from navbar - accessible via /admin URL */}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden grid h-9 w-9 place-items-center rounded-full border border-gold-400/25 bg-gold-500/10 text-gold-200 hover:border-gold-400/60 hover:bg-gold-500/20 transition-all duration-300"
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-400" />
              ) : (
                <Menu className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        {/* Mobile menu is anchored below the main navigation. */}
        <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative z-40 border-t border-gold-500/10 bg-[#101713]/98 px-4 pb-4 pt-3 shadow-2xl backdrop-blur-xl md:hidden"
          >
            <div className="rounded-2xl border border-gold-100/10 bg-white/[0.035] p-2 shadow-inner">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive(path)
                    ? 'text-gold-200 bg-gold-500/15 shadow-[inset_0_0_0_1px_rgba(212,168,0,.15)]'
                    : 'text-gray-300 hover:text-gold-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
              
              {/* ✅ Admin link removed from mobile menu as well */}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </nav>
      </header>
    </>
  );
};

export default Navbar;
