#!/usr/bin/env node
/**
 * 朝報 verify → 未作成なら fast 生成 → kintone:test + guard:check
 * @see package.json cio:quick-health
 */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { ensureMorningPrep, runNpmScript } from './lib/cio-session-preflight.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
  const morning = ensureMorningPrep(root, { fast: true });
  if (!morning.ok) {
    console.error('[cio:quick-health] ❌ morning-prep を fast で生成できませんでした');
    process.exit(2);
  }
  if (morning.action !== 'verified') {
    console.log(`[cio:quick-health] 朝報: ${morning.action}`);
  }

  const k = runNpmScript(root, 'kintone:test');
  if (!k.ok) {
    console.error('[cio:quick-health] ❌ kintone:test 失敗');
    process.exit(k.code ?? 2);
  }

  const g = runNpmScript(root, 'guard:check');
  if (!g.ok) {
    console.error('[cio:quick-health] ❌ guard:check 失敗');
    process.exit(g.code ?? 2);
  }

  // #S-RAG-WAKE-01 — RAG 正本ミラー不一致を朝路径で検知（close-git-warn まで見逃さない）
  // #S-RAG-WAKE-02 — WAKE 時は正本→ミラー方向で 1 回だけ Self-Heal（無限ループ禁止・未コミット差分は残しうる）
  let rag = runNpmScript(root, 'verify:rag-mirror-canonical');
  if (!rag.ok) {
    console.warn(
      '[cio:quick-health] ⚠ verify:rag-mirror-canonical NG → rag:mirror:canonical-docs を 1 回実行（正本→.rag 同期）',
    );
    const heal = runNpmScript(root, 'rag:mirror:canonical-docs');
    if (!heal.ok) {
      console.error('[cio:quick-health] ❌ rag:mirror:canonical-docs Self-Heal 失敗');
      process.exit(heal.code ?? 2);
    }
    rag = runNpmScript(root, 'verify:rag-mirror-canonical');
    if (!rag.ok) {
      console.error(
        '[cio:quick-health] ❌ Self-Heal 後も verify:rag-mirror-canonical 失敗 — 手動確認: npm run rag:mirror:canonical-docs -- --dry-run',
      );
      process.exit(rag.code ?? 2);
    }
    console.warn(
      '[cio:quick-health] ✅ rag-mirror Self-Heal 成功 — .rag/extra-docs 差分は締め前に commit 対象へ含めること',
    );
  }

  console.log('[cio:quick-health] ✅ OK');
}

main();
