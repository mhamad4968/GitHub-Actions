#!/usr/bin/env node
/**
 * 新チャット import 検証 — bridge JSON → 高密度プロンプト展開 + ビジュアルマップ
 * --validate-export: 15ターン荷造り漏れ DeepSeek 職分クロスチェック（第11層・タスク③）
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { bridgePath, bridgeSchemaOk, loadBridge } from './lib/cio-session-bridge.mjs';
import { checkBridgeStaleness } from './lib/cio-bridge-staleness.mjs';
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
  const strictStaleness = process.argv.includes('--strict-staleness');
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

  if (strictStaleness) {
    let cfg = {};
    try {
      const cfgPath = path.join(root, 'data/cursor-env-config.json');
      if (fs.existsSync(cfgPath)) cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    } catch {
      /* noop */
    }
    const staleness = checkBridgeStaleness(root, bridge, cfg.bridgeStaleness || {});
    if (!staleness.ok) {
      console.error('[verify:session-handoff-integrity] NG --strict-staleness', staleness.issues.length);
      for (const i of staleness.issues) {
        console.error(`  [${i.code}] ${i.message}`);
        if (i.fix) console.error(`    fix: ${i.fix}`);
      }
      process.exit(1);
    }
    console.log('[verify:session-handoff-integrity] OK --strict-staleness');
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

    if (process.env.SKIP_CIO_GIT_HISTORY_HANDOFF !== '1') {
      const alignScript = path.join(root, 'scripts', 'verify-git-history-alignment.mjs');
      const alignArgs = ['--handoff'];
      if (bridge.gitHead) alignArgs.push('--since', bridge.gitHead);
      const r = spawnSync(process.execPath, [alignScript, ...alignArgs], {
        cwd: root,
        encoding: 'utf8',
        stdio: 'inherit',
      });
      if (r.status !== 0) {
        console.error(
          '[verify:session-handoff-integrity] NG git-history-alignment --handoff（先祖返り検知）',
        );
        process.exit(1);
      }
      console.log('[verify:session-handoff-integrity] OK git-history-alignment --handoff');
    } else {
      console.warn(
        '[verify:session-handoff-integrity] SKIP_CIO_GIT_HISTORY_HANDOFF=1 — 緊急モード（理由1行をチャットに残すこと）',
      );
    }
  } else if (!doValidateExport) {
    console.log('[verify:session-handoff-integrity] OK bridge valid');
  }

  process.exit(0);
}

main();
