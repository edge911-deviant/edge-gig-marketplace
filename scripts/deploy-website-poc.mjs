import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const expectedBranch = '9112-deviant/full-website';
const branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
if (branch !== expectedBranch) {
  throw new Error(`Website POC deployment requires ${expectedBranch}; current branch is ${branch || 'detached HEAD'}.`);
}

// Channel deploy cannot publish to Firebase's live channel. Use a separate
// artifact/config and leave production auth domains, rules, and functions alone.
const result = spawnSync(process.execPath, [
  fileURLToPath(new URL('../node_modules/firebase-tools/lib/bin/firebase.js', import.meta.url)),
  'hosting:channel:deploy', 'website-poc',
  '--expires', '30d',
  '--no-authorized-domains',
  '--project', 'gen-lang-client-0182110057',
  '--config', 'firebase.poc.json',
  '--non-interactive',
], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
