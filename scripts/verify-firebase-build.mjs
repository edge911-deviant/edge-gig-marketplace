import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { assertFirebaseAppArtifact } from './hosting-artifact.mjs';

const firebaseIndex = fileURLToPath(new URL('../dist/index.html', import.meta.url));
const html = await readFile(firebaseIndex, 'utf8');

assertFirebaseAppArtifact(html);
console.log('Firebase Hosting artifact verified: full EDGE app is ready to deploy.');
