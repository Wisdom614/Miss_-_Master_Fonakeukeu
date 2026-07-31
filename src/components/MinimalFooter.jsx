import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, Code, Heart, Crown } from 'lucide-react';

const MinimalFooter = () => {
  return (
    <footer className="mt-auto border-t border-gold-500/15 bg-[#0d130f]/75 py-4 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Crown className="w-3 h-3 text-gold-400/50" />
            <span className="text-xs tracking-wide text-gray-400">
              Miss & Master Fonakeukeu 2026
            </span>
          </div>

          {/* Developer Credit - Minimal */}
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
            <span>Built with</span>
            <Heart className="w-2.5 h-2.5 text-red-400/70 animate-pulse" />
            <span>by</span>
            <a
              href="https://wa.me/237671657357"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 hover:text-gold-300 transition-colors duration-300 flex items-center gap-1"
            >
              <Code className="w-3 h-3" />
              <span>Besong Wisdom</span>
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="https://wa.me/237671657357"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400/70 hover:text-green-400 transition-colors duration-300 flex items-center gap-1"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Contact</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MinimalFooter;
