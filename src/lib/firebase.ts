import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

// Firebase is the app's backend: Auth handles login and Firestore stores users,
// gigs, applications, and reviews. The web config is selected in this JSON file.
console.log('[Firebase] Initializing with config:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'asia-south1');

// Keep the Firebase session across page reloads. The
// auth UI is intentionally branded around a neutral "Initialize Protocol"
// action, so persistence belongs in the auth layer rather than the screen.
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence)
  .then(() => console.log('[Auth] Browser persistence enabled'))
  .catch((error) => {
    console.warn('[Auth] Browser persistence unavailable; continuing with Firebase defaults:', error);
  });

// This is only a startup connectivity check. It does not create marketplace data.
async function testConnection() {
  try {
    console.log('[Firebase] Testing connection to system/connection...');
    await getDocFromServer(doc(db, 'system', 'connection'));
    console.log('[Firebase] Connection successful');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[Firebase] Firebase is offline. Please check your network or configuration.");
    } else {
      console.warn("[Firebase] system/connection doc may not exist yet, this is normal on first boot:", error);
    }
  }
}
testConnection();

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) {
  // Call this around Firestore operations when you need structured permission
  // diagnostics. Most current screens log errors directly instead.
  if (error?.code === 'permission-denied') {
    const info: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid || 'unauthenticated',
        email: auth.currentUser?.email || 'none',
        emailVerified: auth.currentUser?.emailVerified || false,
        isAnonymous: auth.currentUser?.isAnonymous || false,
        providerInfo: auth.currentUser?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(info));
  }
  throw error;
}
