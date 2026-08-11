# Security policy

EDGE is currently a prelaunch alpha and is not ready for production bookings or sensitive personal data.

Please report a vulnerability privately through GitHub's **Security → Report a vulnerability** flow when available. Do not post exploitable details in a public issue.

The release gate requires passing Firestore emulator tests, deploying the App Check-protected callable function, configuring the Gemini secret, and verifying Firebase Authentication authorized domains. See [security_spec.md](security_spec.md) and [docs/DEV_FOCUS_STATUS.md](docs/DEV_FOCUS_STATUS.md).

`npm audit` currently reports upstream advisories in Firebase/Google dependencies for which npm provides no compatible fix. These must be reviewed again before promoting the alpha to beta or production.
