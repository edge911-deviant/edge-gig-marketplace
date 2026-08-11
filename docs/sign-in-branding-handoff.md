# Google sign-in branding update

## The short version

The Google sign-in window previously showed a long technical name:

`gen-lang-client-0182110057.firebaseapp.com`

That was not the name of the product. It was an automatically generated web address belonging to the service that securely handles Google sign-in.

The public sign-in route now uses the clearer address:

`edge-gig-marketplace.web.app`

Google has also received the official product name, logo, contact email, website, privacy policy, and terms for **EDGE — Gig Marketplace**.

## What has changed for users

- The broken Google redirect error has been removed.
- The old `gen-lang...` address is no longer used by the released app.
- The sign-in route now uses the EDGE-branded web address.
- The app is public, so people outside the development team can sign in.
- Public About, Privacy, and Terms pages explain the product and how account information is used.
- Both the GitHub Pages version and the Firebase-hosted version are available publicly.

## What is still waiting

Google is manually reviewing the EDGE name and logo. Google estimates that this review normally takes two to three business days.

Until Google approves that review, its account chooser may say:

`edge-gig-marketplace.web.app`

After approval, Google should show **EDGE — Gig Marketplace** and the EDGE logo instead. This review is controlled by Google and cannot be completed from the application code.

## What was checked

- The released app contains the new sign-in address and no reference to the old generated address.
- Google’s sign-in helper pages respond correctly.
- An existing login session opens the organiser console successfully.
- The project’s automated checks and all six current tests pass.
- GitHub Pages deployed successfully.
- The public website ownership was verified with Google Search Console.
- Google lists the app as public and in production.

## Public links

- Main public build: https://edge911-deviant.github.io/edge-gig-marketplace/
- Branded Firebase build: https://edge-gig-marketplace.web.app/
- About: https://edge-gig-marketplace.web.app/about.html
- Privacy: https://edge-gig-marketplace.web.app/privacy.html
- Terms: https://edge-gig-marketplace.web.app/terms.html

## Important note for future updates

Do not remove `public/google3ea270e6a26ebb9e.html`. It is the small public file that proves to Google that this EDGE website belongs to the project. Removing it can cause the product branding to lose its verified status.
