import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// This is the browser entry point. It finds <div id="root"> in index.html
// and mounts the React App component into it. You normally do not need to
// change this file unless you are changing the app's global providers.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
