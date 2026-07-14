import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const seedSystemSettings = async () => {
  try {
    const settingsRef = doc(db, 'system', 'settings');
    
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
      votePackages: [
        { votes: 1, label: '1 Vote', icon: 'Star', price: 100 },
        { votes: 5, label: '5 Votes', icon: 'Sparkle', price: 500 },
        { votes: 20, label: '20 Votes', icon: 'Zap', price: 2000 },
        { votes: 50, label: '50 Votes', icon: 'Shield', price: 5000 },
        { votes: 100, label: '100 Votes', icon: 'Trophy', price: 10000 }
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: 'system'
    };
    
    await setDoc(settingsRef, defaultSettings);
    console.log('✅ System settings seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    return false;
  }
};

// Run this function once from the browser console or from a button
// To run: seedSystemSettings()