import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [votes, setVotes] = useState(0);
  const [candidateName, setCandidateName] = useState('');

  useEffect(() => {
    let isProcessing = false;
    let mounted = true;

    const processPayment = async () => {
      if (isProcessing) return;
      isProcessing = true;

      console.log('🔍 Payment result page loaded');
      console.log('📋 URL params:', Object.fromEntries(searchParams));

      // ✅ Get data from session storage
      const storedCandidateId = sessionStorage.getItem('pendingCandidate');
      const storedCandidateName = sessionStorage.getItem('pendingCandidateName');
      const storedVotes = sessionStorage.getItem('pendingVotesCount');
      const storedInvoiceId = sessionStorage.getItem('pendingVote');

      console.log('📦 Session data:', {
        candidateId: storedCandidateId,
        candidateName: storedCandidateName,
        votes: storedVotes,
        invoiceId: storedInvoiceId
      });

      // ✅ If we have candidate data, add votes via worker
      if (storedCandidateId) {
        const voteCount = parseInt(storedVotes) || 1;
        console.log(`📊 Adding ${voteCount} votes for ${storedCandidateName}`);
        
        await addVotesViaWorker(
          storedCandidateId.trim(),
          storedCandidateName || 'le candidat',
          voteCount,
          storedInvoiceId || `txn-${Date.now()}`
        );
        return;
      }

      // ❌ If no session data, show error
      if (mounted) {
        setStatus('error');
        setMessage('Aucune information de vote trouvée. Veuillez contacter le support.');
        toast.error('Erreur: données de vote introuvables');
      }
      isProcessing = false;
    };

    const addVotesViaWorker = async (candId, candName, voteCount, invoiceId) => {
      try {
        console.log('🔧 Adding votes via worker START:', { 
          candId, 
          candName, 
          voteCount, 
          invoiceId,
          workerUrl: import.meta.env.VITE_FAPSHI_WORKER_URL
        });
        
        if (mounted) {
          setStatus('loading');
          setMessage(`Ajout de ${voteCount} vote(s) en cours...`);
        }

        const workerUrl = import.meta.env.VITE_FAPSHI_WORKER_URL;
        const url = `${workerUrl}/direct-add-vote?candidateId=${encodeURIComponent(candId)}&votes=${encodeURIComponent(voteCount)}&candidateName=${encodeURIComponent(candName)}&invoiceId=${encodeURIComponent(invoiceId)}`;
        
        console.log('📤 Calling worker URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('📦 Worker response:', data);

        if (data.success) {
          // ✅ Clear session storage
          sessionStorage.removeItem('pendingVote');
          sessionStorage.removeItem('pendingCandidate');
          sessionStorage.removeItem('pendingCandidateName');
          sessionStorage.removeItem('pendingVotesCount');

          if (data.alreadyCompleted) {
            if (mounted) {
              setStatus('success');
              setVotes(voteCount);
              setCandidateName(candName);
              setMessage(`✅ ${voteCount} vote(s) déjà ajouté(s) pour ${candName}!`);
              toast.success(`🎉 ${voteCount} vote(s) déjà ajouté(s) pour ${candName}!`);
            }
          } else {
            if (mounted) {
              setStatus('success');
              setVotes(voteCount);
              setCandidateName(candName);
              setMessage(`✅ ${voteCount} vote(s) ajouté(s) pour ${candName}!`);
              toast.success(`🎉 ${voteCount} vote(s) ajouté(s) pour ${candName}!`);
            }
          }

          // ✅ Redirect to voting page after 3 seconds
          setTimeout(() => {
            if (mounted) {
              navigate('/vote');
            }
          }, 3000);
        } else {
          console.error('❌ Worker returned error:', data);
          if (mounted) {
            setStatus('error');
            setMessage('Erreur lors de l\'ajout des votes: ' + (data.error || 'Unknown error'));
            toast.error('Erreur lors de l\'ajout des votes');
          }
        }
      } catch (error) {
        console.error('❌ Error adding votes via worker:', error);
        if (mounted) {
          setStatus('error');
          setMessage('Erreur lors de l\'ajout des votes: ' + error.message);
          toast.error('Erreur lors de l\'ajout des votes');
        }
      } finally {
        isProcessing = false;
      }
    };

    processPayment();

    return () => {
      mounted = false;
    };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center px-4 bg-gradient-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center shadow-2xl"
      >
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6">
              <Loader2 className="w-full h-full text-gold-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              Traitement en cours...
            </h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
              <CheckCircle className="w-full h-full text-green-400 relative z-10" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              Paiement Réussi! 🎉
            </h2>
            <p className="text-gray-300 mb-6">{message}</p>
            
            {votes > 0 && (
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5 text-gold-400" />
                  <span className="text-white font-semibold">
                    {votes} vote{votes > 1 ? 's' : ''} ajouté{votes > 1 ? 's' : ''}
                  </span>
                  {candidateName && (
                    <span className="text-gold-400">pour {candidateName}</span>
                  )}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-4">
              Redirection vers la page de vote...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6">
              <XCircle className="w-full h-full text-red-400" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">
              Erreur
            </h2>
            <p className="text-gray-300 mb-6">{message}</p>
          </>
        )}

        <Link to="/vote">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-gradient-gold text-charcoal-900 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-gold-500/30 hover:shadow-gold-500/50 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au vote
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default PaymentResult;