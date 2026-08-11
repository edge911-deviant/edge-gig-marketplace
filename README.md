<div align="center">
  <img width="140" alt="EDGE mark" src="public/edge-app-icon-transparent.png" />
</div>

# EDGE — Gig Marketplace

> **Prelaunch alpha · `v0.1.0-alpha.1`** — core flows are implemented, but production Firebase configuration, deployment, and end-to-end validation are still pending.

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

Open `http://localhost:3000`. If Google rejects the hostname, follow [docs/firebase-auth-local.md](docs/firebase-auth-local.md).

## Verification

```powershell
npm.cmd run verify
npm.cmd run test:rules
```

`verify` checks TypeScript, six domain tests, the web production bundle, and the Cloud Functions build. `test:rules` starts the Firestore emulator and executes the security suite. GitHub Actions runs both with Node 22 and Java 21.

## Secure Gemini setup

The browser does not read a Gemini key. Configure the function secret and deploy the callable backend:

```powershell
npx.cmd firebase-tools functions:secrets:set GEMINI_API_KEY
npx.cmd firebase-tools deploy --only functions:getCompatibilityScore
```

Enable a Firebase App Check provider for the web app before using compatibility analysis in production. The callable function enforces App Check and verifies that the caller owns the gig and application before reading artist data.

## Firebase release checklist

1. Verify Google is enabled under Firebase Authentication providers.
2. Add every deployed hostname under Authentication → Settings → Authorized domains.
3. Deploy `firestore.rules` to the named Firestore database in `firebase.json`.
4. Configure App Check and `GEMINI_API_KEY`, then deploy the function.
5. Build and deploy Hosting only after `npm.cmd run verify` and `npm.cmd run test:rules` pass.

The Firebase web configuration in `firebase-applet-config.json` is public client configuration, not an authorization credential. Never commit `.env.local`, Gemini keys, service accounts, or OAuth secrets.
