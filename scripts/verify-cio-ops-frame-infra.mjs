#!/usr/bin/env node
/** 枠 / 監査1枚 / 下書きパックのファイル存在検査。実行結果の赤では落とさない。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'data/cio-ops-frame.json',
  'scripts/cio-ops-frame.mjs',
  'scripts/cio-ops-audit-sheet.mjs',
  'scripts/cio-keiei-draft-pack.mjs',
  'docs/runbooks/cio-ops-frame-audit-pack-v1.md',
  'chat-sessions/templates/keiei-monthly-draft-pack-README.template.md',
];

function main() {
  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) {
      console.error('[verify:cio-ops-frame-infra] NG missing', rel);
      process.exit(1);
    }
  }
  const frame = JSON.parse(fs.readFileSync(path.join(root, 'data/cio-ops-frame.json'), 'utf8'));
  if (frame.skipAllowed !== true || frame.itemZeroWins !== true || frame.notAGate !== true) {
    console.error('[verify:cio-ops-frame-infra] NG frame must skipAllowed+itemZeroWins+notAGate');
    process.exit(1);
  }
  const pkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
  for (const s of ['cio:ops:frame', 'cio:ops:audit-sheet', 'cio:keiei:draft-pack']) {
    if (!pkg.includes(`"${s}"`)) {
      console.error('[verify:cio-ops-frame-infra] NG missing npm', s);
      process.exit(1);
    }
  }
  const cold = fs.readFileSync(path.join(root, 'scripts/cio-session-cold-start.mjs'), 'utf8');
  if (cold.includes('verify:cio-ops-frame-infra') || cold.includes('cio:ops:audit-sheet')) {
    console.error('[verify:cio-ops-frame-infra] NG must not be a cold-start gate');
    process.exit(1);
  }
  const tpl = fs.readFileSync(
    path.join(root, 'chat-sessions/templates/keiei-monthly-draft-pack-README.template.md'),
    'utf8',
  );
  if (!tpl.includes('浜田が考えて') || !tpl.includes('出ないときだけ相談')) {
    console.error('[verify:cio-ops-frame-infra] NG neta rule missing in template');
    process.exit(1);
  }
  console.log('[verify:cio-ops-frame-infra] OK');
}

main();
