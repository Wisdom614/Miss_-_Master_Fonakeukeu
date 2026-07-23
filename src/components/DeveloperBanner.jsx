import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, Code, Crown } from 'lucide-react';

const DeveloperBanner = () => {
  return (
    <div className="bg-gradient-to-r from-gold-500/5 via-gold-500/10 to-gold-500/5 border-b border-gold-500/20 py-1.5 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        {/* Left side - subtle text */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Code className="w-3 h-3 text-gold-400" />
          <span className="hidden sm:inline">Plateforme de vote</span>
          <span className="sm:hidden">Vote platform</span>
          <Crown className="w-3 h-3 text-gold-400/50" />
          <span className="hidden sm:inline">•</span>
          <span className="text-gray-500 text-[10px] sm:text-xs">Miss & Master 2026</span>
        </div>

        {/* Right side - CTA */}
        <motion.a
          href="https://wa.me/237671657357"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1.5 px-3 py-0.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-full text-xs text-green-400 hover:text-green-300 transition-all duration-300 whitespace-nowrap"
        >
          <MessageCircle className="w-3 h-3" />
          <span>Une plateforme comme celle-ci ?</span>
          <Sparkles className="w-2.5 h-2.5 text-gold-400/50" />
        </motion.a>
      </div>
    </div>
  );
};

export default DeveloperBanner;