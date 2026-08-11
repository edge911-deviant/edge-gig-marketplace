# EDGE Memory

This file is the product memory for EDGE - Gig Marketplace. Read it before changing a screen, deleting a feature, rewriting system copy, changing authentication, or publishing a build. It records why the app looks and behaves the way it does so future changes do not accidentally flatten the product into a generic marketplace.

The companion visual specification is [docs/EDGE_VISUAL_SYSTEM.md](docs/EDGE_VISUAL_SYSTEM.md). The security and authorization invariants are in [security_spec.md](security_spec.md). Firebase auth setup for local development is in [docs/firebase-auth-local.md](docs/firebase-auth-local.md).

## 1. Core idea

EDGE is a structured marketplace for live performance bookings.

- Organisers publish a gig with a date, place, genre, budget, and brief.
- Artists discover open opportunities and apply to the organiser who owns the gig.
- Organisers inspect applicants, use the available compatibility aid, and accept or reject applications.
- Both sides need a clear session, a trustworthy record of ownership, and a fast path back to the work that matters.

The cyberpunk console language is the product's confidence layer. It turns a set of forms, lists, and Firebase states into a legible operating system for performance work: a node comes online, signals arrive, a mission is posted, an applicant is evaluated, and a session can be disconnected. The language may be dramatic, but the underlying state must stay honest.

The north star is:

> Make live-performance coordination feel precise, alive, and trustworthy without hiding what is real, what is pending, or what the user can do next.

EDGE is not a dashboard decorated with cyberpunk words. The words, motion, and layout should help the user understand ownership, status, progress, and action.

## 2. Non-negotiable product laws

### Law 1: Preserve the product's narrative arc

The signed-out entry sequence is intentional:

1. `System_Initializing`
2. `Structured performance booking protocol.`
3. `Initialize Protocol`
4. `Authenticating_EDGE`
5. `Powering_Up_EDGE`
6. the authenticated workspace

The branded loading screens are part of the EDGE identity and give OAuth/Firebase time to resolve. Do not delete the screens or replace them with a generic spinner merely because they are not business data. If timing changes, preserve the sequence, the meaning of each state, and a recoverable error path.

### Law 2: Preserve the tilted glyph

The tilted terminal mark is the primary EDGE brand signal. Use the existing transparent asset at `/edge-app-icon-transparent.png` and the `EdgeMark` component. Do not redraw it with a different SVG, straighten it, put it inside a new border, or change its aspect ratio casually. App icon, favicon, auth screen, loading screen, and signed-in shell should feel like one system.

### Law 3: Every word must earn its place

System language should communicate a real state, action, or meaningful product fiction:

- `Initialize Protocol` is the entry action that starts sign-in.
- `Authenticating_EDGE` and `Powering_Up_EDGE` describe distinct waiting phases.
- `NODE_ACTIVE` means an authenticated user has an active workspace.
- `NEW ASSIGNMENT` and the ticker establish the live marketplace atmosphere.
- `Confirm signal` confirms a gig submission.
- `Disconnect_Session` logs out and returns the user to the auth entry.

Do not add labels such as `SYNCING`, `SECURE`, `LIVE`, `VERIFIED`, or `100%` unless they have either a real source or are explicitly marked in code as presentation-only. If a phrase is purely decorative, keep it short, consistent with the glyph lexicon, and annotate the code so a future developer cannot mistake it for telemetry.

### Law 4: Meaning before polish

Before adding, moving, or deleting any element, answer:

- What user problem does this solve?
- Which state does it expose?
- What action does it enable or clarify?
- Is it a real value, a design prop, or a temporary placeholder?
- What existing behavior or recovery path might it be protecting?

If an element has no answer, it may still exist as a visual prop, but its code comment must say so. Visual props are allowed; unlabelled false telemetry is not.

### Law 5: Never weaken identity or authorization

The user identity comes from Firebase Auth. Firestore ownership comes from authenticated UID fields and rules. A client-provided organiser ID, artist ID, role, status, timestamp, or relationship must not be trusted simply because the UI displays it.

When changing data behavior, read [security_spec.md](security_spec.md) and [firestore.rules](firestore.rules) together with the component. Any new field, collection, role, transition, or query needs a matching security decision. Preserve the global deny fallback.

### Law 6: OAuth must remain same-origin and recoverable

The production app has one canonical address: `https://edge-gig-marketplace.web.app/`. Google sign-in starts there with Firebase's full-page `signInWithRedirect` flow. Because the app and Firebase's authentication handler share the Firebase Hosting origin, the flow does not depend on a popup window or a cross-site opener bridge.

The GitHub Pages address is an app-shell forwarder, not a second authenticated copy of EDGE. It must send visitors to the canonical Firebase Hosting address before authentication starts. Do not add sign-in, Firestore session handling, or a separate application state to the GitHub Pages shell.

Some embedded browsers do not support Google OAuth reliably. The signed-out screen must expose the canonical address and explain that the user should open it in Chrome, Edge, Firefox, or Safari before sign-in. While EDGE is loaded, its authentication watchdog must replace a stalled local handoff with recovery guidance instead of an endless `Authenticating_EDGE` screen. Once Google owns the tab, EDGE cannot intercept an off-site embedded-browser rejection; external-browser recovery is necessarily manual.

When changing authentication, preserve:

- Firebase Hosting as the only production origin that starts sign-in;
- `signInWithRedirect`, redirect-result recovery, and browser-local session persistence;
- explicit authorized-domain, provider, storage, and network errors;
- the branded waiting sequence with a bounded, visible recovery path;
- a clear standard-browser fallback for unsupported embedded browsers;
- logout behavior that returns to a clean signed-out state.

Do not replace the redirect flow with `signInWithPopup` without reproducing and solving the popup/opener delay that led to this architecture.

### Law 7: Existing features have a reason

Before editing or deleting an existing feature, search its component, state, route, callbacks, Firestore query, and CSS usage. Write down the purpose it served and the replacement behavior before removing it. A feature that looks “extra” may be solving a timing, trust, recovery, or orientation problem.

In particular, do not remove the following without an equivalent replacement:

- the loading sequence;
- the scrolling ticker;
- the device/status bar;
- telemetry cards;
- the `AES-256` system panel;
- the profile hierarchy and `NODE_ACTIVE` language;
- the visible `DISCONNECT_SESSION` action;
- the floating black navigation dock;
- error boundary and auth error guidance;
- empty states and in-progress states;
- haptic feedback where supported.

### Law 8: Keep the phone-shell composition intact

The centered mobile device is the primary stage even on desktop. The shell, status strip, ticker, content hierarchy, and floating dock are a composition. Do not make individual cards look correct while allowing the overall shell to become a collection of unrelated panels.

The shell must remain readable at the phone-sized frame and at a normal desktop viewport. Critical text must not be hidden behind sticky actions, compressed by flex layout, or lost to an overflow container. This matters especially on the profile screen, where the AES panel and disconnect button must remain visible together.

## 3. Real behavior versus visual props

The distinction below is a design and engineering contract. Presentation-only values are valid as atmosphere, but they are not evidence.

| Element | Current meaning | Source / classification | Change rule |
|---|---|---|---|
| Firebase user/session | Signed-in identity and persistence | Real auth state | Never fake it; preserve logout and redirect recovery. |
| Role selection | First-time user chooses organiser or artist | Real profile write to `/users/{uid}` | Keep roles immutable after creation unless the data model and rules intentionally change. |
| Artist gig feed | Open gigs from Firestore | Real live query | Keep organiser ownership and open-status filtering aligned with rules. |
| Applications | Artist applies; organiser accepts/rejects | Real Firestore state | Preserve actor-specific transitions and references. |
| `Active Gigs` / `Registered Artists` | Current open opportunities and artist profiles | Real Firestore-derived counts | Preserve loading/error states and keep the definitions aligned with the underlying queries. |
| Status-bar signal, frequency, battery | Device-console framing | Visual-only indicators; code comment required | Never imply device health or network quality. |
| Clock | Current browser time | Real browser time, not server telemetry | Keep 24-hour format and avoid implying synchronized server time. |
| Activity ticker | Recent marketplace activity | Real recent gig records, presented as ambient motion | Keep repetition and speed subtle; provide an honest empty state. |
| `LiveRadar` | Visual scan motif with a real open-gig count | Mixed: scan is a prop; count is Firestore-derived | Never present it as a live map, safety signal, or proximity result. |
| Reliability / trust | Completed, cancelled, no-show, and review outcomes | Real derived marketplace data | Keep the scoring definition in `src/lib/reliability.ts` and test changes. |
| `AES-256` and 82% bar | Secure-node visual language | Presentation-only trust prop; code comment required | Do not claim that the client has proven encryption or security posture. |
| `BUILD_2026.4.20` / `SECURE_CLOUD` | Release and atmosphere labels | Product copy / prop | Update only with an intentional release decision; `SECURE_CLOUD` is not a security certification. |
| `Disconnect_Session` | Logout | Real auth action | Keep visible and accessible after login. |
| Haptics | Tactile feedback where browser supports it | Real best-effort device behavior | Always keep a visual interaction fallback. |

When implementing a prop, use a nearby JSX comment in the same component. Example:

```tsx
{/* Visual trust prop: this is not measured telemetry or a security claim. */}
<span>AES-256</span>
```

## 4. Feature intent register

This is the short “why” for the current feature set.

### Auth entry and initialization

The landing screen establishes the EDGE identity before asking for a provider. It reduces the abruptness of OAuth, makes the app feel like a deliberate instrument, and provides a branded place to explain failure. The tilted terminal, status language, CTA, build label, and secure-cloud footer belong together.

### Authenticating and powering-up screens

These screens separate “the user started sign-in” from “the authenticated workspace is preparing.” They are meaningful waiting states, not dead-end pages. They must transition to the correct signed-in state or a visible, actionable error.

### Role selection

A new user needs an explicit operating role because organiser and artist permissions, home screens, and actions differ. The name and role are persisted to the user profile. Do not silently infer a role from the first action.

### Artist home

The artist home answers: what is open, what might fit me, and how do I apply? Keep gig title, location, budget, date, genre, description, and application state legible. Filters may remain visual placeholders only while they are commented and do not imply filtering that is not happening.

### Post gig

The organiser form converts an idea into a structured opportunity. Required fields are not arbitrary: they give the artist enough signal to decide whether to apply. The “Confirm signal” action is the commit point and should keep its loading/error feedback.

### Organiser dashboard

The organiser dashboard answers: what have I posted, who responded, and what decision is pending? The selected-gig sheet and live application query keep the relationship between gig and applicants visible. If hiring should fill or close a gig, implement that as an explicit lifecycle transition with rules and tests; do not imply it by changing a label only.

### Applicant card and AI analysis

The applicant card supports a decision without replacing human judgment. Compatibility analysis is optional and must remain clearly labelled as assistance. Do not expose a browser API key in production; proxy sensitive AI calls server-side and define what profile data may be sent.

### Profile node

The profile screen is the user's control and trust surface. Its hierarchy is intentional:

1. `PROFILE_NODE` and `Session_Active` orient the user.
2. The logout icon gives a fast, familiar escape.
3. The bold avatar/name block identifies the active account.
4. `NODE_ACTIVE` confirms the active workspace.
5. Trust, gigs, and reliability cards summarize the account.
6. System Preferences exposes the secure-node motif without pretending to be a security report.
7. `DISCONNECT_SESSION` makes logout explicit and discoverable.

Do not remove the profile panel's elements because they are “just visual.” The visual composition is the product's account-state explanation. Do correct any visual prop that could be mistaken for measured security or trust.

### Floating navigation dock

The black dock keeps the primary mode switch available without looking like a standard browser tab bar. The centre plus action supports organiser posting; the user action returns to the profile; the briefcase action returns to work. Keep the active state obvious and retain accessible labels.

### Error boundary and empty states

Network and auth failures are expected in a Firebase app. Embedded browsers may not support Google sign-in at all, so they need a clear standard-browser fallback rather than repeated automatic retries. The error boundary, retry copy, scanning empty state, waiting-for-signals state, and progress overlays prevent the user from interpreting a transient delay as data loss. Preserve them when refactoring queries or loading states.

## 5. Before editing or deleting anything

Use this checklist before a material change:

1. Locate the component, its callers, CSS classes, state, and Firestore query with `rg`.
2. Read the nearby comments and the corresponding type/rule definitions.
3. Record the current user problem or state the feature solves.
4. Classify every affected value as real data, derived data, or a visual prop.
5. Check auth, role, ownership, and status transitions in `firestore.rules`.
6. Consider loading, empty, success, failure, retry, signed-out, and logged-out states.
7. Preserve the visual system: phone shell, glyph, typography, spacing, ticker, dock, and motion intent.
8. If deleting a feature, identify its replacement behavior and update this memory file if the product intent changes.
9. Add or update a code comment beside presentation-only values.
10. Run the validation and browser checks in Section 7.

“Simplifying” is not a sufficient reason to delete a feature. The removal must make the product clearer, safer, or more usable, and the replacement must preserve the original purpose.

## 6. Data and security guardrails

- The authenticated Firebase UID is the identity boundary.
- User roles are chosen during profile creation and are intended to be immutable.
- A gig belongs to its organiser; clients must not rewrite that ownership.
- An application references both its gig and organiser; those relationships must be validated.
- Organisers control accept/reject for their gigs; artists control their own application cancellation when that state is supported.
- Firestore rules are the enforcement layer, not React conditionals.
- New fields need type definitions, form/query behavior, rule validation, and a review of PII exposure.
- Do not trust client timestamps, IDs, role fields, or status shortcuts.
- Preserve the deny-by-default fallback.
- Never commit `.env.local`, API keys, service-account files, OAuth secrets, or generated credential artifacts.

Known current limitations to keep visible during future work:

- The radar scan remains a visual motif and is not a map or proximity service; only its open-gig count is live.
- Gemini is served by an App Check-protected callable function, but the secret, App Check provider, and function must be configured/deployed in the target Firebase project before production use.
- The Firestore emulator suite requires Java 21+. CI installs it; older local Java installations cannot execute the rules suite.
- Firebase Authentication provider settings and authorized domains are console-managed. Verify the canonical Firebase Hosting hostname and both local development hostnames before release.
- Firebase web configuration values are client configuration, but access is still constrained by auth and Firestore rules; do not treat a public API key as a secret or as authorization.
- Production Google sign-in is supported from `https://edge-gig-marketplace.web.app/`. GitHub Pages only forwards there and must not become a second authentication origin.
- OAuth redirect behavior is sensitive to hostname, authorized domains, browser context, and stored state. Test the canonical address in a standard browser. Treat an embedded-browser message to open that address externally as a supported recovery path.

Current workflow guarantees:

- Application documents use the deterministic `{gigId}_{artistId}` ID, and Firestore rules enforce one application per artist per gig.
- Accepting an application and filling its gig happen in one Firestore transaction. The filled gig records the accepted application and artist IDs.
- Artists can view application history, withdraw pending applications, and cancel accepted bookings through reciprocal transactions.
- Organisers can complete or cancel filled gigs, record artist no-shows, and both participants can leave one immutable review after completion.
- Profile details are editable while identity, role, trust counters, and creation time remain protected by Firestore rules.

## 7. Change, visual QA, and publishing checklist

Before calling a change complete:

### Code and data

- Run `npm.cmd run lint`.
- Run `npm.cmd run build`.
- Run `git diff --check` when working in a Git checkout.
- Review the diff for accidental deletions, debug text, secrets, and unannotated props.
- If schema or permissions changed, review `src/types.ts`, the relevant query/form, `firebase-blueprint.json`, and `firestore.rules` together.

### Browser behavior

- Open the fresh local build in the intended browser context.
- Start signed out and verify the tilted-glyph auth screen.
- Click `Initialize Protocol` and verify that the developer-only localhost popup completes in a standard browser.
- Verify that the local app receives the authenticated session and both auth loading states complete.
- Verify success does not return to the landing screen.
- Verify auth failure gives a useful retry message.
- Repeat the signed-out redirect test on `https://edge-gig-marketplace.web.app/` and verify that Google returns to that canonical origin.
- On the canonical production app, verify that Google opens as a full-page redirect, not a popup.
- Open the GitHub Pages address and verify that its app shell forwards to `https://edge-gig-marketplace.web.app/` before sign-in starts.
- In an unsupported embedded browser, verify the user gets a clear instruction to open the canonical address in Chrome, Edge, Firefox, or Safari instead of an endless loading state.
- Verify a new user can choose a role and reach the correct home.
- Verify the artist feed, gig form, organiser dashboard, and applicant decision states that the change touches.
- Open the profile and check the top logout icon, `NODE_ACTIVE`, telemetry cards, `AES-256` panel, `DISCONNECT_SESSION`, and floating dock.
- Use logout, then verify the auth entry returns cleanly without stale authenticated content.
- Resize or inspect the phone frame so no critical content is behind a sticky overlay or clipped by overflow.

### Release readiness

- Do not publish until the docs and code comments explain intentional props and known limitations.
- Confirm local OAuth domains and the canonical production redirect configuration are documented separately; localhost success does not prove production success.
- Deploy the complete app to Firebase Hosting. Publish only the forwarding app shell to GitHub Pages.
- Smoke-test authentication on `https://edge-gig-marketplace.web.app/`; do not use the GitHub Pages forwarder as proof that sign-in works.
- Keep the existing feature intent visible in the commit or pull request description.
- Mention any intentional visual change with a before/after screenshot or concise rationale.
- Publish only after lint, build, browser smoke checks, and security review are green.

## 8. Source map

| Concern | Source |
|---|---|
| App screens, flows, copy, animations | `src/App.tsx` |
| Auth and OAuth redirect/callback | `src/components/AuthContext.tsx` |
| Firebase initialization and persistence | `src/lib/firebase.ts` |
| Domain types | `src/types.ts` |
| Shared visual tokens and shell | `src/index.css` |
| Data authorization | `firestore.rules` |
| Data model sketch | `firebase-blueprint.json` |
| Auth hostname troubleshooting | `docs/firebase-auth-local.md` |
| Detailed visual laws | `docs/EDGE_VISUAL_SYSTEM.md` |

When in doubt, preserve the meaning and ask whether a change improves the user's ability to understand or complete a booking workflow.
