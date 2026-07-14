import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Crown, TrendingUp, Medal, Star, Users, User, UserCheck, RefreshCw, Sparkles, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

const Results = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [settings, setSettings] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSettings();

    const q = query(collection(db, 'candidates'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const candidatesData = [];
      let total = 0;
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        candidatesData.push(data);
        total += data.votes || 0;
      });
      candidatesData.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      setCandidates(candidatesData);
      setTotalVotes(total);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error in real-time listener:', error);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, []);

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

  const handleRefresh = () => {
    setRefreshing(true);
    toast.loading('Rafraîchissement...');
    window.location.reload();
  };

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getMedalColor = (index) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-gray-300';
    if (index === 2) return 'text-amber-600';
    return 'text-gray-500';
  };

  const siteName = settings?.siteName || 'Miss & Master Fonakeukeu';
  const editionYear = settings?.editionYear || '2026';

  const missCandidates = candidates.filter(c => c.category?.includes('Miss'));
  const masterCandidates = candidates.filter(c => c.category?.includes('Master'));
  
  const getDisplayedCandidates = () => {
    if (activeCategory === 'miss') return missCandidates;
    if (activeCategory === 'master') return masterCandidates;
    return candidates;
  };

  const displayedCandidates = getDisplayedCandidates();

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-white">
            Classement en
            <span className="text-transparent bg-gradient-to-r from-yellow-300 via-gold-400 to-yellow-500 bg-clip-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {' '}Direct
            </span>
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <p className="text-gray-400 text-sm">
          {siteName} • Édition {editionYear}
        </p>
        <div className="flex items-center justify-center gap-6 text-gray-400 mt-2">
          <span>{candidates.length} Candidats</span>
          <span className="w-px h-4 bg-gray-600" />
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-gold-500" />
            {totalVotes} Votes total
          </span>
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2 justify-center"
      >
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
            activeCategory === 'all'
              ? 'border-gold-500 bg-gold-500/10 text-gold-400'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-gold-500/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Tous</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
            {candidates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('miss')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
            activeCategory === 'miss'
              ? 'border-pink-500 bg-pink-500/10 text-pink-400'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-pink-500/50'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Miss</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
            {missCandidates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveCategory('master')}
          className={`flex-shrink-0 px-4 py-2 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
            activeCategory === 'master'
              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-blue-500/50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span className="text-sm font-medium">Master</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
            {masterCandidates.length}
          </span>
        </button>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl animate-pulse h-20" />
          ))}
        </div>
      ) : displayedCandidates.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <Medal className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-lg">Aucun candidat dans cette catégorie</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3 max-w-4xl mx-auto"
        >
          {displayedCandidates.map((candidate, index) => {
            const isFirst = index === 0;
            
            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                className={`
                  relative rounded-2xl p-4 border transition-all duration-300
                  ${isFirst 
                    ? 'bg-gradient-to-r from-gold-500/10 to-gold-500/5 border-gold-500/40 shadow-lg shadow-gold-500/10' 
                    : 'bg-white/5 border-white/10'
                  }
                `}
              >
                {/* 👑 Winner Crown - Subtle */}
                {isFirst && (
                  <>
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-gold-500/20 text-gold-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm border border-gold-500/30">
                        <Crown className="w-3 h-3" />
                        Leader
                      </div>
                    </div>
                    {/* Subtle glow behind the card */}
                    <div className="absolute inset-0 rounded-2xl bg-gold-500/5 blur-xl -z-10" />
                  </>
                )}

                <div className="flex items-center gap-4 relative z-10">
                  {/* Medal */}
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <span className={`text-2xl ${getMedalColor(index)}`}>
                      {getMedal(index)}
                    </span>
                  </div>
                  
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold truncate ${isFirst ? 'text-gold-400' : 'text-white'}`}>
                        {candidate.name}
                      </h3>
                      {isFirst && (
                        <Sparkles className="w-3 h-3 text-gold-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{candidate.category || 'Candidat'}</p>
                  </div>
                  
                  {/* Votes */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1.5">
                      {isFirst ? (
                        <Trophy className="w-4 h-4 text-gold-500" />
                      ) : (
                        <Star className="w-3 h-3 text-gold-500/50" />
                      )}
                      <span className={`font-bold ${isFirst ? 'text-xl text-gold-400' : 'text-lg text-white'}`}>
                        {candidate.votes || 0}
                      </span>
                      <span className="text-xs text-gray-500">votes</span>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar - Thinner and more subtle */}
                {totalVotes > 0 && (
                  <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((candidate.votes || 0) / totalVotes) * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        isFirst ? 'bg-gradient-to-r from-gold-400 to-gold-600' : 'bg-blue-500/30'
                      }`}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default Results;