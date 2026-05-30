#!/usr/bin/env node
/**
 * 改善案1 — 環境変数・秘密鍵セルフ監査
 * @see data/cio-env-manifest.json / .cursor/rules/cio-env-integrity-gate.mdc
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { auditEnvIntegrity, formatEnvWarning } from './lib/cio-env-integrity.mjs';

const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'data', 'cio-env-manifest.json');

function main() {
  if (!fs.existsSync(manifestPath)) {
    console.error('[verify:cio-env-integrity] NG manifest missing');
    process.exit(2);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const issues = auditEnvIntegrity(root, manifest);

  if (issues.length) {
    console.error(`${RED}${formatEnvWarning(issues)}${RESET}`);
    console.error('[verify:cio-env-integrity] NG', issues.length, 'missing');
    for (const i of issues) console.error(`  - ${i.key}: ${i.label}`);
    console.error('[verify:cio-env-integrity] ヒント: npm run cio:env:self-healing');
    process.exit(1);
  }

  console.log('[verify:cio-env-integrity] OK env + MCP keys present (values not logged)');
  process.exit(0);
}

main();
