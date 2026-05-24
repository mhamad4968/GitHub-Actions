#!/usr/bin/env node
/**
 * 着手前ゲート（CEO承認 D1/D2/D3/D4 是正・2026-05-22）
 * 1. チェックリスト表示  2. §50-3-8 証跡確認  3. --stamp でスタンプ
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  collect5038EvidenceFromLogs,
  governanceDir,
  read5038Stamp,
} from './lib/cio-four-ai-governance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CHECKLIST = `
【着手前ゲート — 必須順（違反＝作業停止）】
1. [§1-2-3 ティア判定] + 【適用憲法】 + [🎖️ 本セッション割当] + [ルール確認] を応答先頭に書く（毎ターン）
2. DeepSeek 1問（§50-3-8・盲点3点）→ CIO 突合3行をチャットに残す
3. customize/** or 80行超 → Composer Subagent（CIO本体は大量Diff禁止）
4. npm run cio:guard:5038 -- --stamp（または --skip "理由"）
5. PPTX/資料系も D2: 年次矛盾・学習負荷・人事説明の盲点1問
6. 報告・締め → npm run cio:report-verify-response -- --file <下書き> exit 0

正本: docs/runbooks/cio-four-ai-violation-remediation.md
`;

function logDeepseekEvidence(text) {
  const dir = governanceDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, '5038-deepseek-evidence.md');
  const body = `# §50-3-8 evidence\n\n${text}\n\n[§50-3-8] 実施済\n`;
  fs.writeFileSync(p, body, 'utf8');
  return p;
}

function main() {
  const args = process.argv.slice(2);
  console.log(CHECKLIST.trim());

  const evidence = collect5038EvidenceFromLogs(root);
  const stamp = read5038Stamp(root);
  if (evidence.length) {
    console.log(`\n[cio-pre-implement-gate] §50-3-8 evidence: ${evidence.join(', ')}`);
  } else {
    console.warn('\n[cio-pre-implement-gate] WARN: §50-3-8 evidence なし — DeepSeek→突合→stamp を先に');
  }
  if (stamp?.stampedAt) {
    console.log(`[cio-pre-implement-gate] stamp: ${stamp.stampedAt} mode=${stamp.mode}`);
  }

  const textIdx = args.indexOf('--deepseek-text');
  if (textIdx >= 0) {
    const text = args[textIdx + 1] || '';
    const p = logDeepseekEvidence(text);
    console.log(`[cio-pre-implement-gate] wrote ${path.relative(root, p)}`);
  }

  if (args.includes('--stamp')) {
    const r = spawnSync(
      process.execPath,
      ['scripts/cio-deepseek-5038-evidence-guard.mjs', '--stamp'],
      { cwd: root, stdio: 'inherit', env: process.env }
    );
    process.exit(r.status ?? 1);
  }

  if (args.includes('--strict') && evidence.length === 0) {
    console.error('[cio-pre-implement-gate] NG --strict: 証跡なし');
    process.exit(2);
  }

  process.exit(0);
}

main();
