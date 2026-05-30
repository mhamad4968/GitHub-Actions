#!/usr/bin/env node
/**
 * 新チャット import 検証 — bridge JSON → 高密度プロンプト展開 + ビジュアルマップ
 * --validate-export: 15ターン荷造り漏れ DeepSeek 職分クロスチェック（第11層・タスク③）
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { bridgePath, bridgeSchemaOk, loadBridge } from './lib/cio-session-bridge.mjs';
import { renderHandoffVisualMap } from './lib/cio-handoff-visual-map.mjs';
import {
  printHandoffIssues,
  stampBridgeValidated,
  validateExportHandoff,
} from './lib/cio-handoff-export-validate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const doImport = process.argv.includes('--import');
  const doValidateExport = process.argv.includes('--validate-export');
  const allowHeadDrift = process.argv.includes('--allow-head-drift');
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

  if (doValidateExport) {
    const result = validateExportHandoff(root, { allowHeadDrift });
    if (!result.ok) {
      console.error('[verify:session-handoff-integrity] NG --validate-export', result.issues.length, '件');
      printHandoffIssues(result.issues);
      const statePath = path.join(root, 'logs/cio-session-dissolution/state.json');
      if (fs.existsSync(statePath)) {
        try {
          const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
          state.crosscheckOk = false;
          state.updatedAt = new Date().toISOString();
          fs.mkdirSync(path.dirname(statePath), { recursive: true });
          fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
        } catch {
          /* noop */
        }
      }
      process.exit(1);
    }
    stampBridgeValidated(root);
    console.log('[verify:session-handoff-integrity] OK --validate-export (DeepSeek職分突合)');
    console.log(`  checkpoint: ${result.checkpointTask?.slice(0, 80) ?? '(n/a)'}`);
    console.log(`  auditor: ${result.semantic?.auditor ?? 'deepseek-deterministic'}`);
  }

  if (doImport) {
    if (bridge.crosscheckOk === false) {
      console.error('[verify:session-handoff-integrity] NG crosscheckOk=false — --validate-export を先に実行');
      process.exit(1);
    }
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
  } else if (!doValidateExport) {
    console.log('[verify:session-handoff-integrity] OK bridge valid');
  }

  process.exit(0);
}

main();
