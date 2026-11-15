import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicLandingPage } from './components/PublicLandingPage';
import { CANONICAL_APP_URL } from './lib/authFlow';
import './index.css';

// This entry deliberately mounts only the public website. Its fictional demos
// work without AuthProvider, Firebase SDK initialization, or marketplace writes.
// Sign-in continues at the existing canonical mobile-first app.
function WebsitePoc() {
  return <PublicLandingPage onSignIn={() => window.location.assign(CANONICAL_APP_URL)} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><WebsitePoc /></StrictMode>,
);
