#!/usr/bin/env node
/**
 * 朝ブリーフィング `docs/reports/<JST 当日>-morning-prep.md` を
 * （1）生成する、または（2）生成済みであることを検証する。
 *
 *   npm run morning:ensure          # daily-morning-prep 実行 → ファイル検証（exit 0/2）
 *   npm run morning:verify-today    # --verify-only（生成しない）
 *
 * **Windows 利用 PC**: ネイティブ Node（Cursor/npm）を **優先**（高速・health-check IS_WIN 経路）。
 * 失敗時のみ WSL + NVM v24 にフォールバック（cron 正本と同じ）。
 *
 * @see scripts/daily-morning-prep.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canRunMorningPrepNative,
  jstYmdIso,
  win32ToWslPath,
} from './lib/repo-node-env.mjs';
import { hiddenOpts } from './lib/win-hidden-spawn.mjs';
import {
  acquireMorningPrepLock,
  readMorningPrepLock,
  releaseMorningPrepLock,
} from './lib/morning-prep-lock.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verifyOnly = process.argv.includes('--verify-only');
const fast = process.argv.includes('--fast');

function reportPath(ymd) {
  return path.join(root, 'docs', 'reports', `${ymd}-morning-prep.md`);
}

function verify(ymd) {
  const p = reportPath(ymd);
  if (!fs.existsSync(p)) {
    console.error(`[morning-prep-ensure] ❌ missing: ${p}`);
    return 2;
  }
  const st = fs.statSync(p);
  if (st.size < 200) {
    console.error(`[morning-prep-ensure] ❌ too small (${st.size} B): ${p}`);
    return 2;
  }
  const head = fs.readFileSync(p, 'utf8').slice(0, 4000);
  const ok =
    /朝|Phase|ヘルス|ブリーフィング|morning-prep/i.test(head) ||
    head.includes('#') ||
    head.includes('##');
  if (!ok) {
    console.error(`[morning-prep-ensure] ❌ unexpected content (no markers): ${p}`);
    return 2;
  }
  console.log(`[morning-prep-ensure] ✅ OK ${p} (${st.size} B)`);
  return 0;
}

function runDailyMorningPrepWsl() {
  const printSh = path.join(root, 'scripts', 'print-nvm-node-bin.sh');
  const wslRoot = win32ToWslPath(root);
  const printShBash = win32ToWslPath(printSh);
  const fastFlag = fast ? ' --fast' : '';
  const inner = `NVMN="$(bash '${printShBash}')" && export PATH="$NVMN:$PATH" && cd '${wslRoot}' && TZ=Asia/Tokyo node scripts/daily-morning-prep.mjs${fastFlag}`;
  return spawnSync('wsl.exe', ['-d', 'Ubuntu', '-e', 'bash', '-lc', inner], hiddenOpts({
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, TZ: 'Asia/Tokyo' },
  }));
}

function runDailyMorningPrepNative() {
  const args = [path.join(root, 'scripts', 'daily-morning-prep.mjs')];
  if (fast) args.push('--fast');
  return spawnSync(process.execPath, args, {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, TZ: 'Asia/Tokyo', ...(fast ? { MORNING_PREP_FAST: '1' } : {}) },
  });
}

function runDailyMorningPrepLinux() {
  const printSh = path.join(root, 'scripts', 'print-nvm-node-bin.sh');
  const fastFlag = fast ? ' --fast' : '';
  const inner = `NVMN="$(bash '${printSh}')" && export PATH="$NVMN:$PATH" && cd '${root}' && TZ=Asia/Tokyo node scripts/daily-morning-prep.mjs${fastFlag}`;
  return spawnSync('bash', ['-lc', inner], {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, TZ: 'Asia/Tokyo' },
  });
}

const ymd = jstYmdIso();

if (!verifyOnly) {
  const lock = acquireMorningPrepLock(root);
  if (lock === 'busy') {
    const info = readMorningPrepLock(root);
    const ageSec = info?.startedAt ? Math.round((Date.now() - info.startedAt) / 1000) : -1;
    console.log(
      `[morning-prep-ensure] ⏳ 既に実行中（pid=${info?.pid ?? '?'} 経過=${ageSec}s）— 二重起動を回避`,
    );
    if (verify(ymd) === 0) {
      console.log('[morning-prep-ensure] 当日レポートは既にあるため exit 0');
      process.exit(0);
    }
    console.error('[morning-prep-ensure] レポート未生成のまま実行中 — 先のプロセス完了を待って再実行');
    process.exit(2);
  }
  if (lock === 'stale-replaced') {
    console.warn('[morning-prep-ensure] 古いロックを削除して再開');
  }

  const t0 = Date.now();
  console.log(`[morning-prep-ensure] generating (JST ${ymd})${fast ? ' [fast]' : ''} …`);
  console.log(
    '[morning-prep-ensure] 目安: Windows 約 5〜8 分 / WSL フル RAG 込みで 15〜20 分。Cursor からは kill せず完了まで待つか `npm run morning:ensure` をターミナルで単独実行',
  );
  let gen;
  try {
    if (process.platform === 'win32') {
      if (canRunMorningPrepNative()) {
        console.log('[morning-prep-ensure] route: Windows native Node (優先)');
        gen = runDailyMorningPrepNative();
        if (gen.status !== 0 && gen.status != null) {
          console.warn('[morning-prep-ensure] Windows native failed — retry via WSL …');
          gen = runDailyMorningPrepWsl();
        }
      } else {
        console.log('[morning-prep-ensure] route: WSL (native Node < v20)');
        gen = runDailyMorningPrepWsl();
      }
    } else {
      console.log('[morning-prep-ensure] route: Linux/WSL bash + NVM');
      gen = runDailyMorningPrepLinux();
    }
  } finally {
    releaseMorningPrepLock(root);
  }
  const elapsed = ((Date.now() - t0) / 1000 / 60).toFixed(1);
  console.log(`[morning-prep-ensure] 生成処理終了（${elapsed} 分）`);
  if (gen.status !== 0 && gen.status != null) {
    console.error(`[morning-prep-ensure] ❌ daily-morning-prep exit ${gen.status}`);
    process.exit(typeof gen.status === 'number' ? gen.status : 2);
  }
}

process.exit(verify(ymd));
