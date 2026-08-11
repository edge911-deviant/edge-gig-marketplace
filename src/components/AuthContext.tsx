import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, authPersistenceReady, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

// AuthContext makes the signed-in Firebase user and their marketplace profile
// available to every screen without passing them through props manually.
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  createProfile: (role: UserRole, name: string) => Promise<void>;
  updateProfile: (changes: Pick<UserProfile, 'name' | 'bio' | 'genres' | 'location' | 'portfolio'>) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function describeAuthError(error: any) {
  switch (error?.code) {
    case 'auth/unauthorized-domain':
      return 'Firebase does not authorize this address. Add the current hostname under Authentication > Settings > Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this Firebase project. Enable the Google provider under Authentication > Sign-in providers.';
    case 'auth/popup-blocked':
      return 'The browser blocked the Google sign-in window. Allow pop-ups for EDGE and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The Google sign-in window closed before authentication finished.';
    case 'auth/network-request-failed':
      return 'Firebase could not reach Google sign-in. Check the network connection and try again.';
    case 'auth/storage-unavailable':
    case 'auth/web-storage-unsupported':
      return 'This browser blocks the local storage required for sign-in. Enable site storage or use a normal browser window.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Google sign-in is not supported inside this browser. Open EDGE in Chrome, Edge, Firefox, or Safari.';
    case 'auth/invalid-credential':
      return 'Google returned an invalid sign-in response. Try Initialize Protocol again.';
    default:
      return 'Sign-in failed. Check the Firebase Authentication settings and try again.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    const hydrateUser = async (nextUser: User | null) => {
      if (!active) return;
      console.log('[Auth] Auth state:', nextUser ? `signed_in:${nextUser.uid}` : 'signed_out');
      setUser(nextUser);
      try {
        if (nextUser) {
          setAuthError('');
          const docRef = doc(db, 'users', nextUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('[Auth] Profile load failed:', error);
        if (active) {
          setProfile(null);
          setAuthError('Your account signed in, but the EDGE profile could not be loaded from Firestore. Check Firestore rules.');
        }
      }
    };

    const bootstrapAuth = async () => {
      // Wait for persistence before subscribing. This prevents Firebase's
      // initial transient signed-out event from winning over a stored session.
      await authPersistenceReady;
      if (!active) return;

      // Firebase calls this whenever the login session changes. On login we
      // also load the user's marketplace profile from /users/{uid}.
      unsubscribe = onAuthStateChanged(
        auth,
        (nextUser) => {
          void hydrateUser(nextUser).finally(() => {
            if (active) {
              console.log('[Auth] Auth bootstrap ready');
              setLoading(false);
            }
          });
        },
        (error) => {
          console.error('[Auth] Auth state listener failed:', error);
          if (active) {
            setAuthError(describeAuthError(error));
            setLoading(false);
          }
        },
      );
    };

    void bootstrapAuth();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signIn = async () => {
    setAuthError('');
    await authPersistenceReady;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    // GitHub Pages is hosted outside Firebase. The supported popup flow uses
    // Firebase's registered OAuth handler and avoids a custom redirect URI.
    try {
      console.log('[Auth] Opening Google sign-in');
      const result = await signInWithPopup(auth, provider);
      console.log('[Auth] Google popup: signed_in', result.user.uid);
    } catch (error) {
      console.error('[Auth] Google popup failed:', error);
      setAuthError(describeAuthError(error));
      throw error;
    }
  };

  const logout = async () => {
    // Clearing Firebase Auth also causes the listener above to clear profile state.
    await signOut(auth);
  };

  const createProfile = async (role: UserRole, name: string) => {
    if (!user) return;

    // This object becomes a new document at /users/{user.uid}.
    // Add editable profile fields here, then add the corresponding UI and rule.
    const newProfile: UserProfile = {
      uid: user.uid,
      name,
      role,
      bio: '',
      genres: [],
      location: '',
      rating: 5,
      completedGigsCount: 0,
      portfolio: [],
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
  };

  const updateProfile = async (changes: Pick<UserProfile, 'name' | 'bio' | 'genres' | 'location' | 'portfolio'>) => {
    if (!user || !profile) throw new Error('A signed-in EDGE profile is required.');
    const normalized = {
      name: changes.name.trim().slice(0, 100),
      bio: changes.bio.trim().slice(0, 2000),
      genres: [...new Set(changes.genres.map((genre) => genre.trim()).filter(Boolean))].slice(0, 20),
      location: changes.location.trim().slice(0, 200),
      portfolio: [...new Set(changes.portfolio.map((item) => item.trim()).filter(Boolean))].slice(0, 20),
    };
    if (!normalized.name) throw new Error('Name is required.');
    await updateDoc(doc(db, 'users', user.uid), normalized);
    setProfile({ ...profile, ...normalized });
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, signIn, logout, createProfile, updateProfile, clearAuthError: () => setAuthError('') }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
