import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Crown, TrendingUp, Medal, Star, Users, User, UserCheck, RefreshCw,
  Trophy, Sparkles, Diamond, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const Results = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [settings, setSettings] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

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

  // Filter candidates by category
  const missCandidates = candidates.filter(c => c.category?.includes('Miss'));
  const masterCandidates = candidates.filter(c => c.category?.includes('Master'));
  
  const getDisplayedCandidates = () => {
    if (activeCategory === 'miss') return missCandidates;
    if (activeCategory === 'master') return masterCandidates;
    return candidates;
  };

  const displayedCandidates = getDisplayedCandidates();
  const totalPages = Math.ceil(displayedCandidates.length / ITEMS_PER_PAGE);
  const paginatedCandidates = displayedCandidates.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Calculate percentage with 2 decimal places
  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return ((votes / totalVotes) * 100);
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
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
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {candidates.length} Candidats
          </span>
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
        className="flex gap-2 mb-8 overflow-x-auto scrollbar-hide pb-2 justify-center"
      >
        <button
          onClick={() => { setActiveCategory('all'); setCurrentPage(0); }}
          className={`flex-shrink-0 px-5 py-2.5 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
            activeCategory === 'all'
              ? 'border-gold-500 bg-gold-500/10 text-gold-400 shadow-lg shadow-gold-500/20'
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
          onClick={() => { setActiveCategory('miss'); setCurrentPage(0); }}
          className={`flex-shrink-0 px-5 py-2.5 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
            activeCategory === 'miss'
              ? 'border-pink-500 bg-pink-500/10 text-pink-400 shadow-lg shadow-pink-500/20'
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
          onClick={() => { setActiveCategory('master'); setCurrentPage(0); }}
          className={`flex-shrink-0 px-5 py-2.5 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
            activeCategory === 'master'
              ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/20'
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

      {/* Candidates List - Clean Ranked List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl animate-pulse h-20" />
          ))}
        </div>
      ) : displayedCandidates.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-lg">Aucun candidat dans cette catégorie</p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {paginatedCandidates.map((candidate, index) => {
              const globalIndex = currentPage * ITEMS_PER_PAGE + index;
              const percentage = getPercentage(candidate.votes || 0);
              const isTop3 = globalIndex < 3;
              
              return (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className={`relative rounded-2xl p-4 border transition-all duration-300 ${
                    isTop3 && globalIndex === 0
                      ? 'bg-gradient-to-r from-gold-500/10 to-gold-600/5 border-gold-500/40 shadow-lg shadow-gold-500/10'
                      : isTop3 && globalIndex === 1
                      ? 'bg-gradient-to-r from-gray-400/10 to-gray-300/5 border-gray-400/30'
                      : isTop3 && globalIndex === 2
                      ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center text-xl font-display ${getMedalColor(globalIndex)}`}>
                      {getMedal(globalIndex)}
                    </div>
                    
                    {/* Image */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-charcoal-800">
                      <img
                        src={candidate.image || 'https://via.placeholder.com/48x48/1a1a1a/d4a800?text=?'}
                        alt={candidate.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/48x48/1a1a1a/d4a800?text=?';
                        }}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate ${
                          globalIndex === 0 ? 'text-gold-400 text-lg' : 'text-white'
                        }`}>
                          {candidate.name}
                        </h3>
                        {globalIndex === 0 && (
                          <Crown className="w-4 h-4 text-gold-500 animate-pulse-gold" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{candidate.category || 'Candidat'}</p>
                    </div>
                    
                    {/* Votes & Percentage */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1.5">
                        <Star className={`w-3 h-3 ${globalIndex === 0 ? 'text-gold-500' : 'text-gold-500/50'}`} />
                        <span className={`font-bold ${
                          globalIndex === 0 ? 'text-xl text-gold-400' : 'text-lg text-white'
                        }`}>
                          {candidate.votes || 0}
                        </span>
                        <span className="text-xs text-gray-500">votes</span>
                      </div>
                      <div className="text-xs text-gold-400 font-medium">
                        {percentage.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {totalVotes > 0 && (
                    <div className="mt-2 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className={`h-full rounded-full ${
                          globalIndex === 0 ? 'bg-gradient-to-r from-gold-400 to-gold-600' :
                          globalIndex === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          globalIndex === 2 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                          'bg-blue-500/30'
                        }`}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <span className="text-sm text-gray-400">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Results;