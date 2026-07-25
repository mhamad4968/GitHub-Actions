#!/usr/bin/env node
/**
 * LOTO7 ソースを Git 正本 external/loto7 と Desktop 実行ミラー間で同期する。
 * DB・学習モデル・pid・キャッシュは運用データのため同期/追跡しない。
 *
 * Default: Desktop -> repo（既存実装の初回取込・緊急修正回収）
 * --to-desktop: repo -> Desktop（通常運用）
 * --verify: バイト一致のみ
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.join(root, 'external', 'loto7');
const desktopDir =
  process.env.LOTO7_DESKTOP_DIR ||
  'C:\\Users\\mhamada202408224\\Desktop\\Loto7';

const FILES = [
  'README-DEV.txt',
  'ai_server.py',
  'app.py',
  'auto_brain.py',
  'backtest_report.py',
  'build_db.py',
  'check_deps.py',
  'fetch_results.py',
  'import_history.py',
  'index.html',
  'loto7_constants.py',
  'loto7_predict.py',
  'loto7_stats.py',
  'requirements.txt',
  'seed_data.py',
  'start_app.bat',
  'verify_loto7.py',
];

const verifyOnly = process.argv.includes('--verify');
const toDesktop = process.argv.includes('--to-desktop');
const fromDir = toDesktop ? repoDir : desktopDir;
const toDir = toDesktop ? desktopDir : repoDir;

if (!fs.existsSync(fromDir)) {
  console.error(`[sync-loto7-source] NG source directory missing: ${fromDir}`);
  process.exit(1);
}
fs.mkdirSync(toDir, { recursive: true });

let changed = 0;
let bad = 0;
for (const name of FILES) {
  const src = path.join(fromDir, name);
  const dst = path.join(toDir, name);
  if (!fs.existsSync(src)) {
    console.error(`[sync-loto7-source] NG missing source: ${name}`);
    bad++;
    continue;
  }
  const source = fs.readFileSync(src);
  const target = fs.existsSync(dst) ? fs.readFileSync(dst) : null;
  const same = target && source.equals(target);
  if (verifyOnly) {
    if (!same) {
      console.error(`[sync-loto7-source] NG mismatch: ${name}`);
      bad++;
    }
    continue;
  }
  if (!same) {
    fs.writeFileSync(dst, source);
    changed++;
    console.log(`[sync-loto7-source] copied ${name}`);
  }
}

if (bad) process.exit(1);
if (verifyOnly) {
  console.log(`[sync-loto7-source] OK ${FILES.length} source files match`);
} else {
  console.log(
    `[sync-loto7-source] OK direction=${toDesktop ? 'repo->Desktop' : 'Desktop->repo'} changed=${changed}`,
  );
}
