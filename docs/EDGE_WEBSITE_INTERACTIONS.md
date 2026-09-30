# EDGE public website interactions

The website introduces EDGE as a structured network for live performance: artists find work, organisers produce events, venues host and programme shows, and audiences discover artists and local live moments. Motion supports that explanation and the next action. The public POC must never look like a live booking or ticketing service that is already complete.

## Product grounding

The current [development spreadsheet](https://docs.google.com/spreadsheets/d/1Q6WSXU0LagqDnHpJfFwRMqT6kfjuZNW3oT_58is0vkY/edit?usp=sharing) was refreshed on 2026-09-30. `DEV Focus!A8` calls for local discovery of gigs, events and venues; `DEV Focus!A9` names Audience and Venue roles. `Team Goals!L25` identifies audience exploration of artists and nearby gigs. Preserve all four roles in the hero, role circuit and help answers.

Some spreadsheet status notes predate implemented features. Use them as product intent; inspect the repository to determine what currently works. The unrelated spreadsheet-product domain suggestions do not define this marketplace's identity.

## Research and decisions

| Source | What informed this pass | Implementation |
| --- | --- | --- |
| [Teenage Engineering OP-1 field](https://teenage.engineering/products/op-1) | Music hardware gives EDGE a useful reference for specific operational labels and deliberate instrumentation. This is an aesthetic interpretation, not evidence of conversion improvement. | Warm shell, ink surfaces, mono signal labels, constrained lime geometry. Retain the existing brand mark and fonts. |
| [Resident Advisor local events](https://ra.co/events/in/kolkata) | City-based event discovery is relevant to the audience side of EDGE. | City/PIN selection and separate performance-work and live-show views with place, sound and date context. No ticketing claim. |
| [NN/g: The Role of Animation and Motion in UX](https://www.nngroup.com/articles/animation-purpose-ux/) | Motion draws attention; short feedback and state changes are useful, competing animation can distract. | One moving hero landmark, brief headline/pulse feedback, optional help mascot. A visible pause control stops the effects. |
| [NN/g: Scroll Fading 101](https://www.nngroup.com/articles/scroll-fading-101/) | Persistent, responsive effects work better than repeated reveals and scrolljacking. | Small one-time positional reveals. Text stays visible, native scroll is preserved, anchors remain standard links. |
| [MDN: hover](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/hover) | Hover capability differs across input devices. | Fine-pointer reticle and parallax; tap/click/keyboard replay and role controls for everyone. Hover never owns essential content. |
| [web.dev: high-performance animations](https://web.dev/articles/animations-guide) | Transform and opacity avoid expensive layout animation; rendering work should be deliberate. | Spring-based image transforms, one bounded DPR-capped canvas, no added animation framework or 3D runtime. Suspend the canvas offscreen and in hidden tabs. |
| [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) | Real geolocation needs explicit device permission and a secure context. | This POC does not call geolocation. The simulation says so and supports manual demo PINs instead. |

These references inform design choices. No engagement or conversion uplift has been measured yet.

## Interaction contract

- `Keep it clear.` replays on tap/click or keyboard focus, and gives one brief introductory pulse. No rapidly flashing background or duplicated accessible text.
- Hero geometry is a decorative projection of two rotating wireframe volumes. It is not location, network or marketplace telemetry. The existing stage photograph stays prominent.
- The native cursor remains visible. The additional reticle is pointer-transparent, hidden over text entry/dialogs, absent on coarse pointers and disabled with reduced motion.
- Motion preference is local to the browser session. Device reduced-motion settings take precedence. Controls work even if session storage is unavailable. Motion off also disables smooth anchor scrolling.
- Artist, Organiser, Venue and Audience nodes are buttons with `aria-pressed`, updated explanatory text and links to their role sections.
- Demo PINs `700001`, `400001`, `560001` select Kolkata, Mumbai and Bengaluru respectively. Unknown/short PINs produce recoverable inline feedback; city shortcuts always remain available.
- `Use demo location` simulates Kolkata. No device location is requested, transmitted or stored.
- The nine public listings are fictional, isolated from authenticated data. Genre filters work in both discovery modes. Brief/show detail dialogs create no applications, bookings or tickets.
- Help is available in navigation. The bot asset appears only when help opens. Answers are curated; no AI chat or live agent is connected. The contact link opens an email draft and sends nothing automatically.
- Native dialogs provide focus handling and Escape dismissal. Preserve the named close controls and return focus to the opening control.

## Companion asset

Saved asset: `public/edge-help-node.png`. Generated using the built-in Image Generation tool, with alpha transparency. It is an original 3D-rendered raster, not an interactive 3D model. This keeps the panel light and avoids adding a WebGL dependency. The original generated file remains recoverable outside the repository.

Final prompt:

Use case: stylized-concept. Asset type: small help companion for the EDGE live-performance marketplace website, shown inside an optional help panel at about 100px wide. Subject: a single compact 3D-rendered desktop signal robot. Design: an angular, slightly tilted matte-black terminal head with clipped corners, a warm off-white shell edge, two tiny acid-lime rectangular eyes, one subtle short antenna, and a small understated black body. No humanoid hands, no oversized limbs. Three-quarter front view, calm curious expression. Style/medium: premium industrial product CGI with believable rough matte plastic, soft studio light, crisp silhouette, restrained surface details; futuristic music hardware, not a glossy toy. Palette: ink black, warm off-white #f8f7f4, small #d8ff3e lime accents. Composition: entire object centered, fills about 80% of a square canvas, isolated on a genuinely transparent background. Constraints: no text, no branding, no watermark, no background, no shadow outside the object, no blue/purple gradient, no chrome, no pink, no extra props. Preserve actual alpha transparency.

## Repository and evidence

Generated screenshots and browser reports are excluded by `.gitignore`. Source regression tests remain tracked. Old audit evidence was moved, not deleted, to `C:/Users/Abhranil/.codex/visualizations/2026/09/29/01a0ee71-3ed0-7271-b4d7-d34cfce0113c/edge-audit-archive`. New interaction evidence is saved beside it in `edge-motion-audit`.

Phase checkpoints: `69d2c94` before changes; `2d227cc` repository hygiene; `85d78fe` hero/motion/circuit; `16aedf8` local discovery; `6f21717` help companion. The earlier website identity checkpoint `5b44a02` remains available. Revert the appropriate phase commit(s) to remove an experiment without replacing the original app.

## Verification and audit

1. **Purpose and current-state audit — passed.** Reviewed the public website before extending it, the mobile-first app boundary, and all relevant workbook tabs. The hero, circuit, role sections and help preserve the four-sided product definition. Source: the workbook cells above and the existing authenticated workflows. No auth, Firestore rules or booking mutations were changed.
2. **Responsive visual review — passed at tested widths.** Inspected 320 × 844, 390 × 844, 768 × 1024 and 1440 × 1000 browser viewports. Fixed a help/pulse collision by moving help into navigation; fixed public-only minimum-width overflow and tightened the small-phone circuit. The minimum-phone help, motion and join controls measure at least 44px high. A single filtered opportunity fills its grid. Evidence: `09-final-hero-desktop.png`, `10-final-hero-320.png`, `11-final-stage-320.png`, `12-role-circuit-320.png`, `13-help-320.png`, `14-tablet-header.png`, `16-filtered-discovery-desktop.png`.
3. **Interaction and keyboard review — passed for exercised paths.** Replayed headline and stage signals; selected Audience; paused/resumed effects; exercised invalid and supported PINs, city/genre/mode switches, booking and show details, all help topics and the contact link. Escape closes both native dialogs and returns focus to their opening buttons. Consecutive paused screenshots were identical, and smooth scrolling is disabled while paused. The fresh QA tab reported no browser error logs. Evidence: `03-circuit-audience-desktop.png`, `05-mobile-demo-brief.png`, `06-discovery-mobile.png`, `07-help-mobile.png`, `15-motion-paused-desktop.png`, `17-live-show-mobile.png`.
4. **Code and artifact checks — passed.** TypeScript check, 19 existing regression tests, production build and hosting-artifact verification passed. The build still reports the existing large-bundle advisory; it is not a new build failure. Generated audits and reports are ignored; useful source tests stay versioned.

Evidence files are in the external `edge-motion-audit` folder described above, not in version control. Browser viewport checks do not emulate a physical touch device or constitute a full screen-reader/contrast audit. Coarse-pointer and reduced-motion behavior were also reviewed in the implementation; physical-device and assistive-technology checks remain a follow-up. Signed-in navigation uses the shorter visible label `Workspace` on phones while retaining the full accessible action name and unchanged workspace callback.

## Next implementation boundary

Real location lookup needs an actual PIN/geographic data source and permission/error handling. Public event discovery needs host-controlled publication and a safe public data projection. Help can later be backed by a support service; keep account data out of it until that integration is deliberately designed. Test these interactions on physical touch devices and with assistive technology before claiming accessibility compliance.
