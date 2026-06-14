#!/usr/bin/env node
/**
 * deploy:* の前段: logs/cio-preflight/<app>.json が存在し、stampedAt が新しければ OK。
 * チャット上の規律そのものは検証できないが、「スタンプ無しの本番書き込み」を構造的に拒否する。
 *
 * 緊急脱出: SKIP_CIO_DEPLOY_GUARD=1（浜田 GO とチャットに理由 1 行を残すこと）
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CUSTOMIZE_DIR_TO_APP } from './lib/kintone-live-schema.mjs';

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

  if (hasCustomizeForApp(app) && process.env.SKIP_CIO_LIVE_SCHEMA_GUARD !== '1') {
    const liveScript = path.join(root, 'scripts', 'verify-kintone-live-schema.mjs');
    const lr = spawnSync(process.execPath, [liveScript, '--app', app], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'inherit',
      env: { ...process.env },
    });
    if (lr.status !== 0) {
      if (lr.status === 2) {
        console.error(
          `[cio-deploy-preflight-guard] ❌ verify:kintone-live-schema API/接続エラー app=${app} — 再試行後に deploy`,
        );
        console.error(`  緊急のみ: SKIP_CIO_LIVE_SCHEMA_GUARD=1 npm run deploy:${app}`);
        process.exit(2);
      }
      console.error(
        `[cio-deploy-preflight-guard] ❌ verify:kintone-live-schema --app ${app} NG — フィールド不一致・deploy 中止`,
      );
      console.error(`  緊急のみ: SKIP_CIO_LIVE_SCHEMA_GUARD=1 npm run deploy:${app}`);
      process.exit(1);
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
