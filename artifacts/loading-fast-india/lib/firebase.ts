import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
  });
} catch (_e) {
  try {
    db = initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch (_e2) {
    db = getFirestore(app);
  }
}

const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
