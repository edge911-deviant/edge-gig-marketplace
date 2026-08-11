import assert from 'node:assert/strict';
import test from 'node:test';
import { assertFirebaseAppArtifact } from './hosting-artifact.mjs';

test('accepts the full Vite application artifact regardless of script attribute order', () => {
  assert.doesNotThrow(() => assertFirebaseAppArtifact(`
    <!doctype html>
    <div id="root"></div>
    <script crossorigin src="/assets/index-CTbHwlsr.js" type="module"></script>
  `));
  assert.doesNotThrow(() => assertFirebaseAppArtifact(`
    <!doctype html>
    <div class="app" id="root"></div>
    <script type="module" src="/assets/index-ABC123.js"></script>
  `));
});

test('rejects a project-relative application bundle from a leaked Pages base path', () => {
  assert.throws(() => assertFirebaseAppArtifact(`
    <!doctype html>
    <div id="root"></div>
    <script type="module" src="/edge-gig-marketplace/assets/index-ABC123.js"></script>
  `), /missing the compiled EDGE application bundle/);
});

test('rejects the GitHub Pages forwarder as a Firebase Hosting artifact', () => {
  assert.throws(() => assertFirebaseAppArtifact(`
    <!doctype html>
    <meta http-equiv="refresh" content="0; url=https://edge-gig-marketplace.web.app/" />
    <script>window.location.replace('https://edge-gig-marketplace.web.app/');</script>
  `), /missing the compiled EDGE application bundle|Refusing to deploy/);
});
