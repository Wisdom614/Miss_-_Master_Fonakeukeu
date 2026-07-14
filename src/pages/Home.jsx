import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Crown, Users, Award, Sparkles, ArrowRight, Star, Vote, 
  Gem, Shield, Zap, ChevronRight, Heart, Trophy, 
  Calendar, Clock, TrendingUp, CheckCircle
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import CountdownTimer from '../components/CountdownTimer';

const Home = () => {
  const [stats, setStats] = useState({ totalVotes: 0, candidates: 0 });
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const candidatesSnapshot = await getDocs(collection(db, 'candidates'));
        let totalVotes = 0;
        candidatesSnapshot.forEach(doc => {
          totalVotes += doc.data().votes || 0;
        });
        
        const settingsRef = doc(db, 'system', 'settings');
        const settingsDoc = await getDoc(settingsRef);
        
        setStats({
          totalVotes,
          candidates: candidatesSnapshot.size
        });
        
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data());
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const heroBackground = "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=1600&q=80";
  const siteName = settings?.siteName || 'Miss & Master Fonakeukeu';
  const editionYear = settings?.editionYear || '2026';
  const votePrice = settings?.votePrice || 100;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/85 via-charcoal-900/70 to-charcoal-900/90" />
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-sm text-gold-400 font-medium">Édition {editionYear}</span>
            </motion.div>

            {/* Crown Icon */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gold-500/20 blur-2xl" />
                <Crown className="w-16 h-16 text-gold-500 relative z-10 mx-auto" />
              </div>
            </motion.div>

            {/* Title - Fixed Gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4"
            >
              <span className="text-white">{siteName}</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed px-4"
            >
              Un vote, un ruban d'or pour votre favori. Chaque vote compte et transforme les rêves en réalité.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/vote" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(212,168,0,0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 bg-300% animate-gradient text-charcoal-900 px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-gold-500/30 hover:shadow-gold-500/50 transition-all duration-300 overflow-hidden w-full"
                >
                  <span className="relative z-10">Voter Maintenant</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                </motion.button>
              </Link>
              <Link to="/results" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 hover:border-gold-400 transition-all duration-300 backdrop-blur-sm w-full"
                >
                  Voir les Résultats
                  <ChevronRight className="w-4 h-4 inline ml-2 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </motion.div>

            {/* Countdown Timer */}
            {settings?.countdown?.enabled && settings?.countdown?.showOnHomepage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 max-w-2xl mx-auto"
              >
                <CountdownTimer
                  targetDate={settings.countdown.targetDate}
                  title={settings.countdown.title}
                  subtitle={settings.countdown.subtitle}
                  size="default"
                />
              </motion.div>
            )}

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-10 max-w-2xl mx-auto"
            >
              {[
                { icon: Vote, label: 'Votes', value: stats.totalVotes, color: 'from-gold-500/20 to-gold-600/10', iconColor: 'text-gold-400' },
                { icon: Users, label: 'Candidats', value: stats.candidates, color: 'from-blue-500/20 to-blue-600/10', iconColor: 'text-blue-400' },
                { icon: Trophy, label: 'Catégories', value: 2, color: 'from-purple-500/20 to-purple-600/10', iconColor: 'text-purple-400' },
                { icon: Gem, label: 'Prix/vote', value: `${votePrice} FCFA`, color: 'from-rose-500/20 to-rose-600/10', iconColor: 'text-rose-400' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={`relative overflow-hidden rounded-xl p-4 backdrop-blur-xl bg-gradient-to-br ${stat.color} border border-white/10 text-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.iconColor} mx-auto mb-1`} />
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-500 text-xs"
          >
            <span className="block">Découvrir</span>
            <ChevronRight className="w-4 h-4 rotate-90 mx-auto mt-1" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-b from-charcoal-900 to-charcoal-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1 bg-gold-500/10 border border-gold-500/30 rounded-full text-gold-400 text-sm font-medium mb-4">
              Pourquoi voter ?
            </span>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-white">
              Une expérience <span></span>
              <span className="text-transparent bg-gradient-to-r from-yellow-300 via-gold-400 to-yellow-500 bg-clip-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                 unique
              </span>
            </h2>
            <p className="text-gray-400 mt-2 max-w-2xl mx-auto text-sm md:text-base">
              Découvrez pourquoi des milliers de personnes font confiance à notre plateforme
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                icon: Shield,
                title: 'Paiement Sécurisé',
                description: 'Transactions protégées par MTN Mobile Money & Orange Money',
                color: 'from-emerald-500/10 to-emerald-600/5',
                iconColor: 'text-emerald-400'
              },
              {
                icon: Zap,
                title: 'Votes en Temps Réel',
                description: 'Le classement se met à jour automatiquement après chaque vote',
                color: 'from-amber-500/10 to-amber-600/5',
                iconColor: 'text-amber-400'
              },
              {
                icon: CheckCircle,
                title: '100% Transparent',
                description: 'Chaque vote est compté et visible par tous en temps réel',
                color: 'from-rose-500/10 to-rose-600/5',
                iconColor: 'text-rose-400'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className={`group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br ${feature.color} border border-white/10`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 via-gold-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h3 className="font-display text-xl md:text-3xl font-bold text-white mb-2">
              Prêt à faire la différence ?
            </h3>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-6">
              Chaque vote est un pas vers la victoire de votre favori.
            </p>
            <Link to="/vote">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(212,168,0,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-yellow-400 via-gold-500 to-yellow-400 text-charcoal-900 px-8 py-3 rounded-full font-bold text-base flex items-center gap-2 mx-auto shadow-2xl shadow-gold-500/30 hover:shadow-gold-500/50 transition-all duration-300"
              >
                <Crown className="w-4 h-4" />
                Voter Maintenant
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;