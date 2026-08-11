# DEV Focus status

Updated 2026-08-11. This checklist is the non-negotiable release gate for EDGE.

| Priority | Status | Evidence / remaining operation |
|---|---|---|
| Google sign-in and authorized domains | Code complete; production verification pending | Stateful OAuth handoff, persistence, and actionable errors are implemented. Google provider and every production hostname still require Firebase Console verification. |
| Firestore authorization tests | Verified | `tests/firestore.rules.test.ts` covers identity, profiles, applications, atomic hiring/cancellation, lifecycle, and reviews. The initial GitHub Actions run passed with Java 21. |
| Gemini secret behind a backend | Implemented; deployment pending | `functions/src/index.ts` is an authenticated, App Check-enforced callable. Configure `GEMINI_API_KEY`, App Check, and deploy the function. |
| Prevent repeat applications | Complete | Deterministic `{gigId}_{artistId}` documents plus Firestore create-only enforcement. |
| Artist application tracking | Complete | Live application history, status, withdrawal, accepted-booking cancellation, and post-completion review UI. |
| Search and genre filters | Complete | Case-insensitive title/description/genre/location search with combined genre filtering and domain tests. |
| Atomic hiring | Complete | Application acceptance and gig filling use one reciprocal Firestore transaction and matching rules. |
| Editable profile | Complete | Name, bio, location, genres, and portfolio edits; UID, role, trust counters, and creation time remain immutable. |
| Completion, reviews, reliability, cancellations | Complete | Completion, organiser/artist cancellation, no-show capture, one review per participant/gig, and derived reliability/rating metrics. |
| Replace hardcoded marketplace metrics | Complete | Active gigs, registered artists, recent activity, completed gigs, reviews, and reliability are derived from live Firestore state. |

## Release assessment

Feature development is on track and the DEV Focus code scope is complete. The initial GitHub CI run passed. Production release is not yet green until the Firebase console/deployment operations above are completed. The web build also emits a large-bundle warning (~1.08 MB minified); code-splitting is a recommended performance follow-up, not a DEV Focus blocker.
