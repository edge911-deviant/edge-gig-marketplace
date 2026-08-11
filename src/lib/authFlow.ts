export const CANONICAL_APP_ORIGIN = 'https://edge-gig-marketplace.web.app';
export const CANONICAL_APP_URL = `${CANONICAL_APP_ORIGIN}/`;
export const AUTH_REDIRECT_TIMEOUT_MS = 20_000;
export const AUTH_REDIRECT_PENDING_KEY = 'edge:auth:redirect-pending';

export type AuthTransport = 'same-origin-redirect' | 'local-popup' | 'canonical-forward';

type LocationLike = Pick<Location, 'hostname' | 'origin'>;

export function chooseAuthTransport(location: LocationLike): AuthTransport {
  if (location.origin === CANONICAL_APP_ORIGIN) return 'same-origin-redirect';
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return 'local-popup';
  return 'canonical-forward';
}

export function canonicalForwardTarget(location: LocationLike) {
  return chooseAuthTransport(location) === 'canonical-forward' ? CANONICAL_APP_URL : null;
}

export function authErrorCode(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) return '';
  return typeof error.code === 'string' ? error.code : '';
}

export function describeAuthError(error: unknown) {
  switch (authErrorCode(error)) {
    case 'auth/unauthorized-domain':
      return 'Firebase does not authorize this address yet. Add the current hostname under Firebase Authentication > Settings > Authorized domains, then try again.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in Firebase Authentication. Enable the Google provider and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The Google sign-in window closed before authentication finished.';
    case 'auth/popup-blocked':
      return 'The browser blocked the Google sign-in window. Allow pop-ups for localhost or test the published EDGE app instead.';
    case 'auth/network-request-failed':
      return 'Firebase could not reach Google sign-in. Check the network connection and try again.';
    case 'auth/storage-unavailable':
    case 'auth/web-storage-unsupported':
      return 'This browser blocks the storage required for sign-in. Open EDGE in Chrome, Edge, Firefox, or Safari.';
    case 'auth/operation-not-supported-in-this-environment':
      return 'Google sign-in is not supported inside this browser. Open EDGE in Chrome, Edge, Firefox, or Safari.';
    case 'auth/invalid-credential':
      return 'Google returned an invalid sign-in response. Try Initialize Protocol again.';
    case 'auth/redirect-timeout':
      return 'Google sign-in did not open within 20 seconds. Open EDGE in Chrome, Edge, Firefox, or Safari and try again.';
    case 'auth/bootstrap-timeout':
      return 'EDGE could not restore the secure session within 20 seconds. Reload the canonical app in Chrome, Edge, Firefox, or Safari.';
    case 'auth/interrupted-redirect':
      return 'Google returned without a verified EDGE session. Reload the secure app and try sign-in again.';
    case 'auth/profile-load-failed':
      return 'Your Google account is signed in, but EDGE could not load its marketplace profile. Reload the secure app and try again.';
    default:
      return 'Sign-in failed. Check the Firebase Authentication settings and try again.';
  }
}

export function hasPendingAuthRedirect(storage: Pick<Storage, 'getItem'> = window.sessionStorage) {
  try {
    return storage.getItem(AUTH_REDIRECT_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function markAuthRedirectPending(storage: Pick<Storage, 'setItem'> = window.sessionStorage) {
  try {
    storage.setItem(AUTH_REDIRECT_PENDING_KEY, '1');
  } catch {
    // Firebase can still attempt the redirect when privacy settings block storage.
  }
}

export function clearPendingAuthRedirect(storage: Pick<Storage, 'removeItem'> = window.sessionStorage) {
  try {
    storage.removeItem(AUTH_REDIRECT_PENDING_KEY);
  } catch {
    // There is nothing else the app can safely clear in this browser.
  }
}

export function withAuthTimeout<T>(operation: Promise<T>, timeoutMs = AUTH_REDIRECT_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(Object.assign(new Error('Google sign-in did not open in time.'), { code: 'auth/redirect-timeout' }));
    }, timeoutMs);
  });

  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}

export async function runAfterAuthPrerequisite<T>(
  prerequisite: Promise<unknown>,
  action: () => Promise<T>,
  timeoutMs = AUTH_REDIRECT_TIMEOUT_MS,
) {
  // Only the prerequisite is raced. If it times out, the side effect is never
  // started later when the abandoned prerequisite eventually resolves.
  await withAuthTimeout(prerequisite, timeoutMs);
  return action();
}
