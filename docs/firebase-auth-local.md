# Local Google sign-in: why the domain error appears

## What the error means

The app is loading correctly, and the Firebase connection test succeeds. The visible error appears only when Google sign-in starts:

```text
FirebaseError: auth/unauthorized-domain
```

The local app is intended to run at:

```text
http://localhost:3000
```

Firebase Authentication does not consider `127.0.0.1` and `localhost` to be the same domain. OAuth sign-in is allowed only from domains listed in the Firebase project's Authorized domains list. Both hostnames must be present when either local URL may be used.

## Why this is important

Google sign-in temporarily redirects through Firebase and then back to the app. Firebase must know which websites are allowed to start that redirect. This prevents an unrelated website from pretending to be this app and abusing the project's authentication flow.

This is an authentication configuration problem. It is not caused by:

- React
- TypeScript or TSX
- Vite
- Firestore rules
- The Firebase web config in `firebase-applet-config.json`

The console messages confirm that Firestore is connected successfully. If both hostnames are present and Google is enabled, a blank popup or an empty return usually indicates that the browser blocked Firebase's cross-domain helper.

## Fix: authorize the local hostnames in Firebase

1. Open Firebase Console and select project `gen-lang-client-0182110057`.
2. Open `Authentication` → `Settings` → `Authorized domains`.
3. Add both hostnames:

```text
localhost
127.0.0.1
```

Do not add a protocol or port. Use `localhost`, not `http://localhost:3000`.

Also confirm that the Google provider is enabled under `Authentication` → `Sign-in providers`.

## How the code participates

The login call is in `src/components/AuthContext.tsx`. EDGE asks Firebase for a Google authorization URI, stores its state locally, and returns directly to the app with the Google ID token. The token is then exchanged with Firebase Auth. This keeps the branded `Initialize Protocol` action while avoiding the blank cross-domain Firebase popup/redirect helper:

```tsx
const response = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${firebaseApiKey}`,
  { method: 'POST', body: JSON.stringify({ providerId: 'google.com', continueUri }) },
);
window.location.assign((await response.json()).authUri);
```

The Firebase project and authentication domain come from `firebase-applet-config.json` and `src/lib/firebase.ts`.

The app catches this error in `src/App.tsx` and displays a readable message instead of leaving the user with only a browser-console error.

## What should not be changed to fix this

Do not change Firestore rules to solve this. Firestore rules control database access; they do not authorize Google OAuth domains.

Do not remove authentication checks or hard-code a fake user. The correct fix is to use an authorized hostname or update Firebase Authorized domains.
