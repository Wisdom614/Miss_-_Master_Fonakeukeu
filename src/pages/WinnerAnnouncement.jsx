import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Trophy,
  Sparkles,
  Star,
  Heart,
  Users,
  ArrowLeft,
  PartyPopper,
  Settings,
  Gem,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const FALLBACK_IMAGE = 'https://via.placeholder.com/480x640/17251e/e8c56a?text=?';

const CONFETTI_COLORS = ['#f5d878', '#d4a800', '#e8c56a', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'];

const triggerCelebration = (onStart, onEnd) => {
  onStart?.();

  const duration = 3200;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 8,
      startVelocity: 32,
      spread: 70,
      origin: { y: 0.58, x: Math.random() },
      colors: CONFETTI_COLORS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  setTimeout(() => {
    confetti({ particleCount: 120, spread: 110, origin: { y: 0.48 }, colors: CONFETTI_COLORS, startVelocity: 42 });
  }, 900);

  setTimeout(() => {
    confetti({ particleCount: 90, spread: 85, origin: { y: 0.42, x: 0.18 }, colors: CONFETTI_COLORS, startVelocity: 36 });
    confetti({ particleCount: 90, spread: 85, origin: { y: 0.42, x: 0.82 }, colors: CONFETTI_COLORS, startVelocity: 36 });
  }, 1800);

  setTimeout(() => onEnd?.(), 4200);
};

const WinnerCard = ({ winner, variant, title, subtitle, delay = 0, voteShare = 0 }) => {
  if (!winner) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`winner-card winner-card--${variant}`}
    >
      <div className={`winner-card__glow winner-card__glow--tl`} />
      <div className={`winner-card__glow winner-card__glow--br`} />

      <div className="winner-card__image-wrap">
        <span className="winner-card__ribbon">{title}</span>
        <span className="winner-card__badge">
          <Trophy className="h-3.5 w-3.5" />
          Gagnant
        </span>
        <span className="winner-card__frame" aria-hidden="true" />
        <img
          src={winner.image || FALLBACK_IMAGE}
          alt={winner.name}
          onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
        />
      </div>

      <div className="winner-card__crown" aria-hidden="true">
        <Crown className="h-6 w-6 text-gold-300" />
      </div>

      <div className="winner-card__body">
        <p className="winner-card__eyebrow">
          <Sparkles className="h-3 w-3 text-gold-400" />
          <span>{subtitle}</span>
        </p>
        <h2 className="winner-card__name">{winner.name}</h2>

        <div className="winner-card__votes">
          <Star className="h-5 w-5 shrink-0 text-gold-400" />
          <div>
            <p className="winner-card__votes-value">{winner.votes || 0}</p>
            <p className="winner-card__votes-label">votes enregistrés</p>
          </div>
        </div>

        {voteShare > 0 && (
          <p className="winner-card__share">{voteShare.toFixed(1)}% des votes de sa catégorie</p>
        )}
      </div>
    </motion.article>
  );
};

const WinnerAnnouncement = () => {
  const [loading, setLoading] = useState(true);
  const [missWinner, setMissWinner] = useState(null);
  const [masterWinner, setMasterWinner] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [missCategoryTotal, setMissCategoryTotal] = useState(0);
  const [masterCategoryTotal, setMasterCategoryTotal] = useState(0);
  const [settings, setSettings] = useState(null);
  const [activeConfetti, setActiveConfetti] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const settingsRef = doc(db, 'system', 'settings');
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings(data);
          if (!data.showWinners) {
            navigate('/');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking visibility:', error);
      }

      await fetchWinners();
    };

    init();
  }, [navigate]);

  const fetchWinners = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'candidates'));

      let missCandidates = [];
      let masterCandidates = [];
      let votesSum = 0;

      snapshot.forEach((candidateDoc) => {
        const data = { id: candidateDoc.id, ...candidateDoc.data() };
        votesSum += data.votes || 0;
        if (data.category?.includes('Miss')) missCandidates.push(data);
        else if (data.category?.includes('Master')) masterCandidates.push(data);
      });

      missCandidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      masterCandidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));

      const missVotesTotal = missCandidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
      const masterVotesTotal = masterCandidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);

      const topMiss = missCandidates[0] || null;
      const topMaster = masterCandidates[0] || null;

      setMissWinner(topMiss);
      setMasterWinner(topMaster);
      setTotalVotes(votesSum);
      setMissCategoryTotal(missVotesTotal);
      setMasterCategoryTotal(masterVotesTotal);
      setLoading(false);

      if (topMiss || topMaster) {
        setTimeout(() => {
          triggerCelebration(
            () => setActiveConfetti(true),
            () => setActiveConfetti(false),
          );
        }, 700);
      }
    } catch (error) {
      console.error('Error fetching winners:', error);
      setLoading(false);
    }
  };

  const handleCelebrate = () => {
    if (activeConfetti) return;
    triggerCelebration(
      () => setActiveConfetti(true),
      () => setActiveConfetti(false),
    );
  };

  const missShare = missCategoryTotal && missWinner ? ((missWinner.votes || 0) / missCategoryTotal) * 100 : 0;
  const masterShare = masterCategoryTotal && masterWinner ? ((masterWinner.votes || 0) / masterCategoryTotal) * 100 : 0;
  const hasWinners = Boolean(missWinner || masterWinner);

  if (loading) {
    return (
      <div className="winners-page flex min-h-screen items-center justify-center px-5">
        <div className="winners-page__bg" />
        <div className="relative text-center">
          <div className="winners-loading__ring">
            <Crown className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-gold-400" />
          </div>
          <p className="mt-6 font-display text-2xl text-white">Préparation de l&apos;annonce</p>
          <p className="mt-2 text-sm text-gray-500">Chargement des résultats officiels…</p>
        </div>
      </div>
    );
  }

  const siteName = settings?.siteName || 'Miss & Master Fonakeukeu';
  const editionYear = settings?.editionYear || '2026';

  return (
    <div ref={containerRef} className="winners-page">
      <div className="winners-page__bg" />
      <div className="winners-page__ring winners-page__ring--one" />
      <div className="winners-page__ring winners-page__ring--two" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-14 sm:px-8 sm:py-20">
        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="winners-hero mb-12 sm:mb-16"
        >
          <div className="lux-eyebrow mx-auto mb-5 w-fit">
            <Gem className="h-3.5 w-3.5" />
            Annonce officielle · {editionYear}
          </div>

          <h1 className="winners-hero__title font-display font-bold text-white">
            Les <span>Gagnants</span>
          </h1>

          <div className="winners-hero__divider" />

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
            {siteName} couronne ce soir les lauréats élus par votre soutien.
            Merci à toutes et à tous pour votre participation.
          </p>

          {hasWinners && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.55 }}
              className="winners-stats"
            >
              <div className="winners-stats__item">
                <p className="winners-stats__value">{totalVotes.toLocaleString('fr-FR')}</p>
                <p className="winners-stats__label">Votes totaux</p>
              </div>
              <div className="winners-stats__item">
                <p className="winners-stats__value">{(missWinner ? 1 : 0) + (masterWinner ? 1 : 0)}</p>
                <p className="winners-stats__label">Couronnes décernées</p>
              </div>
            </motion.div>
          )}
        </motion.header>

        {hasWinners ? (
          <>
            <div className="winners-grid flex-1">
              <WinnerCard
                winner={missWinner}
                variant="miss"
                title="Miss"
                subtitle="Miss Fonakeukeu"
                delay={0.25}
                voteShare={missShare}
              />
              <WinnerCard
                winner={masterWinner}
                variant="master"
                title="Master"
                subtitle="Master Fonakeukeu"
                delay={0.4}
                voteShare={masterShare}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.55 }}
              className="winners-actions mt-12 sm:mt-16"
            >
              <button type="button" onClick={handleCelebrate} className="winners-actions__primary">
                <PartyPopper className="h-5 w-5" />
                Célébrer encore
              </button>
              <button type="button" onClick={() => navigate('/vote')} className="winners-actions__secondary">
                <ArrowLeft className="h-4 w-4" />
                Retour au vote
              </button>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="winners-empty"
          >
            <Users className="mx-auto h-12 w-12 text-gray-600" />
            <h2 className="mt-5 font-display text-3xl font-semibold text-white">Aucun gagnant pour le moment</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Les résultats seront dévoilés dès la clôture officielle du vote.
            </p>
            <button
              type="button"
              onClick={() => navigate('/vote')}
              className="winners-actions__secondary mt-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Participer au vote
            </button>
          </motion.div>
        )}

        <footer className="mt-14 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
            <Heart className="h-3 w-3 text-gold-500/50" />
            <span>Félicitations aux lauréats et merci à toute la communauté</span>
            <Heart className="h-3 w-3 text-gold-500/50" />
          </div>
        </footer>

        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="absolute bottom-5 right-5 flex items-center gap-1 text-xs text-gray-700 opacity-40 transition hover:text-gray-500 hover:opacity-100"
          aria-label="Accès administration"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default WinnerAnnouncement;
