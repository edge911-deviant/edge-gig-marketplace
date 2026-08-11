# Firebase Google sign-in: local development and production

## The short version

EDGE has one production app address:

```text
https://edge-gig-marketplace.web.app/
```

That Firebase Hosting address runs the complete app and starts Google sign-in. It uses Firebase's full-page `signInWithRedirect` flow. The app and Firebase's sign-in handler are on the same origin, so authentication does not depend on a popup window talking back to a different website.

The older GitHub Pages address remains useful as a public entry point:

```text
https://edge911-deviant.github.io/edge-gig-marketplace/
```

It is only an app-shell forwarder. A visitor who opens it is sent to the canonical Firebase Hosting app before authentication starts. Do not treat GitHub Pages as a second signed-in copy of EDGE.

## Why the architecture changed

The earlier GitHub Pages app opened Firebase's Google sign-in handler on `edge-gig-marketplace.web.app`. That crossed website boundaries and depended on a popup/opener bridge. In embedded browsers, the popup could stay blank or take a long time to reach Google's account chooser.

The canonical Firebase Hosting flow removes that bridge:

1. The user is on `edge-gig-marketplace.web.app`.
2. `Initialize Protocol` calls `signInWithRedirect`.
3. The browser leaves EDGE and opens Google sign-in in the same tab.
4. Google returns through Firebase to EDGE.
5. Firebase restores the session and the authenticated workspace opens.

This keeps Firebase Auth as the identity system, so Firestore rules, user IDs, profiles, and callable Functions continue to work without a data migration.

## Firebase Authorized domains

Firebase allows Google sign-in only from hostnames listed under:

```text
Firebase Console > Authentication > Settings > Authorized domains
```

For local development, add both:

```text
localhost
127.0.0.1
```

Do not include `http://`, `https://`, a port, or a path. Firebase treats `localhost` and `127.0.0.1` as different hostnames.

Also confirm that Google is enabled under:

```text
Firebase Console > Authentication > Sign-in providers
```

The canonical Firebase Hosting hostname is normally registered with its Firebase project. Verify that `edge-gig-marketplace.web.app` is present before release. GitHub Pages does not need to start OAuth because its only job is to forward the browser to Firebase Hosting.

## Test sign-in locally

Start the app and open the documented Vite address:

```powershell
npm.cmd run dev
```

```text
http://localhost:3000
```

Use a normal Chrome, Edge, Firefox, or Safari window. Click `Initialize Protocol`, complete the Google page, and confirm that the browser returns to the local app with the correct account.

Local development is the one intentional exception to the production architecture: it uses Firebase popup authentication so developers can remain on the Vite build while testing. Production never uses that popup; the canonical Firebase Hosting app uses the same-tab redirect described above.

Local success proves that the code and local authorized-domain settings work. It does not prove the production hostname is configured correctly. Before publishing, repeat the same signed-out test on:

```text
https://edge-gig-marketplace.web.app/
```

## Embedded-browser fallback

Google OAuth may reject or stall inside an embedded browser. This includes browser panels built into desktop or mobile apps. EDGE should not keep the user on an unlimited authentication spinner in that situation.

The signed-out screen shows the canonical address before authentication starts. The supported recovery is:

1. Show the canonical EDGE address.
2. Ask the user to open it in Chrome, Edge, Firefox, or Safari.
3. Let the user retry `Initialize Protocol` there.

This fallback is intentional. Retrying the same embedded popup or weakening Firebase security does not solve the browser restriction.

The 20-second EDGE watchdog can recover a failure while the EDGE page is still loaded, including a redirect that never starts or a callback that never settles after returning. Once Google owns the tab, EDGE code is no longer running and cannot intercept an off-site browser rejection. If Google stalls or rejects that embedded browser, manually copy the canonical address into a standard browser.

## Common errors

### `auth/unauthorized-domain`

The current hostname is missing from Firebase Authorized domains. Add only the hostname and try again.

### `auth/operation-not-allowed`

The Google provider is disabled in Firebase Authentication. Enable it and retry.

### Storage or redirect cannot complete

The browser is blocking storage or does not support this authentication environment. Retry in a normal browser window. If the same problem occurs there, check browser privacy settings and the Firebase authorized-domain list.

### The GitHub Pages URL shows the full app

The GitHub Pages artifact is stale or was built with the wrong release mode. It should forward to the canonical Firebase Hosting app and should not offer its own sign-in session.

## What should not be changed to fix sign-in

- Do not loosen Firestore rules. They protect database records; they do not authorize OAuth websites.
- Do not hard-code a fake user or bypass Firebase Auth.
- Do not switch back to `signInWithPopup` to make the GitHub Pages copy authenticate.
- Do not add tokens to the URL or create a second session system.
- Do not treat the Firebase web API key as a password. It is public client configuration; Firebase Auth and Firestore rules provide the security boundary.

## Production check

Before calling authentication ready:

1. Deploy the complete build with `npx.cmd firebase deploy --only hosting`; this runs the mandatory full-app build and artifact check. Do not release with Hosting clone/promotion commands, which bypass the predeploy gate.
2. Open the canonical address in a signed-out standard browser.
3. Complete the Google redirect and confirm EDGE returns signed in.
4. Refresh and confirm the session persists.
5. Disconnect the session and confirm the signed-out screen returns.
6. Open the GitHub Pages address and confirm it forwards to Firebase Hosting before sign-in begins.
7. Before starting sign-in in an embedded browser, confirm the signed-out screen shows the standard-browser instruction and canonical address. Embedded Google OAuth itself is not a supported release gate.

The login implementation is in `src/components/AuthContext.tsx`. Firebase initialization and persistence are in `src/lib/firebase.ts`.
