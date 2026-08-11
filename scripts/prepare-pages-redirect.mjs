import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const redirectSource = fileURLToPath(new URL('../.github/pages-redirect.html', import.meta.url));
const pagesIndex = fileURLToPath(new URL('../dist/index.html', import.meta.url));

await copyFile(redirectSource, pagesIndex);
console.log('GitHub Pages index now forwards to the canonical Firebase app.');
