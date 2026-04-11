import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCuQVMzWcAwU9_iOKqeEb0U9PmdiI5dwno',
  authDomain: 'loding-fast.firebaseapp.com',
  projectId: 'loding-fast',
  storageBucket: 'loding-fast.appspot.com',
  messagingSenderId: '129072880230',
  appId: '1:129072880230:web:4f20bbbee1588d1507eba7',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
