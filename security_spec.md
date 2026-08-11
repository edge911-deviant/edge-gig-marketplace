# Security Specification — EDGE Gig Marketplace

## Enforced invariants

1. A user document belongs to the authenticated UID; role, UID, trust counters, and creation time cannot be self-edited.
2. Only an authenticated organiser can create a gig for their own UID, and every new gig starts `open`.
3. Application IDs are deterministic: `{gigId}_{artistId}`. This makes one application per artist/gig a database invariant.
4. An application must reference an existing, open gig and its real organiser.
5. Accepting an application and filling its gig are reciprocal writes in one transaction.
6. A filled gig can become `completed`, or it can be cancelled together with its accepted application.
7. Only the owning organiser can record completion, organiser cancellation, or an artist no-show. The accepted artist may cancel only their own booking.
8. Reviews are immutable, one per participant/gig, and only allowed between the organiser and accepted artist after completion.
9. Browser clients send only `gigId` and `artistId` for AI analysis. The callable backend verifies ownership and reads protected data itself.

## Deny cases covered by the emulator suite

- identity spoofing and role escalation;
- unknown profile fields and oversized profile content;
- filled gig creation and non-owner gig edits;
- application ID spoofing and repeat applications;
- self-acceptance or non-atomic acceptance;
- unilateral cancellation of an accepted booking;
- reviews before completion, by outsiders, or for the wrong recipient.

Run the executable rules suite with Java 21+:

```powershell
npm.cmd run test:rules
```
