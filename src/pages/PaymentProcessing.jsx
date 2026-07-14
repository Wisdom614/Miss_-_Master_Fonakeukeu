import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Crown, ExternalLink } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const PaymentProcessing = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Vérification du paiement...');
  const navigate = useNavigate();
  const invoiceId = sessionStorage.getItem('pendingVote');

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30;

    const checkPayment = setInterval(async () => {
      attempts++;
      try {
        const transactionRef = doc(db, 'transactions', invoiceId);
        const transactionDoc = await getDoc(transactionRef);
        
        if (transactionDoc.exists()) {
          const data = transactionDoc.data();
          if (data.status === 'COMPLETED') {
            clearInterval(checkPayment);
            setStatus('success');
            setMessage('✅ Paiement confirmé! Votes ajoutés!');
            toast.success('Paiement confirmé!');
            setTimeout(() => navigate('/vote'), 2000);
          }
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkPayment);
          setStatus('timeout');
          setMessage('Le paiement prend plus de temps que prévu. Veuillez vérifier votre transaction.');
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
    }, 2000);

    return () => clearInterval(checkPayment);
  }, [invoiceId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-6">
          {status === 'processing' && (
            <Loader2 className="w-full h-full text-gold-500 animate-spin" />
          )}
          {status === 'success' && (
            <div className="w-full h-full text-green-400">✅</div>
          )}
          {status === 'timeout' && (
            <div className="w-full h-full text-yellow-400">⏳</div>
          )}
        </div>

        <h2 className="text-2xl font-display font-bold text-white mb-2">
          {status === 'processing' && 'Traitement du paiement...'}
          {status === 'success' && 'Paiement Réussi! 🎉'}
          {status === 'timeout' && 'Vérification en cours...'}
        </h2>

        <p className="text-gray-300 mb-6">{message}</p>

        {status === 'processing' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <p className="text-blue-400 text-sm flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Veuillez compléter le paiement dans l'onglet ouvert
            </p>
          </div>
        )}

        {status === 'timeout' && (
          <button
            onClick={() => navigate('/vote')}
            className="w-full bg-gradient-gold text-charcoal-900 py-3 rounded-xl font-bold"
          >
            Retour au vote
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentProcessing;