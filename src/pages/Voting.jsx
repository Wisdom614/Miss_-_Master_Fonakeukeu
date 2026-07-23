import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Users, Sparkles, Crown, ChevronLeft, ChevronRight,
  Plus, Minus, X, Star, TrendingUp, Smartphone, 
  Wallet, Loader2, Shield, Zap, Trophy, Medal, Gem,
  User, UserCheck, Heart, Sparkle, RefreshCw,
  Award, Calendar, Diamond, Star as StarIcon,
  CreditCard, Phone, Monitor, Smartphone as SmartphoneIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Voting = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [customVotes, setCustomVotes] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');

  const VOTES_PER_PAGE = 6;

  // ✅ Get payment settings from Firebase
  const getPaymentSettings = () => {
    const payment = settings?.payment || {};
    
    return {
      mobileMoney: {
        enabled: payment.mobileMoney?.enabled !== false,
        minVotes: payment.mobileMoney?.minVotes || 1,
        pricePerVote: payment.mobileMoney?.pricePerVote || 100,
      },
      card: {
        enabled: payment.card?.enabled !== false,
        minVotes: payment.card?.minVotes || 10,
        pricePerVote: payment.card?.pricePerVote || 150,
      },
    };
  };

  const paymentSettings = getPaymentSettings();

  // ✅ Get available payment methods
  const getAvailablePaymentMethods = () => {
    const methods = [];
    if (paymentSettings.mobileMoney.enabled) {
      methods.push({
        id: 'mobile_money',
        label: 'Mobile Money',
        icon: SmartphoneIcon,
        description: 'MTN / Orange',
        pricePerVote: paymentSettings.mobileMoney.pricePerVote,
        minVotes: paymentSettings.mobileMoney.minVotes,
        color: 'from-blue-500/20 to-blue-600/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400',
        activeColor: 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/20'
      });
    }
    if (paymentSettings.card.enabled) {
      methods.push({
        id: 'card',
        label: 'Carte Bancaire',
        icon: CreditCard,
        description: 'Visa / Mastercard',
        pricePerVote: paymentSettings.card.pricePerVote,
        minVotes: paymentSettings.card.minVotes,
        color: 'from-gold-500/20 to-gold-600/10',
        borderColor: 'border-gold-500/30',
        textColor: 'text-gold-400',
        activeColor: 'border-gold-500 bg-gold-500/10 text-gold-400 shadow-lg shadow-gold-500/20'
      });
    }
    return methods;
  };

  const availablePaymentMethods = getAvailablePaymentMethods();

  useEffect(() => {
    fetchCandidates();
    loadSettings();

    const q = collection(db, 'candidates');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const candidatesData = [];
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        candidatesData.push(data);
      });
      candidatesData.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      setCandidates(candidatesData);
      setLoading(false);
    }, (error) => {
      console.error('Error in real-time listener:', error);
    });

    return () => unsubscribe();
  }, [refreshKey]);

  const fetchCandidates = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'candidates'));
      const candidatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      candidatesData.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      setCandidates(candidatesData);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      toast.error('Erreur de chargement des candidats');
    } finally {
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

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    toast.success('Actualisation...');
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleVoteClick = (candidate) => {
    setSelectedCandidate(candidate);
    setCustomVotes(1);
    setPaymentMethod(availablePaymentMethods.length > 0 ? availablePaymentMethods[0].id : 'mobile_money');
    setShowVoteModal(true);
  };

  const handlePaymentMethodChange = (methodId) => {
    setPaymentMethod(methodId);
    const method = availablePaymentMethods.find(m => m.id === methodId);
    if (method && customVotes < method.minVotes) {
      setCustomVotes(method.minVotes);
    }
  };

  const handleVoteConfirm = async () => {
    if (!selectedCandidate) {
      toast.error('Veuillez sélectionner un candidat');
      return;
    }

    const selectedMethod = availablePaymentMethods.find(m => m.id === paymentMethod);
    if (!selectedMethod) {
      toast.error('Méthode de paiement non disponible');
      return;
    }

    let voteCount = parseInt(customVotes) || 1;
    
    // ✅ Auto-adjust for minimum votes
    if (voteCount < selectedMethod.minVotes) {
      voteCount = selectedMethod.minVotes;
      setCustomVotes(selectedMethod.minVotes);
      toast.info(`Minimum ${selectedMethod.minVotes} votes requis pour ${selectedMethod.label}. Ajusté automatiquement.`);
    }

    if (voteCount < 1) {
      toast.error('Minimum 1 vote');
      return;
    }

    const totalAmount = voteCount * selectedMethod.pricePerVote;

    setProcessing(true);
    try {
      // ✅ Choose worker based on payment method
      let workerUrl, endpoint;
      
      if (paymentMethod === 'card') {
        workerUrl = import.meta.env.VITE_CAMERPAY_WORKER_URL;
        endpoint = '/create-card-payment';
        console.log('💳 Using CamerPay for card payment');
      } else {
        workerUrl = import.meta.env.VITE_FAPSHI_WORKER_URL;
        endpoint = '/create-payment';
        console.log('📱 Using Fapshi for mobile money');
      }
      
      console.log('📊 Confirming vote:', {
        amount: totalAmount,
        votes: voteCount,
        pricePerVote: selectedMethod.pricePerVote,
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        paymentMethod: paymentMethod
      });
      
      const response = await fetch(`${workerUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          candidateId: selectedCandidate.id,
          candidateName: selectedCandidate.name,
          votes: voteCount,
          email: 'anonymous@voter.com',
          phone: '699123456',
          payment_method: paymentMethod,
        })
      });

      const data = await response.json();
      console.log('📦 Payment response:', data);
      
      if (data.status === 520 || (data.error && data.error.includes('520'))) {
        setShowVoteModal(false);
        toast.error('🔧 Le service de paiement par carte est temporairement indisponible. Veuillez réessayer dans quelques minutes ou utiliser Mobile Money.');
        setProcessing(false);
        return;
      }
      
      if (data.paymentUrl) {
        // ✅ Store ALL data in session storage
        sessionStorage.setItem('pendingVote', data.invoiceId);
        sessionStorage.setItem('pendingCandidate', selectedCandidate.id);
        sessionStorage.setItem('pendingCandidateName', selectedCandidate.name);
        sessionStorage.setItem('pendingVotesCount', String(voteCount));
        sessionStorage.setItem('paymentMethod', paymentMethod);
        sessionStorage.setItem('pricePerVote', String(selectedMethod.pricePerVote));
        
        console.log('💾 Stored pending data:', {
          invoiceId: data.invoiceId,
          candidateId: selectedCandidate.id,
          candidateName: selectedCandidate.name,
          votes: voteCount,
          paymentMethod: paymentMethod,
          pricePerVote: selectedMethod.pricePerVote
        });
        
        setShowVoteModal(false);
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.message || 'Erreur de création du paiement');
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      if (error.message === 'Failed to fetch' || error.message.includes('network')) {
        toast.error('🔧 Problème de connexion au service de paiement. Veuillez réessayer.');
      } else if (error.message && error.message.includes('520')) {
        toast.error('🔧 Le service de paiement par carte est temporairement indisponible. Veuillez réessayer dans quelques minutes.');
      } else {
        toast.error('Erreur de connexion au service de paiement. Veuillez réessayer.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const toggleDescription = (candidateId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId]
    }));
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const missCandidates = candidates.filter(c => c.category?.includes('Miss'));
  const masterCandidates = candidates.filter(c => c.category?.includes('Master'));
  
  const getDisplayedCandidates = () => {
    if (activeCategory === 'miss') return missCandidates;
    if (activeCategory === 'master') return masterCandidates;
    return candidates;
  };

  const displayedCandidates = getDisplayedCandidates();
  const totalPages = Math.ceil(displayedCandidates.length / VOTES_PER_PAGE);
  const paginatedCandidates = displayedCandidates.slice(
    currentPage * VOTES_PER_PAGE,
    (currentPage + 1) * VOTES_PER_PAGE
  );

  const getCategoryIcon = (category) => {
    if (category?.includes('Miss')) return Crown;
    if (category?.includes('Master')) return Award;
    return Users;
  };

  // Get current payment method details
  const currentPaymentMethod = availablePaymentMethods.find(m => m.id === paymentMethod) || availablePaymentMethods[0];

  return (
    <div className="min-h-screen pt-16 pb-24 px-4 max-w-7xl mx-auto">
      {/* Header with Decoration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-6 mb-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Diamond className="w-6 h-6 text-gold-400" />
              <h1 className="text-2xl md:text-4xl font-display font-bold text-white">
                Choisissez votre
                <span className="text-transparent bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text"> Favori</span>
              </h1>
              <Diamond className="w-6 h-6 text-gold-400" />
            </div>
            <p className="text-sm text-gray-400 ml-2">
              {candidates.length} candidats en lice • 
              {currentPaymentMethod ? (
                <span className="text-gold-400 ml-1">
                  {currentPaymentMethod.pricePerVote} FCFA/vote ({currentPaymentMethod.label})
                </span>
              ) : (
                <span className="text-gold-400 ml-1">100 FCFA/vote</span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Category Tabs - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide pb-2"
      >
        <button
          onClick={() => { setActiveCategory('all'); setCurrentPage(0); }}
          className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
            activeCategory === 'all'
              ? 'border-gold-500 bg-gradient-to-r from-gold-500/20 to-gold-600/10 text-gold-400 shadow-lg shadow-gold-500/20'
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
          className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
            activeCategory === 'miss'
              ? 'border-pink-500 bg-gradient-to-r from-pink-500/20 to-pink-600/10 text-pink-400 shadow-lg shadow-pink-500/20'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-pink-500/50'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span className="text-sm font-medium">Miss</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
            {missCandidates.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveCategory('master'); setCurrentPage(0); }}
          className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
            activeCategory === 'master'
              ? 'border-blue-500 bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-400 shadow-lg shadow-blue-500/20'
              : 'border-white/10 bg-white/5 text-gray-400 hover:border-blue-500/50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span className="text-sm font-medium">Master</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
            {masterCandidates.length}
          </span>
        </button>
      </motion.div>

      {/* Candidates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl animate-pulse h-[450px]" />
          ))}
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <AnimatePresence>
              {paginatedCandidates.map((candidate, index) => {
                const isMiss = candidate.category?.includes('Miss');
                const categoryColor = isMiss ? 'text-pink-400' : 'text-blue-400';
                const categoryBadge = isMiss ? '👑 Miss' : '🎩 Master';
                const badgeBg = isMiss 
                  ? 'bg-gradient-to-r from-pink-500 via-pink-400 to-pink-600' 
                  : 'bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600';
                const badgeGlow = isMiss ? 'shadow-pink-500/40' : 'shadow-blue-500/40';
                const Icon = getCategoryIcon(candidate.category);
                const isExpanded = expandedDescriptions[candidate.id] || false;
                const description = candidate.description || '';
                const shouldTruncate = description.length > 120;
                const displayDescription = isExpanded ? description : truncateText(description);
                
                return (
                  <motion.div
                    key={`${candidate.id}-${refreshKey}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.08 }}
                    className="group relative bg-gradient-to-b from-white/5 to-white/0 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-gold-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gold-500/10"
                  >
                    {/* Decorative Corner Elements */}
                    <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-gold-500/20 rounded-tl-2xl z-10" />
                    <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-gold-500/20 rounded-br-2xl z-10" />

                    {/* Sparkle Decoration */}
                    <div className="absolute top-4 left-4 opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                      <Sparkle className="w-4 h-4 text-gold-400 animate-pulse" />
                    </div>
                    
                    {/* Image Container */}
                    <div className="relative h-80 md:h-[420px] overflow-hidden bg-charcoal-800">
                      <img
                        src={candidate.image || 'https://via.placeholder.com/600x450/1a1a1a/d4a800?text=?'}
                        alt={candidate.name}
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                        style={{ objectPosition: 'top center' }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/600x450/1a1a1a/d4a800?text=?';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/20 to-transparent opacity-80" />
                      
                      {/* Premium Diagonal Badge - Large & Visible */}
                      <div className="absolute -top-1 -right-1 z-20">
                        <div className="relative">
                          <div className={`${badgeBg} ${badgeGlow} shadow-xl transform rotate-45 translate-x-[20px] translate-y-[-20px] py-2 px-10`}>
                            <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5 text-white" />
                              {categoryBadge}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Glowing Crown/Halo Decoration */}
                      <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                        <Crown className={`w-12 h-12 ${isMiss ? 'text-pink-400' : 'text-blue-400'}`} />
                      </div>
                      
                      {/* Enhanced Vote Count Badge */}
                      <div className="absolute bottom-4 left-4 bg-charcoal-900/80 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 border border-gold-500/30 shadow-lg shadow-gold-500/10">
                        <Trophy className="w-4 h-4 text-gold-400" />
                        <span className="text-white font-bold">{candidate.votes || 0}</span>
                        <span className="text-gray-400 text-xs">votes</span>
                      </div>

                      {/* Decorative Ribbon Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-5 relative">
                      {/* Small decorative line */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-gold rounded-full" />
                      
                      <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                        {candidate.name}
                        {isMiss ? (
                          <span className="text-pink-400">✨</span>
                        ) : (
                          <span className="text-blue-400">⭐</span>
                        )}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {displayDescription}
                        {shouldTruncate && (
                          <button
                            onClick={() => toggleDescription(candidate.id)}
                            className="text-gold-400 hover:text-gold-300 ml-1 font-medium"
                          >
                            {isExpanded ? ' Voir moins' : ' Lire plus'}
                          </button>
                        )}
                      </p>
                      
                      <button
                        onClick={() => handleVoteClick(candidate)}
                        className="w-full mt-4 relative overflow-hidden bg-gradient-gold text-charcoal-900 py-3.5 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/30 group/btn"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <StarIcon className="w-4 h-4" />
                          Voter
                          <Sparkle className="w-3 h-3" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
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

      {displayedCandidates.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-12">
          <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-lg">Aucun candidat dans cette catégorie</p>
        </div>
      )}

      {/* Vote Modal - With Dynamic Payment Methods */}
      <AnimatePresence>
        {showVoteModal && selectedCandidate && availablePaymentMethods.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/90 backdrop-blur-sm"
            onClick={() => setShowVoteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-charcoal-800 to-charcoal-900 rounded-3xl max-w-md w-full p-6 border border-gold-500/20 max-h-[90vh] overflow-y-auto shadow-2xl shadow-gold-500/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-charcoal-700 border border-gold-500/30">
                  <img
                    src={selectedCandidate.image || 'https://via.placeholder.com/64x64/1a1a1a/d4a800?text=?'}
                    alt={selectedCandidate.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {selectedCandidate.name}
                  </h3>
                  <p className="text-sm text-gold-400 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {selectedCandidate.category}
                  </p>
                </div>
                <button
                  onClick={() => setShowVoteModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Decorative Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
                <Sparkle className="w-4 h-4 text-gold-400" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
              </div>

              {/* ✅ Dynamic Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">
                  Méthode de paiement
                </label>
                <div className={`grid gap-3 ${availablePaymentMethods.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {availablePaymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isActive = paymentMethod === method.id;
                    const priceDisplay = method.pricePerVote;
                    return (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodChange(method.id)}
                        className={`py-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1 ${
                          isActive
                            ? method.activeColor
                            : `border-white/10 hover:${method.borderColor} text-gray-400`
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isActive ? method.textColor : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium ${isActive ? method.textColor : 'text-gray-400'}`}>
                          {method.label}
                        </span>
                        <span className="text-[10px] text-gray-500">{method.description}</span>
                        <span className="text-[10px] text-gold-400">{priceDisplay} FCFA/vote</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vote Input */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Nombre de votes (min: {currentPaymentMethod?.minVotes || 1})
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCustomVotes(Math.max(currentPaymentMethod?.minVotes || 1, customVotes - 1))}
                    className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 flex items-center justify-center border border-white/10 hover:border-gold-500/50"
                  >
                    <Minus className="w-5 h-5 text-gray-400" />
                  </button>
                  <input
                    type="number"
                    min={currentPaymentMethod?.minVotes || 1}
                    max="1000"
                    value={customVotes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (e.target.value === '') {
                        setCustomVotes('');
                      } else if (!isNaN(val) && val >= (currentPaymentMethod?.minVotes || 1)) {
                        setCustomVotes(val);
                      }
                    }}
                    onBlur={() => {
                      if (customVotes === '' || customVotes < (currentPaymentMethod?.minVotes || 1)) {
                        setCustomVotes(currentPaymentMethod?.minVotes || 1);
                      }
                    }}
                    className="flex-1 text-center text-3xl font-bold text-white bg-white/5 border border-white/10 rounded-xl py-3 focus:border-gold-500 focus:outline-none transition-all duration-300"
                    placeholder={String(currentPaymentMethod?.minVotes || 1)}
                  />
                  <button
                    onClick={() => setCustomVotes(Math.min(1000, customVotes + 1))}
                    className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 flex items-center justify-center border border-white/10 hover:border-gold-500/50"
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Minimum {currentPaymentMethod?.minVotes || 1} • Maximum 1000
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[5, 10, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => {
                      const minVotes = currentPaymentMethod?.minVotes || 1;
                      setCustomVotes(Math.max(minVotes, amount));
                    }}
                    className={`py-2 rounded-xl border-2 transition-all duration-300 text-center ${
                      customVotes === Math.max(currentPaymentMethod?.minVotes || 1, amount)
                        ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                        : 'border-white/10 hover:border-gold-500/50 text-gray-400'
                    }`}
                  >
                    <span className="text-sm font-medium">{Math.max(currentPaymentMethod?.minVotes || 1, amount)}</span>
                  </button>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gold-500/10 rounded-xl border border-gold-500/30">
                <span className="text-gray-300">Total à payer</span>
                <span className="text-xl font-bold text-gold-400">
                  {customVotes * (currentPaymentMethod?.pricePerVote || 100)} FCFA
                </span>
              </div>

              {/* Info Text */}
              <p className="text-xs text-gray-500 text-center mb-4 flex items-center justify-center gap-1">
                {paymentMethod === 'card' ? (
                  <>
                    <CreditCard className="w-3 h-3" />
                    Vous serez redirigé vers la page de paiement par carte
                  </>
                ) : (
                  <>
                    <SmartphoneIcon className="w-3 h-3" />
                    Vous serez redirigé vers Fapshi pour finaliser le paiement
                  </>
                )}
              </p>

              {/* Confirm Button */}
              <button
                onClick={handleVoteConfirm}
                disabled={processing}
                className="w-full bg-gradient-gold text-charcoal-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'card' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Wallet className="w-4 h-4" />
                    )}
                    Confirmer le vote
                  </>
                )}
              </button>

              {/* Payment Info */}
              <div className="mt-3 text-center">
                <p className="text-[10px] text-gray-500">
                  {paymentMethod === 'card' && (
                    <>💳 Frais de carte: 2.9% + 0.25€ (ajoutés par CamerPay)</>
                  )}
                  {paymentMethod === 'mobile_money' && (
                    <>📱 Paiement sécurisé via Fapshi</>
                  )}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Voting;