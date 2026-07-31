import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Crown, Gem, ShieldCheck, Trophy, Users, Vote } from 'lucide-react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const Home = () => {
  const [stats, setStats] = useState({ totalVotes: 0, candidates: 0 });
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candidatesSnapshot, settingsDoc] = await Promise.all([
          getDocs(collection(db, 'candidates')),
          getDoc(doc(db, 'system', 'settings')),
        ]);
        const totalVotes = candidatesSnapshot.docs.reduce((total, candidate) => total + (candidate.data().votes || 0), 0);
        setStats({ totalVotes, candidates: candidatesSnapshot.size });
        if (settingsDoc.exists()) setSettings(settingsDoc.data());
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
  }, []);

  const siteName = settings?.siteName || 'Miss & Master Fonakeukeu';
  const editionYear = settings?.editionYear || '2026';
  const votePrice = settings?.votePrice || 100;
  const metrics = [
    { icon: Vote, value: stats.totalVotes, label: 'votes exprimés' },
    { icon: Users, value: stats.candidates, label: 'candidats' },
    { icon: Gem, value: `${votePrice} FCFA`, label: 'par vote' },
  ];

  return (
    <main className="overflow-hidden">
      <section className="relative isolate min-h-[650px] overflow-hidden border-b border-gold-500/15 bg-[#101713]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(160,111,30,.25),transparent_24rem),radial-gradient(circle_at_10%_82%,rgba(107,19,38,.34),transparent_26rem),linear-gradient(125deg,#101713_0%,#193127_58%,#100e0d_100%)]" />
        <div className="absolute right-[-7rem] top-[-9rem] h-[34rem] w-[34rem] rounded-full border border-gold-300/15" />
        <div className="absolute right-[2rem] top-[3rem] h-[25rem] w-[25rem] rounded-full border border-gold-300/10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#101713] to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-28">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
            <div className="lux-eyebrow mb-6"><Crown className="h-3.5 w-3.5" /> Édition {editionYear}</div>
            <p className="mb-4 font-body text-xs font-semibold uppercase tracking-[.28em] text-gold-300">L'élégance. La tradition. Votre voix.</p>
            <h1 className="max-w-3xl font-display text-6xl font-bold leading-[.84] tracking-tight text-white sm:text-7xl lg:text-8xl">{siteName}</h1>
            <div className="my-7 h-px w-36 bg-gradient-to-r from-gold-300 to-transparent" />
            <p className="max-w-xl text-base leading-8 text-gray-300 sm:text-lg">Célébrons les talents qui portent notre communauté avec grâce. Choisissez votre favori et faites compter votre voix.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/vote" className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#f5dc91] via-gold-500 to-[#e8c56a] px-7 py-4 font-semibold text-charcoal-900 shadow-[0_12px_35px_rgba(212,168,0,.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(212,168,0,.34)]">
                Voter pour un candidat <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <Link to="/results" className="inline-flex items-center justify-center rounded-full border border-gold-300/40 bg-black/10 px-7 py-4 font-semibold text-gold-100 transition hover:border-gold-300 hover:bg-gold-500/10">Voir le classement</Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15, duration: .7 }} className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-5 rounded-[2.5rem] bg-gold-500/15 blur-3xl" />
            <div className="lux-card relative overflow-hidden rounded-[2rem] p-7 sm:p-9">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold-200 to-transparent" />
              <Crown className="mb-7 h-10 w-10 text-gold-300" />
              <p className="font-display text-3xl font-semibold text-white">Une couronne se gagne avec le soutien de tous.</p>
              <p className="mt-4 text-sm leading-6 text-gray-400">Le classement est mis à jour en direct après chaque vote validé.</p>
              <div className="mt-8 grid grid-cols-3 divide-x divide-gold-100/10 border-y border-gold-100/10 py-5">
                {metrics.map(({ icon: Icon, value, label }) => <div key={label} className="px-2 text-center first:pl-0 last:pr-0"><Icon className="mx-auto mb-2 h-4 w-4 text-gold-400" /><p className="text-lg font-bold text-white">{value}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">{label}</p></div>)}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#101713] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="lux-eyebrow">Le concours</p><h2 className="mt-5 font-display text-4xl font-bold text-white sm:text-5xl">Un vote simple, une distinction qui compte.</h2></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Paiement sécurisé', text: 'Payez en toute confiance via les solutions proposées.' },
              { icon: Vote, title: 'Soutien immédiat', text: 'Votre choix est transmis dès la validation de votre paiement.' },
              { icon: Trophy, title: 'Classement en direct', text: 'Suivez l’évolution de la compétition à tout moment.' },
            ].map(({ icon: Icon, title, text }, index) => <motion.article key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="lux-panel group p-7 transition duration-300 hover:-translate-y-1 hover:border-gold-400/35"><span className="grid h-11 w-11 place-items-center rounded-full border border-gold-400/20 bg-gold-500/10"><Icon className="h-5 w-5 text-gold-300" /></span><h3 className="mt-6 font-display text-2xl font-semibold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-gray-400">{text}</p></motion.article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-gold-500/15 bg-[#180f10] px-5 py-16 text-center sm:px-8">
        <CheckCircle2 className="mx-auto h-6 w-6 text-gold-300" /><h2 className="mt-4 font-display text-4xl font-bold text-white">Votre voix mérite d'être entendue.</h2><Link to="/vote" className="mt-7 inline-flex items-center gap-2 font-semibold text-gold-300 transition hover:text-gold-100">Découvrir les candidats <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </main>
  );
};

export default Home;
