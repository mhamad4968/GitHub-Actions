#!/usr/bin/env node
/**
 * deploy:* の前段: logs/cio-preflight/<app>.json が存在し、stampedAt が新しければ OK。
 * チャット上の規律そのものは検証できないが、「スタンプ無しの本番書き込み」を構造的に拒否する。
 *
 * 緊急脱出: SKIP_CIO_DEPLOY_GUARD=1（浜田 GO とチャットに理由 1 行を残すこと）
 * §51-6-2 4h 超: SKIP_CIO_SESSION_CLOCK_DEPLOY=1（同上・新チャット推奨を無視するときのみ）
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CUSTOMIZE_DIR_TO_APP } from './lib/kintone-live-schema.mjs';
import {
  FOUR_H_MS,
  fmtDuration,
  parseClock,
  pathsFromRoot,
} from './lib/session-clock-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_AGE_MS = 45 * 60 * 1000;

function hasCustomizeForApp(app) {
  const numDir = path.join(root, 'customize', app);
  if (fs.existsSync(numDir) && fs.statSync(numDir).isDirectory()) {
    return fs.readdirSync(numDir).some((f) => f.endsWith('.js'));
  }
  for (const [dir, id] of Object.entries(CUSTOMIZE_DIR_TO_APP)) {
    if (id !== app) continue;
    const full = path.join(root, 'customize', dir);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      return fs.readdirSync(full).some((f) => f.endsWith('.js'));
    }
  }
  return false;
}

function assertSessionClockAllowsDeploy() {
  // GHA 無人ジョブは Cursor 壁時計の対象外（checkout された SESSION-CLOCK.md の経過で落ちる再発防止）
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log(
      '[cio-deploy-preflight-guard] GITHUB_ACTIONS=true — §51-6-2 session-clock 検査スキップ（定期/dispatch 無人）',
    );
    return;
  }
  if (process.env.SKIP_CIO_SESSION_CLOCK_DEPLOY === '1') {
    console.warn(
      '[cio-deploy-preflight-guard] SKIP_CIO_SESSION_CLOCK_DEPLOY=1（§51-6-2 4h 硬拒否を緊急回避・証跡をチャットに残すこと）',
    );
    return;
  }
  const { clockAbs } = pathsFromRoot(root);
  const clk = parseClock(clockAbs);
  if (clk.mode === 'over') {
    const elapsed = fmtDuration(clk.elapsedMs || FOUR_H_MS);
    console.error(
      `[cio-deploy-preflight-guard] ❌ §51-6-2: 同一セッション 4h 超（経過 ${elapsed}）— deploy 硬拒否`,
    );
    console.error('  → 新チャットで区切り、npm run session:clock:set → bootstrap 後に再開');
    console.error(
      '  緊急のみ: SKIP_CIO_SESSION_CLOCK_DEPLOY=1 npm run deploy:<app>（浜田 GO 1 行必須）',
    );
    process.exit(2);
  }
  if (clk.mode === 'missing' || clk.mode === 'bad') {
    console.error(
      `[cio-deploy-preflight-guard] ❌ SESSION-CLOCK.md が未設定/不正（mode=${clk.mode}）— deploy 前に session:clock:set`,
    );
    process.exit(2);
  }
  // mode ok | skip（未設定扱いの skip は上で missing 相当にしたいが、歴史的に skip=未設定文言）
  if (clk.mode === 'skip') {
    console.error(
      '[cio-deploy-preflight-guard] ❌ SESSION-CLOCK 開始: 未設定 — deploy 前に npm run session:clock:set',
    );
    process.exit(2);
  }
}

function main() {
  if (process.env.SKIP_CIO_DEPLOY_GUARD === '1') {
    console.warn('[cio-deploy-preflight-guard] SKIP_CIO_DEPLOY_GUARD=1（緊急モード・証跡をチャットに残すこと）');
    process.exit(0);
  }

  const app = String(process.argv[2] || '').trim();
  if (!/^\d{3}$/.test(app)) {
    console.error('[cio-deploy-preflight-guard] 使い方: node scripts/cio-deploy-preflight-guard.mjs <appId>');
    process.exit(2);
  }

  // 2026-07-31 浜田承認: 4h 超は本番書き込みを機械拒否（新チャット以外禁止）。
  assertSessionClockAllowsDeploy();

  const rel = path.join('logs', 'cio-preflight', `${app}.json`);
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`[cio-deploy-preflight-guard] ❌ 先に preflight スタンプがありません: ${rel}`);
    console.error(`  実行: npm run cio:preflight:${app} -- --note "（チャット規律の一行要約）"`);
    console.error(`  緊急のみ: SKIP_CIO_DEPLOY_GUARD=1 npm run deploy:${app}`);
    process.exit(2);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (_e) {
    console.error(`[cio-deploy-preflight-guard] ❌ JSON 破損: ${rel}`);
    process.exit(2);
  }

  const t = Date.parse(data.stampedAt);
  if (Number.isNaN(t)) {
    console.error(`[cio-deploy-preflight-guard] ❌ stampedAt 不正: ${rel}`);
    process.exit(2);
  }

  const age = Date.now() - t;
  if (age > MAX_AGE_MS) {
    console.error(
      `[cio-deploy-preflight-guard] ❌ スタンプが古すぎます（>${Math.floor(MAX_AGE_MS / 60000)}分）。再スタンプしてください。`,
    );
    console.error(`  最終: ${data.stampedAt}`);
    process.exit(2);
  }

  if (process.env.SKIP_CIO_MODE_B_INTERLOCK !== '1') {
    for (const [script, args] of [
      ['cio-composer-silent-fallback-guard.mjs', []],
      ['cio-deepseek-5038-evidence-guard.mjs', ['--force-check']],
    ]) {
      const absScript = path.join(root, 'scripts', script);
      const r = spawnSync(process.execPath, [absScript, ...args], { cwd: root, encoding: 'utf8' });
      if (r.status !== 0) {
        process.stderr.write(r.stderr || r.stdout || '');
        process.exit(1);
      }
    }
  }

  // P1/P2 (2026-07-25 浜田承認): App756 は deploy 前に BUILD と最小UI配線を機械突合。
  // 2026-07-31 浜田承認（夕反省）: chrome-css も deploy 前に必須（push のみだと LIVE 後発覚）。
  if (app === '756') {
    for (const script of [
      'verify-jikkou-v2-build-tag.mjs',
      'verify-jikkou-v2-ui-smoke.mjs',
      'verify-jikkou-v2-chrome-css.mjs',
    ]) {
      const r = spawnSync(process.execPath, [path.join(root, 'scripts', script)], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe'],
      });
      if (r.stdout) process.stdout.write(r.stdout);
      if (r.stderr) process.stderr.write(r.stderr);
      if (r.status !== 0) {
        console.error(`[cio-deploy-preflight-guard] ❌ App756 deploy前検査 NG: ${script}`);
        process.exit(1);
      }
    }
  }

  if (hasCustomizeForApp(app) && process.env.SKIP_CIO_LIVE_SCHEMA_GUARD !== '1') {
    const liveScript = path.join(root, 'scripts', 'verify-kintone-live-schema.mjs');
    const lr = spawnSync(process.execPath, [liveScript, '--app', app], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    const combined = `${lr.stdout || ''}\n${lr.stderr || ''}`;
    if (lr.stdout) process.stdout.write(lr.stdout);
    if (lr.stderr) process.stderr.write(lr.stderr);
    const liveSchemaOk =
      /\[verify:kintone-live-schema\] OK — 実機スキーマと customize 完全一致/.test(combined);
    if (lr.status !== 0) {
      if (liveSchemaOk && lr.status !== 2) {
        console.warn(
          `[cio-deploy-preflight-guard] WARN live-schema exit=${lr.status} but stdout OK — Windows UV crash 想定 · deploy 続行 (#D-WIN-SCHEMA-01)`,
        );
      } else if (lr.status === 2) {
        console.error(
          `[cio-deploy-preflight-guard] ❌ verify:kintone-live-schema API/接続エラー app=${app} — 再試行後に deploy`,
        );
        console.error(`  緊急のみ: SKIP_CIO_LIVE_SCHEMA_GUARD=1 npm run deploy:${app}`);
        process.exit(2);
      } else {
        console.error(
          `[cio-deploy-preflight-guard] ❌ verify:kintone-live-schema --app ${app} NG — フィールド不一致・deploy 中止`,
        );
        console.error(`  緊急のみ: SKIP_CIO_LIVE_SCHEMA_GUARD=1 npm run deploy:${app}`);
        process.exit(1);
      }
    }
    console.log(`[cio-deploy-preflight-guard] OK live-schema app=${app}`);
  } else if (process.env.SKIP_CIO_LIVE_SCHEMA_GUARD === '1') {
    console.warn(
      `[cio-deploy-preflight-guard] SKIP_CIO_LIVE_SCHEMA_GUARD=1 app=${app}（緊急モード・証跡をチャットに残すこと）`,
    );
  }

  console.log(`[cio-deploy-preflight-guard] OK app=${app} age=${Math.round(age / 1000)}s note=${JSON.stringify((data.note || '').slice(0, 80))}`);
  process.exit(0);
}

main();
