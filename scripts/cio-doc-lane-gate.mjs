#!/usr/bin/env node
/**
 * ドキュメントレーン機械ゲート（C:\tmp\マニュアル）
 * DeepSeek/Kimi スタンプ + Word ロック + preflight --check-only
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DOC_BASE = path.win32.normalize('C:\\tmp\\マニュアル');
const STAMPS = path.join(DOC_BASE, 'scripts', '.doc_lane_stamps');
const PREFLIGHT = path.join(DOC_BASE, 'scripts', 'doc_lane_preflight.py');
const VERIFY_CH3_C5 = path.join(DOC_BASE, 'scripts', 'verify_v5_ch3_c5_references.py');

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function hasStamp(name) {
  return fs.existsSync(path.join(STAMPS, `${name}_${todayKey()}.stamp`));
}

function main() {
  const strict = process.argv.includes('--strict');
  let ok = true;

  console.log('[cio:doc-lane-gate] ドキュメントレーン検査\n');

  for (const name of ['deepseek', 'kimi']) {
    if (hasStamp(name)) {
      console.log(`  OK stamp: ${name}_${todayKey()}.stamp`);
    } else {
      console.error(`  NG stamp: ${name} — python doc_lane_preflight.py --stamp ${name}`);
      ok = false;
    }
  }

  if (!fs.existsSync(PREFLIGHT)) {
    console.error(`  NG preflight スクリプトなし: ${PREFLIGHT}`);
    process.exit(strict ? 2 : 1);
  }

  const py = spawnSync('python', [PREFLIGHT, '--check-only'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (py.stdout) process.stdout.write(py.stdout);
  if (py.stderr) process.stderr.write(py.stderr);
  if ((py.status ?? 1) !== 0) {
    ok = false;
  }

  if (fs.existsSync(VERIFY_CH3_C5)) {
    console.log(
      '\n[cio:doc-lane-gate] v5 参照検査（P3: Ｃ－５/Ｃ－６ 誤参照 + 第８章 Ａ－３ 空欄）'
    );
    const v3 = spawnSync('python', [VERIFY_CH3_C5], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: path.join(DOC_BASE, 'scripts'),
    });
    if (v3.stdout) process.stdout.write(v3.stdout);
    if (v3.stderr) process.stderr.write(v3.stderr);
    if ((v3.status ?? 1) !== 0) {
      ok = false;
    }
  }

  if (!ok) {
    console.error('\n[cio:doc-lane-gate] NG — fix_toc_v5.py / Word 編集は禁止');
    process.exit(strict ? 2 : 1);
  }

  console.log('\n[cio:doc-lane-gate] OK');
  console.log(
    '【浜田確認】Word 目次を 1 項目目視してください（例: Ｃ－２ p.22）。問題なければ 1 行で OK を返信。'
  );
  console.log('  正本: docs/runbooks/doc-lane-completion-report.md（C4）');
  process.exit(0);
}

main();
