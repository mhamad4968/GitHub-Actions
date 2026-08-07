#!/usr/bin/env node
/**
 * 浜田へ「次手・レーン」を述べる直前 — closures / kintone-apps / checkpoint 3 系統突合
 *
 * Usage:
 *   npm run cio:briefing:recognition-gate
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readCheckpointNextTask } from './lib/cio-checkpoint-read.mjs';
import { loadProjectClosures } from './lib/cio-project-closure.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const verify = spawnSync(process.execPath, ['scripts/verify-checkpoint-project-closure.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (verify.status !== 0) {
    console.error('\n[cio:briefing:recognition-gate] NG — 先に docs/runbooks/cio-project-closure-governance.md §A を実施');
    process.exit(1);
  }

  const partC = spawnSync(process.execPath, ['scripts/verify-part-c-main-task-freshness.mjs'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (partC.status !== 0) {
    console.error('\n[cio:briefing:recognition-gate] NG — Part C 主タスク鮮度（D-PARTC-01）を先に修復');
    process.exit(1);
  }

  const nextTask = readCheckpointNextTask(root) || '(未設定)';
  const { closures } = loadProjectClosures(root);
  const appsPath = path.join(root, 'kintone-apps.md');
  const apps = fs.existsSync(appsPath) ? fs.readFileSync(appsPath, 'utf8') : '';

  console.log('\n=== [cio:briefing:recognition-gate] 3 系統突合（チャットに転記） ===');
  console.log(`1) closures: ${closures.length} 件`);
  for (const c of closures) {
    console.log(`   - ${c.id} ${c.status} (${c.closedAt}) → ${c.completionReport || '—'}`);
  }
  console.log(`2) kintone-apps: ${closures.length ? '状態マーカー照合済（verify 内）' : '—'}`);
  for (const c of closures) {
    if (c.kintoneAppsStateMarker) {
      console.log(`   - ${c.id}: "${c.kintoneAppsStateMarker}" ${apps.includes(c.kintoneAppsStateMarker) ? 'OK' : 'NG'}`);
    }
  }
  console.log(`3) checkpoint 次の1手: ${nextTask.slice(0, 160)}${nextTask.length > 160 ? '…' : ''}`);
  console.log('\n[cio:briefing:recognition-gate] OK — 浜田認識と矛盾したら §41 一問 → checkpoint 修正後に次手を述べる');
  process.exit(0);
}

main();
