import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Clock,
  RefreshCw,
  Sparkles,
  Heart,
  ShieldCheck,
  Wrench,
  Gem,
} from 'lucide-react';

const parseEstimatedMinutes = (value) => {
  if (!value) return null;
  const match = String(value).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

const cleanTitle = (title) => (
  (title || 'Système en maintenance')
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '')
    .trim()
);

const TimerRing = ({ progress, label }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="shutdown-timer__ring" aria-hidden="true">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="shutdownGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5d878" />
            <stop offset="100%" stopColor="#d4a800" />
          </linearGradient>
        </defs>
        <circle className="shutdown-timer__ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="shutdown-timer__ring-progress"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="shutdown-timer__ring-center">
        <Clock className="h-6 w-6 text-gold-300" />
      </div>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
};

const SystemShutdown = ({ settings, isPreview }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [progress, setProgress] = useState(100);
  const shutdown = settings?.systemShutdown || {};

  const {
    enabled = false,
    title = 'Système indisponible',
    message = 'Le système est temporairement indisponible. Veuillez réessayer dans quelques minutes.',
    estimatedTime = '30 minutes',
    showTimer = false,
  } = shutdown;

  const siteName = settings?.siteName || 'Miss & Master Fonakeukeu';
  const editionYear = settings?.editionYear || '2026';
  const displayTitle = cleanTitle(title);
  const estimatedMinutes = useMemo(() => parseEstimatedMinutes(estimatedTime), [estimatedTime]);

  useEffect(() => {
    if (!showTimer || !estimatedMinutes) return undefined;

    let seconds = estimatedMinutes * 60;
    const totalSeconds = seconds;

    const interval = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        clearInterval(interval);
        setTimeLeft('Bientôt disponible');
        setProgress(0);
      } else {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
        setProgress((seconds / totalSeconds) * 100);
      }
    }, 1000);

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    setProgress(100);

    return () => clearInterval(interval);
  }, [showTimer, estimatedMinutes]);

  if (!enabled && !isPreview) return null;

  const timerDisplay = showTimer && timeLeft ? timeLeft : estimatedTime;
  const showCountdown = Boolean(showTimer && estimatedMinutes);
  const isAlmostReady = timeLeft === 'Bientôt disponible';

  return (
    <div className="shutdown-page">
      <div className="shutdown-page__bg" />
      <div className="shutdown-page__grid" />
      <div className="shutdown-page__ring shutdown-page__ring--one" />
      <div className="shutdown-page__ring shutdown-page__ring--two" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="shutdown-shell"
      >
        {isPreview && (
          <span className="shutdown-shell__preview">
            <Sparkles className="h-3 w-3" />
            Aperçu admin
          </span>
        )}

        <article className="shutdown-panel">
          <div className="shutdown-panel__topline" />
          <div className="shutdown-panel__inner">
            <div className="shutdown-panel__layout">
              <div>
                <div className="shutdown-icon">
                  <Wrench className="h-7 w-7 text-gold-300" />
                </div>

                <div className="shutdown-status">
                  <span className="shutdown-status__dot" />
                  Maintenance en cours
                </div>

                <h1 className="shutdown-title font-display font-bold">
                  {displayTitle.includes(' ') ? (
                    <>
                      {displayTitle.split(' ').slice(0, -1).join(' ')}{' '}
                      <span>{displayTitle.split(' ').slice(-1)}</span>
                    </>
                  ) : (
                    <span>{displayTitle}</span>
                  )}
                </h1>

                <p className="shutdown-message">{message}</p>

                <div className="shutdown-divider" />

                <div className="shutdown-meta">
                  <span className="shutdown-meta__chip">
                    <Crown className="h-3.5 w-3.5 text-gold-400" />
                    <strong>{siteName}</strong>
                  </span>
                  <span className="shutdown-meta__chip">
                    <Gem className="h-3.5 w-3.5 text-gold-400" />
                    Édition <strong>{editionYear}</strong>
                  </span>
                  <span className="shutdown-meta__chip">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold-400" />
                    Retour <strong>imminent</strong>
                  </span>
                </div>

                <div className="shutdown-actions">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="shutdown-actions__primary group"
                  >
                    <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
                    Vérifier la disponibilité
                  </button>
                </div>
              </div>

              {(estimatedTime || timeLeft) && (
                <motion.aside
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.55 }}
                  className="shutdown-timer"
                  aria-live="polite"
                >
                  {showCountdown && !isAlmostReady && (
                    <TimerRing progress={progress} label={`Temps restant ${timerDisplay}`} />
                  )}

                  <p className="shutdown-timer__label">
                    {isAlmostReady ? 'Statut' : 'Retour estimé'}
                  </p>
                  <p className="shutdown-timer__value">{timerDisplay}</p>
                  <p className="shutdown-timer__hint">
                    {isAlmostReady
                      ? 'Le système devrait être accessible d’un instant à l’autre.'
                      : showCountdown
                        ? 'Compte à rebours en cours — merci de votre patience.'
                        : 'Nous travaillons à rétablir le service rapidement.'}
                  </p>

                  {showCountdown && !isAlmostReady && (
                    <div className="shutdown-timer__bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                      <div className="shutdown-timer__bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </motion.aside>
              )}
            </div>
          </div>
        </article>

        <footer className="shutdown-footer">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-3 w-3 text-gold-500/45" />
            <span>Merci pour votre patience — nous revenons très bientôt</span>
            <Heart className="h-3 w-3 text-gold-500/45" />
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export default SystemShutdown;
