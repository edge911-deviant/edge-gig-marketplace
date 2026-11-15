import assert from 'node:assert/strict';
import { readFile, readdir, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../dist-poc/', import.meta.url);
const html = await readFile(new URL('poc.html', output), 'utf8');
assert.match(html, /<meta name="edge-build" content="website-poc"/);
assert.match(html, /<script[^>]+src="\/assets\/poc-[^"]+\.js"/);
assert.doesNotMatch(html, /http-equiv=["']refresh/i);

// Check the actual compiled output so an accidental AuthProvider or Firebase
// import cannot silently turn the POC into another live marketplace client.
for (const name of await readdir(new URL('assets/', output))) {
  if (!name.endsWith('.js')) continue;
  const bundle = await readFile(new URL(`assets/${name}`, output), 'utf8');
  assert.doesNotMatch(bundle, /(?:identitytoolkit|securetoken|firestore)\.googleapis\.com/, `${name} contains a Firebase backend client`);
}

await rename(new URL('poc.html', output), new URL('index.html', output));
console.log(`Website POC verified: ${fileURLToPath(output)} (sample content; sign-in opens the current app).`);
