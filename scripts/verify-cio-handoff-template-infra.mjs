#!/usr/bin/env node
/**
 * C v2 handoff template infra 検査
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'docs/runbooks/checkpoint-handoff-template-v2.md',
  'data/cio-handoff-template.json',
  'scripts/lib/cio-handoff-template.mjs',
  'scripts/verify-checkpoint-handoff-template.mjs',
  'scripts/cio-handoff-append-block.mjs',
  'chat-sessions/templates/checkpoint-freeze-zone.template.md',
  'chat-sessions/templates/handoff-log-block.template.md',
  'chat-sessions/templates/HANDOFF-HUMAN-block.template.txt',
];

const needles = [
  { rel: 'scripts/cio-session-export-handoff.mjs', needles: ['getDefaultBridgeNextFiles'] },
  { rel: 'scripts/cio-session-cold-start.mjs', needles: ['verify:checkpoint-handoff-template'] },
  { rel: 'data/cio-handoff-template.json', needles: ['connectionRules', 'bridgeNextFiles', 'version'] },
];

function main() {
  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) {
      console.error('[verify:cio-handoff-template-infra] NG missing', rel);
      process.exit(1);
    }
  }
  for (const { rel, needles: ns } of needles) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const n of ns) {
      if (!text.includes(n)) {
        console.error(`[verify:cio-handoff-template-infra] NG "${n}" not in ${rel}`);
        process.exit(1);
      }
    }
  }
  console.log('[verify:cio-handoff-template-infra] OK C v2 checkpoint/handoff template');
  process.exit(0);
}

main();
