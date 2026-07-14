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
  const rag = runNpmScript(root, 'verify:rag-mirror-canonical');
  if (!rag.ok) {
    console.error('[cio:quick-health] ❌ verify:rag-mirror-canonical 失敗 — `npm run rag:mirror:canonical-docs`');
    process.exit(rag.code ?? 2);
  }

  console.log('[cio:quick-health] ✅ OK');
}

main();
