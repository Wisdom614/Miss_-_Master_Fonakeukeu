import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, doc, onSnapshot, query } from 'firebase/firestore';
import { Crown, ChevronLeft, ChevronRight, RefreshCw, Star, Trophy, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../firebase/config';
import { isResultsVisible } from '../utils/resultsVisibility';
import ResultsHidden from '../components/ResultsHidden';

const ITEMS_PER_PAGE = 10;
const fallbackImage = 'https://via.placeholder.com/160x160/17251e/e8c56a?text=?';

const Results = () => {
  const [candidates, setCandidates] = useState([]);
  const [settings, setSettings] = useState(null);
  const [settingsReady, setSettingsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);

  const resultsVisible = isResultsVisible(settings);

  useEffect(() => {
    const settingsRef = doc(db, 'system', 'settings');
    const unsubscribeSettings = onSnapshot(
      settingsRef,
      (snapshot) => {
        setSettings(snapshot.exists() ? snapshot.data() : null);
        setSettingsReady(true);
      },
      (error) => {
        console.error('Error loading settings:', error);
        setSettingsReady(true);
      },
    );
    return unsubscribeSettings;
  }, []);

  useEffect(() => {
    if (!settingsReady || !resultsVisible) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query(collection(db, 'candidates')),
      (snapshot) => {
        const data = snapshot.docs
          .map((candidate) => ({ id: candidate.id, ...candidate.data() }))
          .sort((a, b) => (b.votes || 0) - (a.votes || 0));
        setCandidates(data);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading results:', error);
        setLoading(false);
        setRefreshing(false);
      },
    );

    return unsubscribe;
  }, [settingsReady, resultsVisible]);

  if (settingsReady && !resultsVisible) {
    return (
      <ResultsHidden
        siteName={settings?.siteName || 'Miss & Master Fonakeukeu'}
        editionYear={settings?.editionYear || '2026'}
      />
    );
  }

  const totalVotes = candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
  const categories = {
    all: candidates,
    miss: candidates.filter((candidate) => candidate.category?.includes('Miss')),
    master: candidates.filter((candidate) => candidate.category?.includes('Master')),
  };
  const displayed = categories[activeCategory];
  const totalPages = Math.ceil(displayed.length / ITEMS_PER_PAGE);
  const rows = displayed.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const percentage = (votes) => (totalVotes ? (votes / totalVotes) * 100 : 0);
  const changeCategory = (category) => { setActiveCategory(category); setCurrentPage(0); };
  const refresh = () => { setRefreshing(true); toast.success('Classement actualisé'); setTimeout(() => setRefreshing(false), 450); };
  const siteName = settings?.siteName || 'Miss & Master Fonakeukeu';

  return (
    <main className="min-h-screen bg-[#101713] pb-20">
      <section className="border-b border-gold-500/15 bg-[radial-gradient(circle_at_50%_-20%,rgba(212,168,0,.2),transparent_31rem),linear-gradient(125deg,#101713,#17251e)] px-5 pb-14 pt-16 text-center sm:px-8">
        <p className="lux-eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Mise à jour en direct</p>
        <div className="mt-5 flex items-center justify-center gap-3"><h1 className="font-display text-5xl font-bold leading-none text-white sm:text-6xl">Le classement</h1><button onClick={refresh} disabled={refreshing} className="rounded-full border border-gold-300/25 p-2 text-gold-300 transition hover:bg-gold-500/10 disabled:opacity-50" aria-label="Actualiser le classement"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></button></div>
        <p className="mt-4 text-sm text-gray-400">{siteName} · édition {settings?.editionYear || '2026'}</p>
        <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 divide-x divide-gold-100/15 rounded-2xl border border-gold-100/15 bg-black/10 px-4 py-4"><div><p className="font-display text-3xl font-bold text-white">{candidates.length}</p><p className="text-xs uppercase tracking-[.14em] text-gray-500">Candidats</p></div><div><p className="font-display text-3xl font-bold text-gold-300">{totalVotes}</p><p className="text-xs uppercase tracking-[.14em] text-gray-500">Votes enregistrés</p></div></div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-8 flex justify-center gap-2 overflow-x-auto pb-1">
          {[['all', 'Tous'], ['miss', 'Miss'], ['master', 'Master']].map(([id, label]) => <button key={id} onClick={() => changeCategory(id)} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeCategory === id ? 'bg-gold-500 text-charcoal-900 shadow-lg shadow-gold-500/20' : 'border border-white/10 bg-white/[.04] text-gray-300 hover:border-gold-400/40'}`}>{label}<span className="ml-2 text-xs opacity-70">{categories[id].length}</span></button>)}
        </div>

        {loading ? <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-white/5" />)}</div> : displayed.length === 0 ? <div className="lux-panel py-20 text-center"><Users className="mx-auto h-10 w-10 text-gray-600" /><p className="mt-4 text-gray-400">Aucun candidat dans cette catégorie.</p></div> : <>
          {activeCategory === 'all' && <section className="mb-12"><div className="mb-5 flex items-center gap-3"><Trophy className="h-5 w-5 text-gold-300" /><h2 className="font-display text-3xl font-semibold text-white">En tête du concours</h2><span className="h-px flex-1 bg-gold-500/15" /></div><div className="grid gap-5 md:grid-cols-3">{candidates.slice(0, 3).map((candidate, index) => <motion.article key={candidate.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .1 }} className={`lux-card relative overflow-hidden rounded-2xl p-5 ${index === 0 ? 'md:-mt-4 md:pb-8 md:pt-7' : ''}`}><div className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-gold-400/30 bg-gold-500/10 text-sm font-bold text-gold-300">{index + 1}</div><img src={candidate.image || fallbackImage} alt={candidate.name} onError={(event) => { event.currentTarget.src = fallbackImage; }} className="mx-auto h-28 w-28 rounded-full border-2 border-gold-400/40 object-cover" />{index === 0 && <Crown className="mx-auto -mt-3 h-7 w-7 rounded-full bg-[#17251e] p-1 text-gold-300" />}<h3 className="mt-4 truncate text-center font-display text-2xl font-semibold text-white">{candidate.name}</h3><p className="mt-1 text-center text-xs text-gray-500">{candidate.category || 'Candidat'}</p><div className="mt-5 text-center"><p className="font-display text-3xl font-bold text-gold-300">{candidate.votes || 0}</p><p className="text-xs uppercase tracking-wider text-gray-500">votes · {percentage(candidate.votes || 0).toFixed(1)}%</p></div></motion.article>)}</div></section>}

          <section><div className="mb-5 flex items-center gap-3"><Star className="h-5 w-5 text-gold-300" /><h2 className="font-display text-3xl font-semibold text-white">Classement détaillé</h2></div><div className="overflow-hidden rounded-2xl border border-gold-100/10">{rows.map((candidate, index) => { const rank = currentPage * ITEMS_PER_PAGE + index + 1; const share = percentage(candidate.votes || 0); return <motion.article key={candidate.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .035 }} className="group grid grid-cols-[2.5rem_3rem_1fr_auto] items-center gap-3 border-b border-gold-100/10 bg-white/[.035] p-3 last:border-0 hover:bg-gold-500/[.06] sm:grid-cols-[3rem_4rem_1fr_7rem]"><span className={`text-center font-display text-xl font-bold ${rank <= 3 ? 'text-gold-300' : 'text-gray-500'}`}>{rank}</span><img src={candidate.image || fallbackImage} alt="" onError={(event) => { event.currentTarget.src = fallbackImage; }} className="h-11 w-11 rounded-full border border-gold-100/15 object-cover sm:h-12 sm:w-12" /><div className="min-w-0"><h3 className="truncate font-semibold text-white">{candidate.name}</h3><p className="text-xs text-gray-500">{candidate.category || 'Candidat'}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/20"><motion.div initial={{ width: 0 }} animate={{ width: `${share}%` }} transition={{ duration: .65 }} className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300" /></div></div><div className="text-right"><p className="font-bold text-gold-200">{candidate.votes || 0}</p><p className="text-[10px] text-gray-500">{share.toFixed(1)}%</p></div></motion.article>; })}</div></section>

          {totalPages > 1 && <nav className="mt-7 flex items-center justify-center gap-4" aria-label="Pagination"><button onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} disabled={!currentPage} className="rounded-full border border-white/10 p-2 text-gray-300 transition hover:border-gold-400/50 disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button><span className="text-sm text-gray-400">Page {currentPage + 1} sur {totalPages}</span><button onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))} disabled={currentPage === totalPages - 1} className="rounded-full border border-white/10 p-2 text-gray-300 transition hover:border-gold-400/50 disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button></nav>}
        </>}
      </div>
    </main>
  );
};

export default Results;
