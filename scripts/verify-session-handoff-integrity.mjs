#!/usr/bin/env node
/**
 * 新チャット import 検証 — bridge JSON → 高密度プロンプト展開 + ビジュアルマップ
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { bridgePath, bridgeSchemaOk, loadBridge } from './lib/cio-session-bridge.mjs';
import { renderHandoffVisualMap } from './lib/cio-handoff-visual-map.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const doImport = process.argv.includes('--import');
  const bridge = loadBridge(root);

  if (!bridge) {
    console.error('[verify:session-handoff-integrity] NG bridge 無し — npm run cio:session:export-handoff');
    process.exit(1);
  }

  if (!bridgeSchemaOk(bridge)) {
    console.error('[verify:session-handoff-integrity] NG schema invalid');
    process.exit(1);
  }

  for (const rel of bridge.nextFiles || []) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) {
      console.error('[verify:session-handoff-integrity] NG missing', rel);
      process.exit(1);
    }
  }

  if (doImport) {
    console.log(renderHandoffVisualMap(root, bridge));
    console.log('');
    console.log('━━━━━━━━ SESSION HANDOFF IMPORT ━━━━━━━━');
    console.log(bridge.promptBlock || '');
    console.log('');
    console.log(`gitHead: ${bridge.gitHead}`);
    console.log(`exportedAt: ${bridge.exportedAt}`);
    console.log(`nextTask: ${bridge.nextTask}`);
    console.log('nextFiles:');
    for (const f of bridge.nextFiles) console.log(`  @${f}`);
    console.log('━━━━━━━━ ロケットスタート OK — New Chat 本題へ ━━━━━━━━');
  } else {
    console.log('[verify:session-handoff-integrity] OK bridge valid');
  }

  process.exit(0);
}

main();
