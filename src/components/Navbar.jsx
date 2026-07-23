import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, Vote, BarChart3, Settings, Sparkles, Menu, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase/config';

const Navbar = ({ user }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/vote', icon: Vote, label: 'Voter' },
    { path: '/results', icon: BarChart3, label: 'Résultats' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal-900/95 backdrop-blur-xl border-b border-gold-500/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo - Fixed Gradient */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <Crown className="w-6 h-6 text-gold-400 drop-shadow-lg" />
              <span className="text-sm md:text-base font-display font-bold whitespace-nowrap">
                <span className="text-white">Miss &amp; Master</span>
                <span className="text-transparent bg-gradient-to-r from-yellow-300 via-gold-400 to-yellow-500 bg-clip-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {' '}FK
                </span>
              </span>
              <Sparkles className="w-3 h-3 text-gold-400 animate-pulse-gold hidden sm:inline" />
            </Link>
            
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive(path)
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-gray-400 hover:text-gold-300 hover:bg-gold-500/5'
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
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-400" />
              ) : (
                <Menu className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-14 left-0 right-0 z-40 bg-charcoal-900/98 backdrop-blur-xl border-b border-gold-500/20 md:hidden"
          >
            <div className="px-4 py-2">
              {navItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive(path)
                      ? 'text-gold-400 bg-gold-500/10'
                      : 'text-gray-400 hover:text-gold-300 hover:bg-gold-500/5'
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
    </>
  );
};

export default Navbar;