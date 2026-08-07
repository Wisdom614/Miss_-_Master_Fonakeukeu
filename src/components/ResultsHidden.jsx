import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart3, EyeOff, Gem, Sparkles, Vote, ArrowRight } from 'lucide-react';

const ResultsHidden = ({ siteName = 'Miss & Master Fonakeukeu', editionYear = '2026' }) => (
  <main className="relative min-h-screen overflow-hidden bg-[#101713] px-5 py-20 sm:px-8">
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        background:
          'radial-gradient(circle at 20% 10%, rgba(212,168,0,.14), transparent 28rem), radial-gradient(circle at 80% 80%, rgba(107,19,38,.12), transparent 30rem), linear-gradient(145deg, #101713, #17251e 52%, #14110e)',
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mx-auto max-w-2xl text-center"
    >
      <div className="lux-eyebrow mx-auto mb-6 w-fit">
        <EyeOff className="h-3.5 w-3.5" />
        Classement non publié
      </div>

      <div className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-full border border-gold-400/25 bg-gold-500/10 shadow-[0_0_28px_rgba(212,168,0,.12)]">
        <BarChart3 className="h-9 w-9 text-gold-300" />
      </div>

      <h1 className="font-display text-5xl font-bold leading-none text-white sm:text-6xl">
        Résultats <span className="text-transparent bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 bg-clip-text">bientôt disponibles</span>
      </h1>

      <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-gray-400 sm:text-base">
        Le classement en direct n&apos;est pas encore ouvert au public pour {siteName} · édition {editionYear}.
        Vous pouvez continuer à voter — chaque voix compte.
      </p>

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-gold-100/15 bg-black/15 px-5 py-4 text-left">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-gold-300">
          <Sparkles className="h-3.5 w-3.5" />
          En attendant
        </p>
        <ul className="mt-3 space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <Gem className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
            Les votes sont enregistrés normalement en coulisse.
          </li>
          <li className="flex items-start gap-2">
            <Gem className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
            Le classement sera publié dès l&apos;ouverture officielle par l&apos;organisation.
          </li>
        </ul>
      </div>

      <Link
        to="/vote"
        className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f5dc91] via-gold-500 to-[#e8c56a] px-7 py-4 font-semibold text-charcoal-900 shadow-[0_12px_35px_rgba(212,168,0,.24)] transition hover:-translate-y-0.5"
      >
        <Vote className="h-5 w-5" />
        Continuer à voter
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  </main>
);

export default ResultsHidden;
