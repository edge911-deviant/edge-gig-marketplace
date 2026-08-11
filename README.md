<div align="center">
  <img width="140" alt="EDGE mark" src="public/edge-app-icon-transparent.png" />
</div>

# EDGE — Gig Marketplace

> **Prelaunch alpha · `v0.1.0-alpha.1`** — core flows are implemented, while production hardening and end-to-end validation continue.

**Canonical app:** [Launch EDGE on Firebase Hosting](https://edge-gig-marketplace.web.app/)

The [GitHub Pages address](https://edge911-deviant.github.io/edge-gig-marketplace/) is a lightweight entry shell that forwards visitors to the canonical app. It is not a second authenticated deployment.

Mobile-first React and Firebase marketplace for structured live-performance booking.

Artists can search open gigs, apply once, track and cancel applications, complete bookings, review organisers, and build a real reliability record. Organisers can publish gigs, evaluate applicants, hire atomically, manage completion/cancellation/no-shows, and review artists. Compatibility analysis runs through an authenticated Firebase callable function so the Gemini secret and protected profiles never enter the browser bundle.

Read [EDGE_MEMORY.md](EDGE_MEMORY.md) before changing product behavior or visual language. The implementation status is tracked in [docs/DEV_FOCUS_STATUS.md](docs/DEV_FOCUS_STATUS.md), and the authorization contract is in [security_spec.md](security_spec.md).

## Local development

Requirements: Node.js 22+ and, for Firestore rule tests, Java 21+.

```powershell
npm.cmd install
npm.cmd install --prefix functions
npm.cmd run dev
```

Open `http://localhost:3000` in Chrome, Edge, Firefox, or Safari. If Google rejects the hostname or the redirect does not finish, follow [docs/firebase-auth-local.md](docs/firebase-auth-local.md).

## Verification

```powershell
npm.cmd run verify
npm.cmd run test:rules
```

`verify` checks TypeScript, authentication/hosting/domain tests, the Firebase production artifact, and the Cloud Functions build. `test:rules` starts the Firestore emulator and executes the security suite. GitHub Actions runs both with Node 22 and Java 21.

## Secure Gemini setup

The browser does not read a Gemini key. Configure the function secret and deploy the callable backend:

```powershell
npx.cmd firebase-tools functions:secrets:set GEMINI_API_KEY
npx.cmd firebase-tools deploy --only functions:getCompatibilityScore
```

Enable a Firebase App Check provider for the web app before using compatibility analysis in production. The callable function enforces App Check and verifies that the caller owns the gig and application before reading artist data.

## Firebase release checklist

1. Verify Google is enabled under Firebase Authentication providers.
2. Verify `edge-gig-marketplace.web.app`, `localhost`, and `127.0.0.1` under Authentication > Settings > Authorized domains as appropriate for the environment.
3. Deploy `firestore.rules` to the named Firestore database in `firebase.json`.
4. Configure App Check and `GEMINI_API_KEY`, then deploy the function.
5. Deploy the complete app with `npx.cmd firebase deploy --only hosting`. Its predeploy gate forces the Firebase root base and verifies the full app artifact before publishing. Do not use Hosting clone/promotion commands for a live release because they bypass that gate.
6. Publish the GitHub Pages app shell and confirm it forwards to Firebase Hosting before authentication starts.
7. Smoke-test the full-page Google redirect on the canonical app in a signed-out standard browser.

Production authentication uses Firebase `signInWithRedirect` on the Firebase Hosting origin. Embedded browsers may not support Google OAuth; the supported fallback is to open the canonical address in Chrome, Edge, Firefox, or Safari.

The Firebase web configuration in `firebase-applet-config.json` is public client configuration, not an authorization credential. Never commit `.env.local`, Gemini keys, service accounts, or OAuth secrets.
