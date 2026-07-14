import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-charcoal-900 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          <Crown className="w-16 h-16 text-gold-500" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-gold-400 font-display text-xl"
        >
          Miss & Master Fonakeukeu
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-4 h-1 bg-gradient-gold rounded-full max-w-[200px] mx-auto"
        />
      </motion.div>
    </div>
  );
};

export default LoadingScreen;