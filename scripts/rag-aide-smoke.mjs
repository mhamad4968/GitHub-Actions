#!/usr/bin/env node
/**
 * rag-aide-smoke.mjs — constitution-aide 試行の軽量スモーク
 *
 *   npm run rag:aide-smoke              # パック集約 + vector ingest + 針
 *   npm run rag:aide-smoke -- --sync-only  # 集約 + 針のみ（朝の毎回）
 *
 * @see docs/runbooks/rag-constitution-aide-trial.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, '.rag', 'extra-docs', 'constitution-aide-trial');

const NEEDLES = [
  { file: 'rag-constitution-aide-trial.md', text: '夕反省 明日やること 禁止' },
  { file: 'checkpoint-latest.md', text: '完了済' },
  { file: 'ai-team-tool-routing-v2.md', text: 'cio:tool:route' },
];

function checkNeedles() {
  let failed = 0;
  for (const n of NEEDLES) {
    const p = path.join(DEST, n.file);
    if (!fs.existsSync(p)) {
      console.error(`[rag-aide-smoke] missing ${n.file}`);
      failed += 1;
      continue;
    }
    const body = fs.readFileSync(p, 'utf8');
    if (!body.includes(n.text)) {
      console.error(`[rag-aide-smoke] needle miss in ${n.file}: ${n.text}`);
      failed += 1;
      continue;
    }
    console.log(`[rag-aide-smoke] OK ${n.file} ∋ ${n.text}`);
  }
  return failed;
}

function main() {
  const args = process.argv.slice(2);
  const syncOnly = args.includes('--sync-only');
  const ingestArgs = [path.join(__dirname, 'rag-ingest-constitution-aide-trial.mjs')];
  if (syncOnly) ingestArgs.push('--sync-only');

  const r = spawnSync(process.execPath, ingestArgs, {
    cwd: ROOT,
    stdio: 'inherit',
  });
  const code = r.status ?? 1;
  if (code !== 0) {
    console.error('[rag-aide-smoke] pack/ingest failed');
    process.exit(code);
  }

  const failed = checkNeedles();
  if (failed) {
    console.error(`[rag-aide-smoke] FAIL ${failed}`);
    process.exit(1);
  }
  console.log(`[rag-aide-smoke] OK mode=${syncOnly ? 'sync-only' : 'ingest'}`);
  if (!syncOnly) {
    console.log(
      '[rag-aide-smoke] MCP目視推奨: query_documents「夕反省 明日やること 禁止」＋「完了済を GO待ち／次の1手／質問に出さない」',
    );
  }
}

main();
