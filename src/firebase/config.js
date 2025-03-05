import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyAT-3Q4631A43p3MSJpf2pAoEdHtx7VEb0",
  authDomain: "lifemapkwt.firebaseapp.com",
  projectId: "lifemapkwt",
  storageBucket: "lifemapkwt.firebasestorage.app",
  messagingSenderId: "273538342487",
  appId: "1:273538342487:web:59afffecb29d368b268d12"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);