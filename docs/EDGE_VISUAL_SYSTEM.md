# EDGE Visual System

This is the visual source of truth for EDGE - Gig Marketplace. It describes the “glyph cyberpunk” language: a quiet console inside a pale device shell, with strong black signal surfaces and restrained status accents. The goal is futuristic confidence, not a generic neon dashboard.

Read this with [EDGE_MEMORY.md](../EDGE_MEMORY.md). Product intent and data truth win over visual imitation.

## 1. Visual thesis

EDGE should feel like a field terminal for live performance work:

> White hardware shell. Black signal layer. Small, deliberate telemetry accents. Human work translated into a precise glyph system.

The cyberpunk quality comes from typography, labels, motion, status bars, ticker rhythm, and the tilted terminal glyph. It does not require a black background everywhere, rainbow gradients, glowing borders, or noisy sci-fi decoration. Most of the canvas is calm and off-white so the black console elements feel intentional.

The visual system has four simultaneous jobs:

1. Establish an unmistakable EDGE identity.
2. Give every screen a stable device-like frame.
3. Make real marketplace state easy to scan.
4. Turn waiting, confirmation, and account state into meaningful console moments.

## 2. Palette

Use the existing CSS tokens and Tailwind colors before inventing new values.

| Token / use | Value | Guidance |
|---|---|---|
| `bg` / page | `#F8F7F4` | Warm off-white canvas; keeps the app editorial rather than sterile. |
| `ink` / primary black | `#0A0A0A` | Headlines, terminal surfaces, primary buttons, navigation dock. |
| white shell | `#FFFFFF` | Main phone surface and cards. |
| line | `rgba(0, 0, 0, 0.06)` | Quiet borders and separators; never make every panel heavy. |
| shell ring | Tailwind `slate-100` | Pale hardware rim around the phone frame. |
| secondary text | Tailwind `slate-400` / `slate-500` | Supporting labels, metadata, and inactive state. |
| structure text | Tailwind `slate-600` | The blue-grey body statement and secondary hierarchy. |
| active emerald | Tailwind `emerald-500`, approximately `#10B981` | Online dots, node status, successful trust accent, battery fill. |
| signal blue | Tailwind `blue-600`, approximately `#2563EB` | Gigs or secondary telemetry accent; use sparingly. |
| error red | Tailwind `red-500` / `red-600` | Auth failures, destructive logout language, invalid states only. |

Accent colors should be small, functional signals. Do not turn EDGE into a rainbow neon interface. A useful visual hierarchy is black for action and structure, slate for explanation, emerald for active/success, blue for a category/value, and red for error/disconnect.

## 3. Typography

The current font stack is part of the brand:

- `Inter`, weights 300-800: body copy, headings, controls, names, and forms.
- `JetBrains Mono`: telemetry values, device labels, timestamps, status codes, and ticker copy.
- `Playfair Display`, italic 900: small editorial section labels such as `TRUST`, `RELIABILITY`, and `SYSTEM PREFERENCES`.

The contrast between Inter's practical geometry, JetBrains Mono's machine readout, and Playfair's italic human/editorial note is intentional. Do not replace all three with one font “for consistency.” The contrast is the consistency.

Existing shared classes encode the pattern:

- `.col-header`: Playfair italic, roughly 10px, uppercase, muted opacity, wide tracking.
- `.data-value`: JetBrains Mono, roughly 11px, bold.
- Ticker and device labels: JetBrains Mono, uppercase, wide letter spacing.
- Main user and product headings: Inter, heavy weight, tight tracking.

Use uppercase machine language for short labels, not for paragraphs. Use sentence case for explanations and form guidance. Large names and primary product phrases should remain human-readable even when surrounding labels are cryptic.

## 4. Geometry and device frame

The main stage is a phone-like container, even on desktop:

- Mobile width is capped around `420px`.
- Larger viewports use the same narrow device stage rather than stretching cards to the full browser width.
- The shell is white with a pale `slate-100` ring around it.
- The shell uses very large rounded corners, approximately `3.5rem`.
- The shell shadow is broad and soft: the device should float above the warm page, never look like a hard browser panel.
- The frame is a flex column with controlled overflow; content scrolling belongs inside the device.
- The floating dock sits visually outside/over the lower edge of the content without covering critical content.

Internal cards use a family of large radii, from about `2rem` to `2.5rem`. Buttons use approximately `2rem` pill radii. Borders are pale and shadows are restrained. Rounded geometry is how the product gets its hardware-like feel; avoid mixing sharp rectangles into the core shell without a semantic reason.

### Brand mark geometry

The app mark is a black, tilted terminal glyph on a transparent canvas. Preserve the asset's transparent background, aspect ratio, tilt, corner treatment, and white terminal stroke. The same mark appears in auth/loading contexts and in the app icon/favicons. Use `/edge-app-icon-transparent.png` through `EdgeMark`; do not recreate it with a different CSS shape.

The glyph is the visual “device boot” cue. Its tilt gives EDGE a little instability and energy while the rest of the frame remains precise.

## 5. Layout anatomy

The signed-in shell follows this order:

```text
warm page canvas
  centered white device frame + pale ring + soft shadow
    StatusBar
    ActivityTicker (black signal strip)
    screen content
    floating black navigation dock
```

### StatusBar

The top device/status bar contains `EDGE_01`, signal bars, `2.4 GHz`, a green battery motif, and a live 24-hour browser clock. It gives the shell a physical-device reading and anchors every screen. The signal, frequency, and battery graphics are presentation props; the clock is real browser time. Keep that distinction in code comments and do not call the bar a network monitor.

### ActivityTicker

The black ticker is a narrow moving band of JetBrains Mono copy. Current copy includes:

`NEW GIG POSTED: UNDERGROUND JAZZ JAM`  /  `ARTIST "KINETIC" JUST BOOKED`  /  `SYSTEM SCAN COMPLETE`  /  `SIGNAL STRENGTH NOMINAL`

It should scroll continuously and quietly, like a background signal. It must not compete with the primary action or become so fast that it is unreadable. The repeated spans create a loop; preserve enough copy width to avoid a blank gap.

### Content surface

Content uses generous vertical spacing, strong horizontal alignment, and one dominant task per screen. The artist feed prioritizes the next opportunity. The organiser dashboard prioritizes the current gig and applicant decisions. The profile prioritizes identity and session control.

### Floating dock

The black dock is a compact, high-contrast control strip. Its briefcase, plus, and user actions are separated by shape and active-state treatment. The centre plus is visually prominent for posting; the active destination is white against the black shell. Keep the dock rounded, floating, and accessible without making it obscure the screen.

## 6. Profile screen hierarchy

The profile is not a settings dump. It is a live account node:

1. Small `PROFILE_NODE` / `Session_Active` orientation label.
2. Top-right logout icon for immediate session escape.
3. Large black avatar tile with the grey user glyph.
4. Emerald `NODE_ACTIVE` status line.
5. Heavy Inter user name.
6. Wide-tracked `organiser_ID` or role identifier.
7. Three telemetry cards: `Trust`, `Gigs`, `Reliability`.
8. `SYSTEM PREFERENCES` panel with `SIGNAL ENCRYPTION` and `AES-256`.
9. A separate, visible `DISCONNECT_SESSION` button.
10. Floating navigation dock.

The profile must keep its full vertical story at phone size. In particular, flex compression or sticky overlays must never hide `AES-256`, the black encryption bar, or the disconnect action. If content needs to scroll, the scroll area should preserve those elements in order and maintain a safe bottom inset.

## 7. Copy and glyph lexicon

Use the lexicon consistently. Each phrase needs a state or a deliberate product-fiction role.

| Phrase | Role |
|---|---|
| `EDGE_01` | Device/node identity. |
| `System_Initializing` | Signed-out boot state. |
| `Initialize Protocol` | Primary action that begins sign-in. |
| `Authenticating_EDGE` | Provider/auth exchange in progress. |
| `Powering_Up_EDGE` | Authenticated workspace preparation. |
| `Structured performance booking protocol.` | Product promise: a booking system with structure. |
| `SECURE_CLOUD` | Atmosphere/release footer; not a certification. |
| `BUILD_2026.4.20` | Release label; change deliberately. |
| `PROFILE_NODE` | Profile screen identity. |
| `Session_Active` | User is signed in. |
| `NODE_ACTIVE` | Authenticated active workspace. |
| `ADMIN_CONSOLE` / `Gig Control` | Organiser workspace identity. |
| `NEW ASSIGNMENT` | Artist feed/work queue heading. |
| `Radar_Scan_Active` / `LIVE_FEED` | Visual feed/radar motif; do not imply real location telemetry. |
| `Confirm signal` | Commit a new gig. |
| `System Preferences` | Profile security/status panel heading. |
| `Signal Encryption` / `AES-256` | Secure-node visual language; code-commented prop until measured. |
| `Disconnect_Session` | Actual logout action. |

Avoid random substitutions such as “Launch,” “Execute,” “Sync,” or “Neural” unless they make the state clearer. EDGE copy should be terse, legible, and slightly operational, not parody sci-fi.

## 8. Motion and interaction inventory

Motion is part of the product narrative. It should communicate boot, signal, progress, selection, and connection. Preserve intent and timing unless a usability problem is demonstrated.

| Motion | Current behavior | Meaning |
|---|---|---|
| Auth glyph entrance | Opacity `0` to `1`, scale `.86` to `1`, rotation `-12deg` to `10deg`, spring with damping `18` | A tilted terminal booting into alignment. |
| Loading scanline | `scanline` animation, `8s linear` | Slow system sweep. |
| Loading progress | Opacity cycles `.4 / 1 / .4`; inner bar travels from `-100%` to `200%` over `1.2s` | Indeterminate work, not a fake percentage. |
| Activity ticker | x `[0, -1000]`, duration `30`, linear, infinite | Continuous ambient marketplace signal. |
| Live radar | Rotating ring, 360 degrees over `10s`, infinite | Visual scan motif, not location data. |
| Gig card | Hover scale `1.01`; tap scale `.98` | Small physical response to selection. |
| Apply overlay | Sliding loop, roughly `1s` | Application is being transmitted/processed. |
| Modal sheet | Enters from y `100%`, spring damping `30`, stiffness `300` | A control surface rising from the device edge. |
| Profile transitions | AnimatePresence wait mode, small x offset around `10px` plus fade | Console-like screen change without a hard cut. |
| AES bar | Animates from width `0` to `82%` | Visual boot/progress accent only; not a measured encryption score. |
| Haptics | Light tap for small controls, medium for commit/logout, success/error patterns | Tactile confirmation where supported; never the only feedback. |

Respect reduced-motion preferences when adding new motion. Do not use looping movement on a critical state if it makes the state harder to read. Every important transition needs a settled state that can be read without watching the animation.

## 9. Gradients, shadows, and surfaces

- Use subtle white fades, pale black lines, and broad shadows to suggest a device surface.
- Keep the phone shadow diffuse rather than a sharp drop shadow.
- The black ticker, primary CTA, avatar tile, and navigation dock are the strongest dark surfaces.
- Use the existing scanline gradient toward transparency; it should feel like a sweep, not a white glare.
- Do not introduce glossy rainbow gradients, excessive glows, or noisy textured backgrounds.
- Glass/backdrop blur is acceptable for a safe action wrapper, but never use opacity or blur to hide critical text.
- Red should appear mainly for errors and destructive/disconnect language.

## 10. Accessibility and responsive laws

- Preserve readable contrast between black text, slate supporting text, emerald status, and the warm canvas.
- Keep interactive targets large and pill-shaped where the system already uses that convention.
- Retain `aria-label` and `title` on icon-only actions, especially the logout control and navigation buttons.
- Do not convey state through color or motion alone; pair it with a label.
- Keep focus styles visible and preserve keyboard access to the auth CTA, forms, modal controls, logout, and dock.
- Check the device frame at a narrow phone viewport and a wide desktop viewport.
- Do not allow sticky footers, fixed docks, or animated overlays to cover `AES-256`, disconnect, application decisions, or form submission errors.
- Avoid horizontal overflow in the ticker and cards; clipping is acceptable for the ticker strip only when the loop remains readable.
- For new motion, respect `prefers-reduced-motion` and keep a non-animated equivalent.

## 11. Prop and instrumentation rules

Visual props are a legitimate part of EDGE's atmosphere, but they must be named honestly in code. When a value is not backed by Firestore, Auth, a server calculation, or an actual browser/device API:

1. Add a nearby JSX/TypeScript comment saying it is presentation-only.
2. Do not use words like “verified,” “secure,” “live,” or “100%” in a way that implies proof.
3. Keep the prop stable and coherent with the screen instead of randomly changing it.
4. Add a data source, definition, loading state, and error state before upgrading it to real telemetry.
5. Update [EDGE_MEMORY.md](../EDGE_MEMORY.md) and the feature's tests/notes when the classification changes.

Examples already present in the codebase include `MarketplacePulse`, device signal indicators, `LiveRadar`, ticker events, the profile reliability demo value, the `AES-256` panel, and the build/footer labels. The source comments beside those values are part of the guardrail.

## 12. Visual QA checklist

Before approving a visual change, inspect the live app and confirm:

- The tilted transparent glyph is still the same asset and proportion.
- Auth begins with `Initialize Protocol` and preserves the branded loading sequence.
- Status bar and ticker remain visible and do not crowd the primary content.
- The active screen has one clear hierarchy and one obvious next action.
- Profile shows the full avatar/name hierarchy, `NODE_ACTIVE`, telemetry cards, `AES-256`, disconnect, and dock.
- Real data and presentation props are visually and semantically distinguishable.
- Motion settles correctly, does not cause layout jumps, and has a reduced-motion path.
- Auth failure, empty data, loading, and logout states still explain what happened.
- No critical text is clipped by a flex container, sticky wrapper, modal, or bottom dock.
- `npm.cmd run lint` and `npm.cmd run build` pass after the change.

If a screenshot looks “cleaner” because a meaningful element disappeared, treat that as a regression until its purpose is understood and replaced.
