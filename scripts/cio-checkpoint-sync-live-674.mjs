#!/usr/bin/env node
/**
 * #D2: checkpoint の 674 BUILD / rev / fileKey を live json から更新。
 * customize は触らない。行数は変えない。
 *
 *   npm run cio:checkpoint:sync-live-674
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const livePath = path.join(root, 'data/cio-live-builds.json');
const cpPath = path.join(root, 'chat-sessions/checkpoint-latest.md');

const live = JSON.parse(fs.readFileSync(livePath, 'utf8'));
const app = live.apps && live.apps['674'];
if (!app?.build || app.revision == null || !app.fileKey) {
  console.error('[cio:checkpoint:sync-live-674] NG live json 674 incomplete');
  process.exit(1);
}

const before = fs.readFileSync(cpPath, 'utf8');
const tableRe = /(\| \*\*674\*\* \| `)[^`]+(` \| \*\*)\d+(\*\* \|)/;
const keyRe = /(\*\*674 live fileKey\*\*: `)[^`]+(`)/;
if (!tableRe.test(before) || !keyRe.test(before)) {
  console.error('[cio:checkpoint:sync-live-674] NG 674 markers missing');
  process.exit(1);
}

const after = before
  .replace(tableRe, `$1${app.build}$2${app.revision}$3`)
  .replace(keyRe, `$1${app.fileKey}$2`);

if (after.split(/\r?\n/).length !== before.split(/\r?\n/).length) {
  console.error('[cio:checkpoint:sync-live-674] NG line count changed');
  process.exit(1);
}

if (after !== before) fs.writeFileSync(cpPath, after);
console.log(`[cio:checkpoint:sync-live-674] OK BUILD=${app.build} rev=${app.revision}`);
