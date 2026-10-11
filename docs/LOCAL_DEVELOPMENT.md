# Run EDGE locally in VS Code

This guide explains how to open EDGE in VS Code, run it locally, sign in, and
manually check each implemented role. You do not need to deploy the app.

## 1. Install the prerequisites

Install:

- [VS Code](https://code.visualstudio.com/)
- Node.js 22 LTS
- Java 21 or newer, only for the Firestore security-rule tests
- Chrome or Edge for the included VS Code launch profiles

Confirm the tools in PowerShell:

```powershell
node --version
npm.cmd --version
java -version
```

Use Node 22 for the closest match to the Firebase Functions runtime. If `java`
is missing, the web app still runs; only `npm.cmd run test:rules` is unavailable.

## 2. Open the correct folder

In PowerShell:

```powershell
cd F:\Dev\Projects\edge---gig-marketplace
code .
```

Alternatively, use **File > Open Folder** in VS Code and select:

```text
F:\Dev\Projects\edge---gig-marketplace
```

Open the repository root—not `src`, `functions`, or `dist`.

## 3. Install dependencies once

Open **Terminal > New Terminal** in VS Code and run:

```powershell
npm.cmd ci
npm.cmd ci --prefix functions
```

These commands use the committed lockfiles. Run them again after switching
branches if either lockfile changed.

You can instead select **Terminal > Run Task > EDGE: first-time setup**.

Do not create a Gemini key in `.env.local`. The browser does not receive that
secret; compatibility analysis uses a Firebase callable function.

## 4. Start EDGE

### Option A — VS Code F5

1. Open **Run and Debug**.
2. Select **EDGE: Chrome** or **EDGE: Edge**.
3. Press `F5`.

VS Code starts Vite on port 3000 and opens:

```text
http://localhost:3000
```

Leave the `EDGE: start Vite` terminal running. Stop it with `Ctrl+C` when done.

### Option B — integrated terminal

```powershell
npm.cmd run dev
```

Then open [http://localhost:3000](http://localhost:3000) in a normal Chrome,
Edge, Firefox, or Safari window.

The server listens on `0.0.0.0`, but Google sign-in is supported only on
configured authorized hostnames. Use `localhost` for normal local work.

## 5. Firebase access required for manual use

The committed `firebase-applet-config.json` contains Firebase's public web-app
configuration. It is not a password; no service-account key is needed to start
the frontend.

An owner/editor of the Firebase project should verify:

1. **Firebase Console > Authentication > Sign-in method**: Google is enabled.
2. **Firebase Console > Authentication > Settings > Authorized domains**:
   `localhost` and `127.0.0.1` are present.
3. The named Firestore database exists and has the current rules deployed.

Local development uses a Google popup. The published Firebase app uses a
same-tab redirect. See [Firebase Google sign-in](firebase-auth-local.md) for
error-specific guidance.

### Important data warning

The normal Vite app points to the named Firebase project. It does not
automatically connect the UI to local Auth/Firestore emulators. Creating a
profile, posting a gig, applying, or reviewing can therefore write real project
data.

Use designated test Google accounts and clearly labelled test records. The
`test:rules` command is isolated: it uses the `demo-edge` Firestore emulator and
does not write marketplace data to production.

## 6. Manually check the app

Keep the browser developer console open (`F12`) so authentication, Firestore,
or callable-function errors are visible.

### Public website

Before signing in:

1. Confirm the public page loads without a blank screen.
2. Check the Artist, Organiser, Venue, and Audience explanations.
3. Check keyboard navigation, links, motion toggle, About, Privacy, and Terms.
4. Resize to a narrow mobile viewport and confirm content remains reachable.

The public discovery scenes are demonstrations, not real geolocation results.
The current build should not show a browser location prompt.

### Sign-in and first profile

1. Start the account action from the public page.
2. Complete the Google popup.
3. On first use, select Artist, Organiser, Venue, or Audience.
4. Enter the profile name and finish onboarding.
5. Refresh and confirm the session/profile persist.
6. Use `DISCONNECT_SESSION`; confirm the signed-out page returns.

The current role is intentionally immutable. Use separate test Google accounts
to check different roles; do not expect one account to switch roles.

### Artist

1. Complete name, bio, location, genres, and portfolio links.
2. Browse and filter open gigs.
3. Submit one application and confirm a duplicate is prevented.
4. Open application history and withdraw a pending application.
5. With a second account, verify accepted, completed, cancelled, and review
   states where applicable.

### Organiser

1. Publish a clearly labelled test gig.
2. Confirm it appears in the owner dashboard and an artist feed.
3. Review an application from a separate artist account.
4. Accept or reject it.
5. Confirm acceptance fills the gig and records the selected application/artist.
6. Safely exercise completion, cancellation, no-show, and review behavior.

### Venue

1. Publish a clearly labelled open date/gig.
2. Confirm venue-specific copy and the booking-owner dashboard.
3. Process an artist application with the same ownership checks as Organiser.

Venue currently shares the booking-owner workflow. A complete venue/room
inventory and calendar system is later product scope.

### Audience

1. Confirm discovery loads open and filled booking signals.
2. Check place/genre-oriented discovery and profile editing.
3. Confirm Audience cannot post a gig or apply as an artist.

Audience discovery is not yet ticketing, verified attendance, or real
device-location search.

### Cross-account lifecycle

Use two separate browsers or browser profiles:

- Browser/profile A: Organiser or Venue
- Browser/profile B: Artist

Create the gig in A, apply in B, decide in A, and inspect the result in B. Do
not use one identity as both sides of the same test.

Compatibility analysis is optional. Its callable backend enforces Firebase App
Check and needs the deployed function, configured provider, and Gemini secret.
A failure there should not block normal booking-flow testing.

## 7. Run automated checks

Quick checks:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Complete repository verification:

```powershell
npm.cmd run verify
```

Firestore security rules, requiring Java 21+:

```powershell
npm.cmd run test:rules
```

Equivalent commands are under **Terminal > Run Task**:

- `EDGE: verify code and production build`
- `EDGE: test Firestore rules`

## 8. Preview the production build locally

```powershell
npm.cmd run build
npm.cmd run preview
```

Open the URL printed by Vite, normally `http://localhost:4173`. This does not
prove production Google redirect authentication; smoke-test that on the
canonical Firebase Hosting URL.

## 9. Common problems

### Port 3000 is already in use

Stop the old `EDGE: start Vite` terminal with `Ctrl+C`, then press `F5` again.
The launch task uses `--strictPort`, so it fails visibly rather than using a
surprise port.

### PowerShell blocks `npm.ps1`

Use the documented `npm.cmd` and `npx.cmd` commands instead of changing the
machine execution policy.

### `auth/unauthorized-domain`

Add `localhost` and `127.0.0.1`—hostnames only—to Firebase Authentication's
authorized domains.

### `auth/operation-not-allowed`

Enable Google in Firebase Authentication's sign-in providers.

### Sign-in popup is blocked

Allow popups for `http://localhost:3000` and retry in a normal browser.

### Firestore says `permission-denied`

Confirm you signed in, selected the correct role, own the record being changed,
and deployed the current `firestore.rules`. Do not weaken rules to make a UI
test pass.

### Firestore rule tests cannot start

Run `java -version`. Install Java 21+ and restart VS Code so the integrated
terminal receives the updated `PATH`.

### Changes do not appear

Confirm Vite is still running, inspect its terminal for compile errors, and
hard-refresh. Do not open files directly from `dist`.

## 10. Stop without deploying

Press `Ctrl+C` in every Vite, preview, or emulator terminal. Local edits remain
in the working tree; nothing is published unless someone explicitly runs a
deployment command.
