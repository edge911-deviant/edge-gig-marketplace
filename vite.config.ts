import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Vite is the development server and production bundler. Most UI changes do
// not require editing this file; use it for build-time settings and aliases.
export default defineConfig(({ mode }) => ({
    // GitHub Pages serves project sites from /<repository>/ rather than /.
    // Local/Firebase builds keep the root base unless a release workflow
    // explicitly supplies VITE_BASE_PATH.
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    // The website POC has a separate entry point with no Firebase session or
    // data access. Regular app and Pages builds keep their existing entry.
    build: mode === 'website-poc' ? {
      rollupOptions: { input: path.resolve(__dirname, 'poc.html') },
    } : undefined,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
}));
