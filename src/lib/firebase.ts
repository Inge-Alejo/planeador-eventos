// Inicialización de Firebase con fallback reactivo automático
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC2yUg-FTDgv0Q71_AhhBkEcQf4ilq4-7M',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'planeador-eventos-udea.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'planeador-eventos-udea',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'planeador-eventos-udea.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '544435712194',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:544435712194:web:87b557b17b1cb2db638b5b',
};

// Verifica si las credenciales de Firebase son reales y no los placeholders genéricos
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'AIzaSyDummyKeyForDevelopment123456789' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'eventflow-planner'
);

let app: any = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('Advertencia al configurar persistencia de autenticación:', err);
    });
  } catch (err) {
    console.warn('Error inicializando Firebase SDK, activando modo emulador local:', err);
  }
}

export { app, db, auth };
