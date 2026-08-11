import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, authPersistenceReady, db, firebaseApiKey } from '../lib/firebase';
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
      return 'Firebase does not authorize this address. Add localhost and 127.0.0.1 under Authentication > Settings > Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this Firebase project. Enable the Google provider under Authentication > Sign-in providers.';
    case 'auth/popup-blocked':
      return 'The browser blocked the sign-in window. EDGE will try the secure redirect flow instead.';
    case 'auth/network-request-failed':
      return 'Firebase could not reach Google sign-in. Check the network connection and try again.';
    case 'auth/storage-unavailable':
      return 'This browser blocked the secure sign-in handoff. Try the same localhost address in a normal browser window.';
    case 'auth/invalid-credential':
      return 'Google returned an invalid sign-in response. Try Initialize Protocol again.';
    default:
      return 'Sign-in failed. Check the Firebase Authentication settings and try again.';
  }
}

const AUTH_REDIRECT_PENDING_KEY = 'edge_auth_redirect_pending';
const GOOGLE_OAUTH_STATE_KEY = 'edge_google_oauth_state';

function clearPendingRedirect() {
  try {
    window.sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

function clearGoogleOAuthState() {
  try {
    window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

function cleanAuthCallbackUrl() {
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
}

function readGoogleCallback() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const idToken = params.get('id_token');
  const error = params.get('error');
  if (!idToken && !error) return null;
  return {
    idToken,
    state: params.get('state'),
    error,
    errorDescription: params.get('error_description'),
  };
}

async function createGoogleAuthUri() {
  const continueUri = `${window.location.origin}${window.location.pathname}`;
  let response: Response;
  try {
    response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: 'google.com', continueUri }),
    });
  } catch (error) {
    const networkError = Object.assign(new Error('Firebase could not reach Google sign-in.'), { code: 'auth/network-request-failed', cause: error });
    throw networkError;
  }

  const payload = await response.json();
  if (!response.ok || !payload.authUri) {
    const providerError = Object.assign(new Error(payload?.error?.message || 'Google sign-in is not available.'), {
      code: payload?.error?.message?.toLowerCase().includes('provider') ? 'auth/operation-not-allowed' : 'auth/unknown',
    });
    throw providerError;
  }

  const authUri = new URL(payload.authUri);
  const state = authUri.searchParams.get('state');
  if (!state) throw new Error('Firebase returned an invalid Google sign-in URL.');

  try {
    window.sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
  } catch {
    throw Object.assign(new Error('This browser blocked the secure sign-in handoff.'), { code: 'auth/storage-unavailable' });
  }
  return authUri.toString();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;
    let firstAuthStateSeen = false;
    let redirectCheckComplete = false;

    const maybeFinishBootstrap = () => {
      if (active && firstAuthStateSeen && redirectCheckComplete) {
        console.log('[Auth] Auth bootstrap ready');
        setLoading(false);
      }
    };

    const hydrateUser = async (nextUser: User | null) => {
      if (!active) return;
      console.log('[Auth] Auth state:', nextUser ? `signed_in:${nextUser.uid}` : 'signed_out');
      setUser(nextUser);
      if (nextUser) clearPendingRedirect();
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
      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        firstAuthStateSeen = true;
        void hydrateUser(nextUser).finally(maybeFinishBootstrap);
      });

      // Google returns an ID token in the URL fragment. Exchanging it directly
      // avoids Firebase's cross-domain auth helper, which some browsers do not
      // allow to restore the redirect session on localhost.
      try {
        const callback = readGoogleCallback();
        if (callback) {
          cleanAuthCallbackUrl();
          if (callback.error) {
            clearPendingRedirect();
            clearGoogleOAuthState();
            throw Object.assign(new Error(callback.errorDescription || callback.error), {
              code: callback.error === 'access_denied' ? 'auth/popup-closed-by-user' : 'auth/unknown',
            });
          }

          let expectedState = '';
          try {
            expectedState = window.sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY) || '';
          } catch {
            // Handled below as an invalid handoff.
          }
          if (!callback.idToken || !callback.state || !expectedState || callback.state !== expectedState) {
            clearPendingRedirect();
            clearGoogleOAuthState();
            throw Object.assign(new Error('Google returned an invalid sign-in handoff.'), { code: 'auth/invalid-credential' });
          }

          const credential = GoogleAuthProvider.credential(callback.idToken);
          const result = await signInWithCredential(auth, credential);
          clearPendingRedirect();
          clearGoogleOAuthState();
          console.log('[Auth] Google callback: signed_in', result.user.uid);
          await hydrateUser(result.user);
        } else {
          let redirectWasPending = false;
          try {
            redirectWasPending = window.sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY) === '1';
          } catch {
            // Storage can be unavailable in privacy-restricted browser contexts.
          }
          if (redirectWasPending && active) {
            clearPendingRedirect();
            setAuthError('Google returned without an authenticated session. The sign-in handoff was interrupted; try Initialize Protocol again.');
          }
        }
      } catch (error) {
        console.error('[Auth] Redirect sign-in failed:', error);
        if (active) setAuthError(describeAuthError(error));
      } finally {
        redirectCheckComplete = true;
        maybeFinishBootstrap();
      }
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
    try {
      window.sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, '1');
    } catch {
      // The redirect flow still proceeds if this browser blocks session storage.
    }
    console.log('[Auth] Preparing Google sign-in');
    const authUri = await createGoogleAuthUri();
    console.log('[Auth] Starting direct Google handoff');
    window.location.assign(authUri);
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
