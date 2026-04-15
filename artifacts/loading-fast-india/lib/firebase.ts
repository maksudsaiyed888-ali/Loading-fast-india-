import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyCuQVMzWcAwU9_iOKqeEb0U9PmdiI5dwno',
  authDomain: 'loding-fast.firebaseapp.com',
  projectId: 'loding-fast',
  storageBucket: 'loding-fast.appspot.com',
  messagingSenderId: '129072880230',
  appId: '1:129072880230:web:4f20bbbee1588d1507eba7',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

const auth = getAuth(app);

export { db, auth };
