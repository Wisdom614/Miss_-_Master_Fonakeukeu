import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Upload, X, Save, 
  Users, Vote, Crown, Loader2, Image as ImageIcon,
  ArrowLeft, BarChart3, UserPlus, LogOut,
  Settings, DollarSign, Smartphone, Shield,
  Calendar, Clock, TrendingUp, Award,
  ToggleLeft, ToggleRight, CheckCircle,
  AlertCircle, RefreshCw, Eye, EyeOff,
  Sliders, Package, Gift, Zap, Star,
  Sun, Moon, Palette, Type, Layout,
  Database, Cloud, Link, Key,
  Mail, Phone, MapPin, Globe,
  CreditCard, Wallet, Coins, AlertTriangle,
  Trophy
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('candidates');
  const [formData, setFormData] = useState({
    name: '',
    category: 'Miss Fonakeukeu',
    description: '',
    image: '',
    imageFile: null,
    imagePreview: '',
  });
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalCandidates: 0,
    categories: {}
  });
  
  // System Settings
  const [settings, setSettings] = useState({
    siteName: 'Miss & Master Fonakeukeu',
    editionYear: '2026',
    votePrice: 100,
    currency: 'FCFA',
    maxVotesPerUser: 1000,
    minVotesPerUser: 1,
    paymentMethods: ['mtn_money', 'orange_money'],
    defaultPaymentMethod: 'mtn_money',
    maintenanceMode: false,
    resultsVisible: true,
    votingEnabled: true,
    contactEmail: 'contact@fonakeukeu.com',
    contactPhone: '699123456',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    },
    theme: {
      primaryColor: '#d4a800',
      secondaryColor: '#1a1a1a',
      accentColor: '#f3d05f'
    },
    // Payment Settings
    payment: {
      mobileMoney: {
        enabled: true,
        minVotes: 1,
        pricePerVote: 100,
        provider: 'fapshi',
      },
      card: {
        enabled: true,
        minVotes: 10,
        pricePerVote: 150,
        provider: 'camerpay',
        feePercentage: 2.9,
        feeFixed: 0.25,
      },
      currency: 'FCFA',
    },
    // System Shutdown
    systemShutdown: {
      enabled: false,
      message: 'Le système est temporairement indisponible. Veuillez réessayer dans quelques minutes.',
      title: '🔧 Système en cours de maintenance',
      showTimer: false,
      estimatedTime: '30 minutes',
    },
    // Winner Announcement
    showWinners: false,
    countdown: {
      enabled: false,
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Votez maintenant !',
      subtitle: 'Le concours se termine dans',
      showOnHomepage: true,
      showOnVotingPage: true,
      expiredMessage: 'Le vote est terminé !',
      redirectOnExpiry: false,
      redirectUrl: '/results'
    },
    votePackages: [
      { votes: 1, label: '1 Vote', icon: 'Star', price: 100 },
      { votes: 5, label: '5 Votes', icon: 'Sparkle', price: 500 },
      { votes: 20, label: '20 Votes', icon: 'Zap', price: 2000 },
      { votes: 50, label: '50 Votes', icon: 'Shield', price: 5000 },
      { votes: 100, label: '100 Votes', icon: 'Trophy', price: 10000 }
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.email || 'system'
  });

  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [showShutdownPreview, setShowShutdownPreview] = useState(false);
  const navigate = useNavigate();

  const categories = ['Miss Fonakeukeu', 'Master Fonakeukeu'];

  // Real-time listener for candidates
  useEffect(() => {
    const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const candidatesData = [];
      let totalVotes = 0;
      const categoryCount = {};

      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        candidatesData.push(data);
        totalVotes += data.votes || 0;
        
        const cat = data.category || 'Uncategorized';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      setCandidates(candidatesData);
      setStats({
        totalVotes,
        totalCandidates: snapshot.size,
        categories: categoryCount
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-create system settings if they don't exist
  const initializeSystemSettings = async () => {
    try {
      const settingsRef = doc(db, 'system', 'settings');
      const settingsDoc = await getDoc(settingsRef);
      
      if (!settingsDoc.exists()) {
        const defaultSettings = {
          siteName: 'Miss & Master Fonakeukeu',
          editionYear: '2026',
          votePrice: 100,
          currency: 'FCFA',
          maxVotesPerUser: 1000,
          minVotesPerUser: 1,
          paymentMethods: ['mtn_money', 'orange_money'],
          defaultPaymentMethod: 'mtn_money',
          maintenanceMode: false,
          resultsVisible: true,
          votingEnabled: true,
          contactEmail: 'contact@fonakeukeu.com',
          contactPhone: '699123456',
          socialLinks: {
            facebook: '',
            instagram: '',
            twitter: '',
            youtube: ''
          },
          theme: {
            primaryColor: '#d4a800',
            secondaryColor: '#1a1a1a',
            accentColor: '#f3d05f'
          },
          payment: {
            mobileMoney: {
              enabled: true,
              minVotes: 1,
              pricePerVote: 100,
              provider: 'fapshi',
            },
            card: {
              enabled: true,
              minVotes: 10,
              pricePerVote: 150,
              provider: 'camerpay',
              feePercentage: 2.9,
              feeFixed: 0.25,
            },
            currency: 'FCFA',
          },
          systemShutdown: {
            enabled: false,
            message: 'Le système est temporairement indisponible. Veuillez réessayer dans quelques minutes.',
            title: '🔧 Système en cours de maintenance',
            showTimer: false,
            estimatedTime: '30 minutes',
          },
          showWinners: false,
          countdown: {
            enabled: false,
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            title: 'Votez maintenant !',
            subtitle: 'Le concours se termine dans',
            showOnHomepage: true,
            showOnVotingPage: true,
            expiredMessage: 'Le vote est terminé !',
            redirectOnExpiry: false,
            redirectUrl: '/results'
          },
          votePackages: [
            { votes: 1, label: '1 Vote', icon: 'Star', price: 100 },
            { votes: 5, label: '5 Votes', icon: 'Sparkle', price: 500 },
            { votes: 20, label: '20 Votes', icon: 'Zap', price: 2000 },
            { votes: 50, label: '50 Votes', icon: 'Shield', price: 5000 },
            { votes: 100, label: '100 Votes', icon: 'Trophy', price: 10000 }
          ],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.email || 'system'
        };
        
        await setDoc(settingsRef, defaultSettings);
        console.log('✅ System settings created successfully!');
        toast.success('Paramètres système initialisés');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing settings:', error);
      toast.error('Erreur lors de l\'initialisation des paramètres');
      return false;
    }
  };

  // Load settings with auto-creation
  const loadSettings = async () => {
    try {
      const settingsRef = doc(db, 'system', 'settings');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
        setSettingsLoading(false);
      } else {
        const created = await initializeSystemSettings();
        if (created) {
          const newDoc = await getDoc(settingsRef);
          if (newDoc.exists()) {
            setSettings(newDoc.data());
          }
        }
        setSettingsLoading(false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      await initializeSystemSettings();
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = formData.imagePreview;

      if (formData.imageFile) {
        imageUrl = await uploadImageToCloudinary(formData.imageFile);
      }

      const candidateData = {
        name: formData.name,
        category: formData.category,
        description: formData.description || '',
        image: imageUrl || 'https://via.placeholder.com/400x400/1a1a1a/d4a800?text=Candidate',
        votes: 0,
        updatedAt: serverTimestamp(),
      };

      if (editingCandidate) {
        await updateDoc(doc(db, 'candidates', editingCandidate.id), {
          ...candidateData,
          updatedAt: serverTimestamp(),
        });
        toast.success('Candidat mis à jour !');
      } else {
        await addDoc(collection(db, 'candidates'), {
          ...candidateData,
          createdAt: serverTimestamp(),
        });
        toast.success('Candidat ajouté !');
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving candidate:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer ${name} ?`)) return;

    try {
      await deleteDoc(doc(db, 'candidates', id));
      toast.success(`${name} supprimé`);
    } catch (error) {
      console.error('Error deleting candidate:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value
      }
    }));
  };

  const handleThemeChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [name]: value
      }
    }));
  };

  const handlePaymentChange = (e, method, field) => {
    const { value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        [method]: {
          ...prev.payment?.[method],
          [field]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
        }
      }
    }));
  };

  const handleShutdownChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      systemShutdown: {
        ...prev.systemShutdown,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      const settingsRef = doc(db, 'system', 'settings');
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.email || 'admin'
      });
      toast.success('Paramètres sauvegardés !');
      setEditingSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSettingsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Miss Fonakeukeu',
      description: '',
      image: '',
      imageFile: null,
      imagePreview: '',
    });
    setEditingCandidate(null);
  };

  const openEditModal = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      category: candidate.category || 'Miss Fonakeukeu',
      description: candidate.description || '',
      image: candidate.image || '',
      imageFile: null,
      imagePreview: candidate.image || '',
    });
    setShowModal(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Déconnexion réussie');
      navigate('/admin');
    } catch (error) {
      toast.error('Erreur de déconnexion');
    }
  };

  const getCategoryColor = (category) => {
    if (category?.includes('Miss')) return 'text-pink-400';
    if (category?.includes('Master')) return 'text-blue-400';
    return 'text-gray-400';
  };

  const getCategoryIcon = (category) => {
    if (category?.includes('Miss')) return '👑';
    if (category?.includes('Master')) return '🎩';
    return '⭐';
  };

  // Check if user is admin
  const isAdmin = auth.currentUser?.email === 'admin@fonakeukeu.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
          <h2 className="text-2xl font-display text-white mb-2">Accès Restreint</h2>
          <p className="text-gray-400">Vous n'avez pas les droits pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-12 bg-gradient-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-white">
                Administration
              </h1>
              <p className="text-xs text-gray-400">Gérez votre plateforme de vote</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            {/* 🏆 Winner Announcement Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/winners')}
              className="px-4 py-2 bg-gradient-gold text-charcoal-900 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 transition-all duration-300"
            >
              <Trophy className="w-4 h-4" />
              🏆 Gagnants
            </motion.button>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </motion.div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Users, label: 'Candidats', value: stats.totalCandidates, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Vote, label: 'Votes Total', value: stats.totalVotes, color: 'text-gold-500', bg: 'bg-gold-500/10' },
            { icon: Crown, label: 'Miss', value: stats.categories['Miss Fonakeukeu'] || 0, color: 'text-pink-400', bg: 'bg-pink-500/10' },
            { icon: Crown, label: 'Master', value: stats.categories['Master Fonakeukeu'] || 0, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bg} rounded-2xl p-4 border border-white/5`}
            >
              <div className="flex items-center justify-between">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* System Status Alert */}
        {settings.systemShutdown?.enabled && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <div>
                <p className="text-sm text-red-400 font-medium">⚠️ Système en arrêt d'urgence</p>
                <p className="text-xs text-red-400/70">{settings.systemShutdown.message}</p>
              </div>
            </div>
            <button
              onClick={() => setShowShutdownPreview(true)}
              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-all duration-300"
            >
              Voir l'aperçu
            </button>
          </div>
        )}

        {/* Winner Announcement Status */}
        {settings.showWinners && (
          <div className="bg-gold-500/10 border border-gold-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-gold-400 animate-pulse" />
              <div>
                <p className="text-sm text-gold-400 font-medium">🎉 Gagnants annoncés!</p>
                <p className="text-xs text-gold-400/70">Les utilisateurs voient la page de célébration</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/winners')}
              className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-lg text-xs hover:bg-gold-500/30 transition-all duration-300"
            >
              Voir la célébration
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6 scrollbar-hide pb-2">
          {[
            { id: 'candidates', icon: Users, label: 'Candidats' },
            { id: 'settings', icon: Settings, label: 'Paramètres' },
            { id: 'stats', icon: BarChart3, label: 'Statistiques' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'candidates' && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Add Button */}
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="w-full bg-gradient-gold text-charcoal-900 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 mb-4 shadow-lg shadow-gold-500/20"
              >
                <UserPlus className="w-5 h-5" />
                Ajouter un Candidat
              </button>

              {/* Candidates List */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl animate-pulse h-20" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {candidates.map((candidate, index) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5"
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Image */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-charcoal-800">
                          <img
                            src={candidate.image || 'https://via.placeholder.com/64x64/1a1a1a/d4a800?text=?'}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/64x64/1a1a1a/d4a800?text=?';
                            }}
                          />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {candidate.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs ${getCategoryColor(candidate.category)}`}>
                              {getCategoryIcon(candidate.category)} {candidate.category}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span className="text-xs text-gray-400">
                              {candidate.votes || 0} votes
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(candidate)}
                            className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(candidate.id, candidate.name)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {candidates.length === 0 && !loading && (
                <div className="text-center text-gray-400 py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-lg">Aucun candidat</p>
                  <p className="text-sm">Cliquez sur "Ajouter un Candidat"</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h2 className="text-lg font-display text-white">Paramètres du système</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      if (window.confirm('Réinitialiser les paramètres par défaut ?')) {
                        const success = await initializeSystemSettings();
                        if (success) {
                          toast.success('Paramètres réinitialisés');
                          const settingsRef = doc(db, 'system', 'settings');
                          const newDoc = await getDoc(settingsRef);
                          if (newDoc.exists()) {
                            setSettings(newDoc.data());
                          }
                        }
                      }
                    }}
                    className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-500/30 transition-all duration-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Réinitialiser
                  </button>
                  <button
                    onClick={editingSettings ? saveSettings : () => setEditingSettings(true)}
                    disabled={settingsLoading}
                    className="px-4 py-2 bg-gold-500/20 text-gold-400 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gold-500/30 transition-all duration-300"
                  >
                    {editingSettings ? (
                      settingsLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )
                    ) : (
                      <Settings className="w-4 h-4" />
                    )}
                    {editingSettings ? 'Sauvegarder' : 'Modifier'}
                  </button>
                </div>
              </div>

              {/* Settings Form */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 space-y-4">
                {/* General Settings */}
                <div>
                  <h3 className="text-sm font-semibold text-gold-400 mb-3 flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Paramètres généraux
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Nom du site</label>
                      <input
                        type="text"
                        name="siteName"
                        value={settings.siteName}
                        onChange={handleSettingsChange}
                        disabled={!editingSettings}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-gold-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Édition</label>
                      <input
                        type="text"
                        name="editionYear"
                        value={settings.editionYear}
                        onChange={handleSettingsChange}
                        disabled={!editingSettings}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-gold-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Settings */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gold-400 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Paramètres de paiement
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Mobile Money Settings */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-blue-400" />
                        Mobile Money (Fapshi)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                          <span className="text-sm text-gray-400">Activer</span>
                          <input
                            type="checkbox"
                            checked={settings.payment?.mobileMoney?.enabled !== false}
                            onChange={(e) => handlePaymentChange(e, 'mobileMoney', 'enabled')}
                            disabled={!editingSettings}
                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-gold-500 focus:ring-gold-500"
                          />
                        </label>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Prix / vote (FCFA)</label>
                          <input
                            type="number"
                            value={settings.payment?.mobileMoney?.pricePerVote || 100}
                            onChange={(e) => handlePaymentChange(e, 'mobileMoney', 'pricePerVote')}
                            disabled={!editingSettings}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-gold-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Votes minimum</label>
                          <input
                            type="number"
                            min="1"
                            value={settings.payment?.mobileMoney?.minVotes || 1}
                            onChange={(e) => handlePaymentChange(e, 'mobileMoney', 'minVotes')}
                            disabled={!editingSettings}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-gold-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Payment Settings */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gold-400" />
                        Carte Bancaire (CamerPay)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10">
                          <span className="text-sm text-gray-400">Activer</span>
                          <input
                            type="checkbox"
                            checked={settings.payment?.card?.enabled !== false}
                            onChange={(e) => handlePaymentChange(e, 'card', 'enabled')}
                            disabled={!editingSettings}
                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-gold-500 focus:ring-gold-500"
                          />
                        </label>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Prix / vote (FCFA)</label>
                          <input
                            type="number"
                            value={settings.payment?.card?.pricePerVote || 150}
                            onChange={(e) => handlePaymentChange(e, 'card', 'pricePerVote')}
                            disabled={!editingSettings}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-gold-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Votes minimum</label>
                          <input
                            type="number"
                            min="1"
                            value={settings.payment?.card?.minVotes || 10}
                            onChange={(e) => handlePaymentChange(e, 'card', 'minVotes')}
                            disabled={!editingSettings}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-gold-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        <p>💳 Les frais de carte (2.9% + 0.25€) sont automatiquement ajoutés par CamerPay</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Shutdown Section */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Arrêt d'urgence du système
                  </h3>
                  
                  <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
                    <div className="space-y-3">
                      {/* Enable/Disable Shutdown */}
                      <label className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <div>
                            <span className="text-sm font-medium text-white">Activer l'arrêt du système</span>
                            <p className="text-xs text-gray-500">Les utilisateurs verront un message d'indisponibilité</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.systemShutdown?.enabled || false}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              systemShutdown: {
                                ...prev.systemShutdown,
                                enabled: e.target.checked
                              }
                            }));
                          }}
                          disabled={!editingSettings}
                          className="w-5 h-5 rounded border-red-500/30 bg-red-500/10 text-red-500 focus:ring-red-500"
                        />
                      </label>

                      {/* Shutdown Title */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Titre du message</label>
                        <input
                          type="text"
                          value={settings.systemShutdown?.title || '🔧 Système indisponible'}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              systemShutdown: {
                                ...prev.systemShutdown,
                                title: e.target.value
                              }
                            }));
                          }}
                          disabled={!editingSettings}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                          placeholder="Titre du message d'arrêt"
                        />
                      </div>

                      {/* Shutdown Message */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Message personnalisé</label>
                        <textarea
                          value={settings.systemShutdown?.message || 'Le système est temporairement indisponible. Veuillez réessayer dans quelques minutes.'}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              systemShutdown: {
                                ...prev.systemShutdown,
                                message: e.target.value
                              }
                            }));
                          }}
                          disabled={!editingSettings}
                          rows="3"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all duration-300 disabled:opacity-50 resize-none"
                          placeholder="Message personnalisé pour les utilisateurs..."
                        />
                      </div>

                      {/* Estimated Time */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Temps estimé (optionnel)
                          <span className="text-gray-500 ml-1">- laissé vide pour ne pas afficher</span>
                        </label>
                        <input
                          type="text"
                          value={settings.systemShutdown?.estimatedTime || ''}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              systemShutdown: {
                                ...prev.systemShutdown,
                                estimatedTime: e.target.value
                              }
                            }));
                          }}
                          disabled={!editingSettings}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                          placeholder="Ex: 30 minutes, 1 heure, jusqu'à 18h"
                        />
                      </div>

                      {/* Show Timer Toggle */}
                      <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <span className="text-sm text-gray-400">Afficher un compte à rebours</span>
                        <input
                          type="checkbox"
                          checked={settings.systemShutdown?.showTimer || false}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              systemShutdown: {
                                ...prev.systemShutdown,
                                showTimer: e.target.checked
                              }
                            }));
                          }}
                          disabled={!editingSettings}
                          className="w-5 h-5 rounded border-white/10 bg-white/5 text-red-500 focus:ring-red-500"
                        />
                      </label>

                      {/* Preview Button */}
                      {settings.systemShutdown?.enabled && (
                        <button
                          onClick={() => setShowShutdownPreview(true)}
                          className="w-full py-2 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-all duration-300"
                        >
                          Voir l'aperçu du message
                        </button>
                      )}

                      {/* Warning */}
                      {settings.systemShutdown?.enabled && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                          <p className="text-red-400 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            ⚠️ Le système est actuellement en arrêt. Les utilisateurs ne peuvent pas voter.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Winner Announcement Control */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gold-400 mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Annonce des gagnants
                  </h3>
                  
                  <div className="bg-gold-500/5 rounded-xl p-4 border border-gold-500/20">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white font-medium">Afficher les gagnants</p>
                          <p className="text-xs text-gray-500">Les utilisateurs verront la page de célébration</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const settingsRef = doc(db, 'system', 'settings');
                                await setDoc(settingsRef, {
                                  ...settings,
                                  showWinners: true,
                                  updatedAt: serverTimestamp(),
                                  updatedBy: auth.currentUser?.email || 'admin'
                                }, { merge: true });
                                toast.success('🎉 Les gagnants sont maintenant visibles!');
                                window.open('/winners', '_blank');
                              } catch (error) {
                                console.error('Error showing winners:', error);
                                toast.error('Erreur lors de l\'affichage');
                              }
                            }}
                            className="px-4 py-2 bg-gradient-gold text-charcoal-900 rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-300"
                          >
                            <Trophy className="w-4 h-4" />
                            🎉 Annoncer maintenant
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <div>
                          <p className="text-sm text-gray-400">Statut actuel</p>
                          <p className={`text-xs font-medium ${settings.showWinners ? 'text-green-400' : 'text-gray-500'}`}>
                            {settings.showWinners ? '✅ Gagnants visibles' : '⏳ En attente d\'annonce'}
                          </p>
                        </div>
                        {settings.showWinners && (
                          <button
                            onClick={async () => {
                              try {
                                const settingsRef = doc(db, 'system', 'settings');
                                await setDoc(settingsRef, {
                                  ...settings,
                                  showWinners: false,
                                  updatedAt: serverTimestamp(),
                                  updatedBy: auth.currentUser?.email || 'admin'
                                }, { merge: true });
                                toast.success('Annonce masquée');
                                window.location.reload();
                              } catch (error) {
                                console.error('Error hiding winners:', error);
                                toast.error('Erreur lors du masquage');
                              }
                            }}
                            className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-all duration-300"
                          >
                            Masquer
                          </button>
                        )}
                      </div>
                      
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                        <p className="text-yellow-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {settings.showWinners 
                            ? '🎉 Les gagnants sont actuellement visibles sur le site' 
                            : '📢 Cliquez sur "Annoncer maintenant" pour révéler les gagnants'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Controls */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gold-400 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Contrôles système
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-sm text-gray-400">Mode maintenance</span>
                      <input
                        type="checkbox"
                        name="maintenanceMode"
                        checked={settings.maintenanceMode}
                        onChange={handleSettingsChange}
                        disabled={!editingSettings}
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-gold-500 focus:ring-gold-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-sm text-gray-400">Résultats visibles</span>
                      <input
                        type="checkbox"
                        name="resultsVisible"
                        checked={settings.resultsVisible}
                        onChange={handleSettingsChange}
                        disabled={!editingSettings}
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-gold-500 focus:ring-gold-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-sm text-gray-400">Votes activés</span>
                      <input
                        type="checkbox"
                        name="votingEnabled"
                        checked={settings.votingEnabled}
                        onChange={handleSettingsChange}
                        disabled={!editingSettings}
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-gold-500 focus:ring-gold-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gold-400 mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Email</label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={settings.contactEmail}
                        onChange={handleSettingsChange}
                        disabled={!editingSettings}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-gold-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Téléphone</label>
                      <input
                        type="text"
                        name="contactPhone"
                        value={settings.contactPhone}
                        onChange={handleSettingsChange}
                        disabled={!editingSettings}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-gold-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gold-400 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Réseaux sociaux
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['facebook', 'instagram', 'twitter', 'youtube'].map((platform) => (
                      <div key={platform}>
                        <label className="block text-xs text-gray-400 mb-1 capitalize">{platform}</label>
                        <input
                          type="text"
                          name={platform}
                          value={settings.socialLinks?.[platform] || ''}
                          onChange={handleSocialLinkChange}
                          disabled={!editingSettings}
                          placeholder={`https://${platform}.com/...`}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-gold-500 focus:outline-none transition-all duration-300 disabled:opacity-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-display text-white mb-4">Statistiques détaillées</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Votes par catégorie</h3>
                    {Object.entries(stats.categories).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-sm text-white">{category}</span>
                        <span className="text-sm text-gold-400 font-bold">{count}</span>
                      </div>
                    ))}
                    {Object.keys(stats.categories).length === 0 && (
                      <p className="text-sm text-gray-500">Aucune donnée disponible</p>
                    )}
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Informations système</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Total votes</span>
                        <span className="text-sm text-white font-bold">{stats.totalVotes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Total candidats</span>
                        <span className="text-sm text-white font-bold">{stats.totalCandidates}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Revenus estimés</span>
                        <span className="text-sm text-gold-400 font-bold">
                          {stats.totalVotes * 97} FCFA
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Moyenne votes/candidat</span>
                        <span className="text-sm text-white font-bold">
                          {stats.totalCandidates > 0 ? (stats.totalVotes / stats.totalCandidates).toFixed(1) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-charcoal-900/90 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-charcoal-800 rounded-3xl w-full max-w-md p-6 border border-white/10 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-display text-white">
                    {editingCandidate ? 'Modifier' : 'Ajouter'} un Candidat
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-full hover:bg-white/10 transition-all duration-300"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleCandidateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nom complet</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none transition-all duration-300"
                      placeholder="Ex: Assonfack Fessane Miranda"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Catégorie</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none transition-all duration-300"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat} className="bg-charcoal-800">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-gold-500 focus:outline-none transition-all duration-300 resize-none"
                      placeholder="Courte description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Photo</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-gold-500/50 transition-all duration-300 overflow-hidden"
                      >
                        {formData.imagePreview ? (
                          <img
                            src={formData.imagePreview}
                            alt="Preview"
                            className="h-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <span className="text-sm">Cliquez pour uploader</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-gradient-gold text-charcoal-900 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Upload...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {editingCandidate ? 'Mettre à jour' : 'Ajouter'}
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shutdown Preview Modal */}
        <AnimatePresence>
          {showShutdownPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/90 backdrop-blur-sm"
              onClick={() => setShowShutdownPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-b from-charcoal-800 to-charcoal-900 rounded-3xl max-w-md w-full p-8 border border-red-500/20 shadow-2xl shadow-red-500/10 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
                  <div className="relative z-10 w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                </div>

                <h1 className="text-2xl font-display font-bold text-white mb-2">
                  {settings.systemShutdown?.title || '🔧 Système indisponible'}
                </h1>

                <p className="text-gray-300 mb-6 leading-relaxed">
                  {settings.systemShutdown?.message || 'Le système est temporairement indisponible. Veuillez réessayer dans quelques minutes.'}
                </p>

                {settings.systemShutdown?.estimatedTime && (
                  <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Disponible dans environ :</span>
                      <span className="text-white font-semibold">
                        {settings.systemShutdown.estimatedTime}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowShutdownPreview(false)}
                  className="w-full bg-gradient-gold text-charcoal-900 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-300"
                >
                  Fermer l'aperçu
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;