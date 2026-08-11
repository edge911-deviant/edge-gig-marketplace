import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  CANONICAL_APP_URL,
  AUTH_REDIRECT_PENDING_KEY,
  canonicalForwardTarget,
  chooseAuthTransport,
  clearPendingAuthRedirect,
  describeAuthError,
  hasPendingAuthRedirect,
  markAuthRedirectPending,
  runAfterAuthPrerequisite,
  withAuthTimeout,
} from './authFlow';

test('uses a same-origin redirect on the canonical Firebase app', () => {
  assert.equal(chooseAuthTransport({
    hostname: 'edge-gig-marketplace.web.app',
    origin: 'https://edge-gig-marketplace.web.app',
  }), 'same-origin-redirect');
});

test('keeps popup auth only for local developer testing', () => {
  assert.equal(chooseAuthTransport({ hostname: 'localhost', origin: 'http://localhost:3000' }), 'local-popup');
  assert.equal(chooseAuthTransport({ hostname: '127.0.0.1', origin: 'http://127.0.0.1:3000' }), 'local-popup');
});

test('forwards every other public host to the canonical Firebase app', () => {
  const githubLocation = {
    hostname: 'edge911-deviant.github.io',
    origin: 'https://edge911-deviant.github.io',
  };
  assert.equal(chooseAuthTransport(githubLocation), 'canonical-forward');
  assert.equal(canonicalForwardTarget(githubLocation), CANONICAL_APP_URL);
  assert.equal(canonicalForwardTarget({
    hostname: 'edge-gig-marketplace.web.app',
    origin: 'https://edge-gig-marketplace.web.app',
  }), null);
  assert.equal(CANONICAL_APP_URL, 'https://edge-gig-marketplace.web.app/');
});

test('returns a recoverable message when redirect startup times out', async () => {
  await assert.rejects(
    withAuthTimeout(new Promise<void>(() => undefined), 5),
    (error: unknown) => {
      assert.equal(describeAuthError(error), 'Google sign-in did not open within 20 seconds. Open EDGE in Chrome, Edge, Firefox, or Safari and try again.');
      return true;
    },
  );
});

test('returns successful authentication work before the deadline', async () => {
  assert.equal(await withAuthTimeout(Promise.resolve('ready'), 50), 'ready');
});

test('a timed-out prerequisite can never start the redirect side effect later', async () => {
  let resolvePrerequisite: (() => void) | undefined;
  const prerequisite = new Promise<void>((resolve) => {
    resolvePrerequisite = resolve;
  });
  let redirectStarts = 0;

  await assert.rejects(runAfterAuthPrerequisite(prerequisite, async () => {
    redirectStarts += 1;
  }, 5));
  resolvePrerequisite?.();
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(redirectStarts, 0);
});

test('tracks and clears the redirect handoff marker', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };

  assert.equal(hasPendingAuthRedirect(storage), false);
  markAuthRedirectPending(storage);
  assert.equal(values.get(AUTH_REDIRECT_PENDING_KEY), '1');
  assert.equal(hasPendingAuthRedirect(storage), true);
  clearPendingAuthRedirect(storage);
  assert.equal(hasPendingAuthRedirect(storage), false);
});

test('the GitHub Pages shell immediately forwards to the canonical app', async () => {
  const redirectPage = await readFile(new URL('../../.github/pages-redirect.html', import.meta.url), 'utf8');
  assert.match(redirectPage, /http-equiv="refresh" content="0; url=https:\/\/edge-gig-marketplace\.web\.app\/\?from=github-pages"/);
  assert.match(redirectPage, /target\.searchParams\.set\('fresh', Date\.now\(\)\.toString\(36\)\)/);
  assert.match(redirectPage, /window\.location\.replace\(target\.toString\(\)\)/);
  assert.match(redirectPage, /href="https:\/\/edge-gig-marketplace\.web\.app\/">Continue to EDGE<\/a>/);
});

test('Firebase Hosting always rebuilds and verifies the full app before deployment', async () => {
  const firebaseConfig = JSON.parse(
    await readFile(new URL('../../firebase.json', import.meta.url), 'utf8'),
  ) as { hosting: { predeploy?: string[] } };

  assert.deepEqual(firebaseConfig.hosting.predeploy, [
    'npm run build:firebase',
    'npm run verify:hosting-artifact',
  ]);
});

test('Firebase HTML is never allowed to reuse a stale authentication shell', async () => {
  const firebaseConfig = JSON.parse(
    await readFile(new URL('../../firebase.json', import.meta.url), 'utf8'),
  ) as { hosting: { headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }> } };
  const cacheValueFor = (source: string) => firebaseConfig.hosting.headers
    ?.find((entry) => entry.source === source)
    ?.headers.find((header) => header.key === 'Cache-Control')
    ?.value;

  assert.equal(cacheValueFor('/'), 'no-cache, no-store, must-revalidate');
  assert.equal(cacheValueFor('**/*.html'), 'no-cache, no-store, must-revalidate');
  assert.equal(cacheValueFor('/assets/**'), 'public, max-age=31536000, immutable');
});
