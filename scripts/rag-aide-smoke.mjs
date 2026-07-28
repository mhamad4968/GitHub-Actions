#!/usr/bin/env node
/**
 * rag-aide-smoke.mjs — constitution-aide 試行の軽量スモーク（正本パス存在＋再 ingest 可否）。
 * MCP query は Cursor 側。ここではパック再生成と針のファイル存在を確認する。
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

function main() {
  const r = spawnSync(
    process.execPath,
    [path.join(__dirname, 'rag-ingest-constitution-aide-trial.mjs')],
    { cwd: ROOT, stdio: 'inherit' },
  );
  if ((r.status ?? 1) !== 0) {
    console.error('[rag-aide-smoke] ingest failed');
    process.exit(r.status ?? 1);
  }

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

  if (failed) {
    console.error(`[rag-aide-smoke] FAIL ${failed}`);
    process.exit(1);
  }
  console.log('[rag-aide-smoke] OK');
}

main();
