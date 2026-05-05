#!/usr/bin/env node
/**
 * deploy:* の前段: logs/cio-preflight/<app>.json が存在し、stampedAt が新しければ OK。
 * チャット上の規律そのものは検証できないが、「スタンプ無しの本番書き込み」を構造的に拒否する。
 *
 * 緊急脱出: SKIP_CIO_DEPLOY_GUARD=1（浜田 GO とチャットに理由 1 行を残すこと）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_AGE_MS = 45 * 60 * 1000;

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

  console.log(`[cio-deploy-preflight-guard] OK app=${app} age=${Math.round(age / 1000)}s note=${JSON.stringify((data.note || '').slice(0, 80))}`);
  process.exit(0);
}

main();
