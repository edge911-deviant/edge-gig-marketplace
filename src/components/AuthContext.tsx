import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, authPersistenceReady, db } from '../lib/firebase';
import {
  AUTH_REDIRECT_TIMEOUT_MS,
  CANONICAL_APP_URL,
  canonicalForwardTarget,
  chooseAuthTransport,
  clearPendingAuthRedirect,
  describeAuthError,
  hasPendingAuthRedirect,
  markAuthRedirectPending,
  runAfterAuthPrerequisite,
  withAuthTimeout,
} from '../lib/authFlow';
import { UserProfile, UserRole } from '../types';

export type AuthPhase =
  | 'initializing'
  | 'redirecting'
  | 'resolvingRedirect'
  | 'poweringUp'
  | 'signedOut'
  | 'ready'
  | 'recoverableError';

// AuthContext makes the signed-in Firebase user and their marketplace profile
// available to every screen without passing them through props manually.
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  phase: AuthPhase;
  authError: string;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  createProfile: (role: UserRole, name: string) => Promise<void>;
  updateProfile: (changes: Pick<UserProfile, 'name' | 'bio' | 'genres' | 'location' | 'portfolio'>) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

let canonicalRedirectResultPromise: ReturnType<typeof getRedirectResult> | null = null;

function getCanonicalRedirectResultOnce() {
  if (!canonicalRedirectResultPromise) {
    canonicalRedirectResultPromise = authPersistenceReady.then(() => getRedirectResult(auth));
  }
  return canonicalRedirectResultPromise;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState('');
  const transport = chooseAuthTransport(window.location);
  const forwardTarget = canonicalForwardTarget(window.location);
  const [phase, setPhase] = useState<AuthPhase>(() => (
    forwardTarget
      ? 'redirecting'
      : transport === 'same-origin-redirect' && hasPendingAuthRedirect()
      ? 'resolvingRedirect'
      : 'initializing'
  ));
  const signInAttemptPending = useRef(false);

  useEffect(() => {
    let active = true;
    let timedOut = false;
    let unsubscribe: (() => void) | null = null;
    let redirectSettled = transport !== 'same-origin-redirect';
    let redirectReturnedEmpty = false;
    let observedUser: User | null | undefined;
    let committedIdentity: string | null | undefined;
    let hydrationGeneration = 0;
    const redirectWasPending = transport === 'same-origin-redirect' && hasPendingAuthRedirect();

    const clearWatchdog = () => window.clearTimeout(watchdogId);

    const showRecoverableError = (error: unknown) => {
      if (!active) return;
      clearWatchdog();
      setAuthError(describeAuthError(error));
      setPhase('recoverableError');
    };

    const hydrateUser = async (nextUser: User | null) => {
      if (!active || timedOut) return;
      const generation = ++hydrationGeneration;
      console.log('[Auth] Auth state:', nextUser ? `signed_in:${nextUser.uid}` : 'signed_out');
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setPhase('signedOut');
        clearWatchdog();
        return;
      }

      setPhase('poweringUp');
      try {
        const docRef = doc(db, 'users', nextUser.uid);
        const docSnap = await getDoc(docRef);
        if (!active || timedOut || generation !== hydrationGeneration) return;
        setAuthError('');
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setPhase('ready');
        clearWatchdog();
      } catch (error) {
        console.error('[Auth] Profile load failed:', error);
        if (!active || timedOut || generation !== hydrationGeneration) return;
        setProfile(null);
        showRecoverableError(Object.assign(new Error('The signed-in EDGE profile could not be loaded.'), {
          code: 'auth/profile-load-failed',
        }));
      }
    };

    const commitObservedUser = () => {
      if (!active || timedOut || observedUser === undefined) return;
      if (observedUser === null && !redirectSettled) return;
      if (observedUser === null && redirectReturnedEmpty) {
        showRecoverableError(Object.assign(new Error('The redirect handoff returned empty.'), {
          code: 'auth/interrupted-redirect',
        }));
        return;
      }

      const identity = observedUser?.uid ?? null;
      if (committedIdentity === identity) return;
      committedIdentity = identity;
      void hydrateUser(observedUser);
    };

    const watchdogId = window.setTimeout(() => {
      if (!active) return;
      timedOut = true;
      clearPendingAuthRedirect();
      setAuthError(describeAuthError(Object.assign(new Error('Auth bootstrap timed out.'), {
        code: 'auth/bootstrap-timeout',
      })));
      setPhase('recoverableError');
    }, AUTH_REDIRECT_TIMEOUT_MS);

    // A stale cached GitHub Pages bundle must never restore a second public
    // Firebase session. Forward before subscribing to auth or loading data.
    if (forwardTarget) {
      setPhase('redirecting');
      try {
        window.location.replace(forwardTarget);
      } catch (error) {
        showRecoverableError(error);
      }
      return () => {
        active = false;
        clearWatchdog();
      };
    }

    // Subscribe immediately. Firebase queues this observer behind its own
    // redirect initialization; a signed-out event cannot win until the
    // redirect result below has settled.
    unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        observedUser = nextUser;
        commitObservedUser();
      },
      (error) => {
        console.error('[Auth] Auth state listener failed:', error);
        showRecoverableError(error);
      },
    );

    if (transport === 'same-origin-redirect') {
      setPhase(redirectWasPending ? 'resolvingRedirect' : 'initializing');
      void getCanonicalRedirectResultOnce()
        .then((result) => {
          if (!active || timedOut) return;
          clearPendingAuthRedirect();
          redirectSettled = true;
          redirectReturnedEmpty = redirectWasPending && !result;
          if (result?.user) observedUser = result.user;
          commitObservedUser();
        })
        .catch((error) => {
          if (!active || timedOut) return;
          clearPendingAuthRedirect();
          redirectSettled = true;
          console.error('[Auth] Redirect sign-in failed:', error);
          if (observedUser) {
            commitObservedUser();
          } else {
            showRecoverableError(error);
          }
        });
    } else {
      redirectSettled = true;
      commitObservedUser();
    }

    return () => {
      active = false;
      ++hydrationGeneration;
      clearWatchdog();
      unsubscribe?.();
    };
  }, [forwardTarget, transport]);

  const signIn = async () => {
    if (signInAttemptPending.current) return;
    signInAttemptPending.current = true;
    setAuthError('');
    setPhase('redirecting');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      if (transport === 'canonical-forward') {
        console.log('[Auth] Forwarding to canonical Firebase app');
        await withAuthTimeout(new Promise<never>(() => window.location.replace(CANONICAL_APP_URL)));
        return;
      }

      if (transport === 'local-popup') {
        await authPersistenceReady;
        console.log('[Auth] Opening local developer sign-in popup');
        const result = await signInWithPopup(auth, provider);
        console.log('[Auth] Local Google popup: signed_in', result.user.uid);
        signInAttemptPending.current = false;
        return;
      }

      console.log('[Auth] Starting same-origin Google redirect');
      await runAfterAuthPrerequisite(authPersistenceReady, async () => {
        markAuthRedirectPending();
        const redirectDeadline = window.setTimeout(() => {
          // Reloading cancels this Firebase instance before a stalled redirect
          // can navigate unexpectedly after the recovery deadline.
          window.location.replace(CANONICAL_APP_URL);
        }, AUTH_REDIRECT_TIMEOUT_MS);
        try {
          await signInWithRedirect(auth, provider);
        } finally {
          window.clearTimeout(redirectDeadline);
        }
      });
    } catch (error) {
      clearPendingAuthRedirect();
      signInAttemptPending.current = false;
      console.error('[Auth] Google sign-in failed:', error);
      setAuthError(describeAuthError(error));
      setPhase('recoverableError');
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
    <AuthContext.Provider value={{
      user,
      profile,
      loading: ['initializing', 'redirecting', 'resolvingRedirect', 'poweringUp'].includes(phase),
      phase,
      authError,
      signIn,
      logout,
      createProfile,
      updateProfile,
      clearAuthError: () => setAuthError(''),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
