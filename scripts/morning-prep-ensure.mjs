#!/usr/bin/env node
/**
 * 朝ブリーフィング `docs/reports/<JST 当日>-morning-prep.md` を
 * （1）生成する、または（2）生成済みであることを検証する。
 *
 *   npm run morning:ensure          # daily-morning-prep 実行 → ファイル検証（exit 0/2）
 *   npm run morning:verify-today    # --verify-only（生成しない）
 *
 * @see scripts/daily-morning-prep.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verifyOnly = process.argv.includes('--verify-only');

function jstYmd() {
  const r = spawnSync('bash', ['-lc', 'TZ=Asia/Tokyo date +%F'], { encoding: 'utf8', cwd: root });
  if (r.status !== 0) {
    console.error('[morning-prep-ensure] ❌ date command failed (bash/WSL required for TZ=Asia/Tokyo)');
    process.exit(2);
  }
  const ymd = (r.stdout || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    console.error(`[morning-prep-ensure] ❌ bad date output: ${JSON.stringify(ymd)}`);
    process.exit(2);
  }
  return ymd;
}

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

const ymd = jstYmd();

if (!verifyOnly) {
  console.log(`[morning-prep-ensure] generating (JST ${ymd}) …`);
  const printSh = path.join(root, 'scripts', 'print-nvm-node-bin.sh');
  const gen = spawnSync(
    'bash',
    [
      '-lc',
      `NVMN="$(bash "${printSh}")" && export PATH="$NVMN:$PATH" && cd "${root}" && TZ=Asia/Tokyo node scripts/daily-morning-prep.mjs`,
    ],
    { stdio: 'inherit', cwd: root, env: { ...process.env, TZ: 'Asia/Tokyo' } },
  );
  if (gen.status !== 0 && gen.status != null) {
    console.error(`[morning-prep-ensure] ❌ daily-morning-prep exit ${gen.status}`);
    process.exit(typeof gen.status === 'number' ? gen.status : 2);
  }
}

process.exit(verify(ymd));
