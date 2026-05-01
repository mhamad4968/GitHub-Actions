#!/usr/bin/env node
/**
 * smoke-test.mjs — 全 audit / verify / health を 1 発で走らせ結果集約 (J-4 / 2026-04-25)
 *
 * 目的:
 *   開発開始時 / 大きな変更後 / リリース前に「全て緑か？」を 1 コマンドで確認。
 *   既存の verify:all は 4 audit のみで health-check / guard:check を含まない。
 *   smoke-test は guard / audit / verify / health を一気通貫で実行。
 *
 * 走らせる検査 (直列 / §51 並列禁止 遵守):
 *   1. guard:check        — wipe-guard.mjs (21 ファイル健在性)
 *   2. audit:rules        — audit-rules.mjs
 *   3. audit:tsb          — audit-tsb-confirmed.mjs (TSB root_cause_confirmed 監視)
 *   4. verify:breaking    — verify-breaking-deletions.mjs --since=50 (TSB-016 系防御)
 *   5. audit:xref         — audit-cross-references.mjs (AGENTS ↔ RULES-INDEX drift)
 *   6. health-check       — scripts/health-check.mjs (S1-S16 統合)
 *   7. rule-watcher       — rule-watcher-status.mjs (S16 / K-3 稼働確認、未起動は warn)
 *   8. audit:parallel     — parallel-session-detector.mjs (§51-4 4 軸スコア)
 *   9. verify:constitution-handoff — verify-constitution-handoff.mjs (TSB-024 物理ガード)
 *  10. verify:mandatory-read-gate — mandatory-read-gate.mjs（必読ファイル構造）
 *
 * 出力: markdown サマリ + 各検査の status (ok / warn / ng / skip)
 *
 * 終了コード:
 *   0 = 全 ok (または info/skip のみ)
 *   1 = 1 件以上 warn (継続可だが要注意)
 *   2 = 1 件以上 ng (要対応)
 *
 * オプション:
 *   --json     JSON 出力
 *   --quiet    各検査の stdout を抑制 (サマリのみ)
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');

const ARG_JSON = process.argv.includes('--json');
const ARG_QUIET = process.argv.includes('--quiet');

const checks = [
  { id: 'guard:check', cmd: 'node', args: ['scripts/wipe-guard.mjs'], label: 'wipe-guard (21 ファイル健在)' },
  { id: 'audit:rules', cmd: 'node', args: ['scripts/audit-rules.mjs'], label: 'AGENTS.md ルール参照整合' },
  { id: 'audit:tsb', cmd: 'node', args: ['scripts/audit-tsb-confirmed.mjs'], label: 'TSB root_cause_confirmed カバレッジ' },
  { id: 'verify:breaking', cmd: 'node', args: ['scripts/verify-breaking-deletions.mjs', '--since=50'], label: 'BREAKING 削除 復活検知 (TSB-016 防御)' },
  { id: 'audit:xref', cmd: 'node', args: ['scripts/audit-cross-references.mjs'], label: 'AGENTS.md ↔ RULES-INDEX.md drift' },
  { id: 'health-check', cmd: 'node', args: ['scripts/health-check.mjs'], label: 'S1-S16 統合健康診断' },
  { id: 'rule-watcher', cmd: 'node', args: ['scripts/rule-watcher-status.mjs'], label: '憲法ファイル watcher 稼働 (K-3 / S16)' },
  { id: 'audit:parallel', cmd: 'node', args: ['scripts/parallel-session-detector.mjs'], label: '§51-4 並列セッション疑い 4 軸機械判定 (P4)' },
  { id: 'verify:constitution-handoff', cmd: 'node', args: ['scripts/verify-constitution-handoff.mjs'], label: '憲法級ハンドオフ物理ガード (TSB-024 / 第9検査)' },
  { id: 'verify:mandatory-read-gate', cmd: 'node', args: ['scripts/mandatory-read-gate.mjs'], label: '必読ファイル構造ゲート (mandatory-read-gate / 第10検査)' },
];

const results = [];
let nowIso = new Date().toISOString();
let started = Date.now();

for (const c of checks) {
  const t0 = Date.now();
  // health-check は MCP initialize 列挙で 60s を超えうる（実測 ~75s）
  const timeoutMs = c.id === 'health-check' ? 120_000 : 60_000;
  const res = spawnSync(c.cmd, c.args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: timeoutMs,
  });
  const elapsed = Date.now() - t0;

  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  const exitCode = res.status;

  let status = 'ok';
  let note = '';

  // exit code ベース判定
  if (exitCode === null) {
    status = 'ng';
    note = `signal=${res.signal} / timeout?`;
  } else if (c.id === 'rule-watcher' && exitCode === 2) {
    status = 'warn';
    note = 'file-watcher 未稼働 (npm run watcher:start 推奨)';
  } else if (c.id === 'audit:parallel' && exitCode === 1) {
    status = 'warn';
    note = '§51-4 注意レベル (3-4 点) — 朝報 §5-5 で内訳確認を';
  } else if (c.id === 'audit:parallel' && exitCode === 2) {
    status = 'ng';
    note = '§51-4 警報以上 (5+ 点) — 即座に作業中断 + 浜田 GO 待ち';
  } else if (exitCode !== 0) {
    status = 'ng';
    note = `exit=${exitCode}`;
  }

  // stdout マーカー検知 (各 audit が "warn" / "ng" を含む場合)
  if (status === 'ok') {
    const text = stdout + '\n' + stderr;
    if (/\b(❌|FAIL|fatal|ng:|status: ng)/i.test(text)) {
      status = 'ng';
      note = 'output に異常マーカー';
    } else if (/⚠️|warn:|status: warn|warning/i.test(text)) {
      // health-check の "警告 0" 系は誤検知なので、明示的 warn のみ
      if (/警告\s*[1-9]/.test(text) || /異常\s*[1-9]/.test(text)) {
        status = 'ng';
        note = '健康診断で警告/異常 検知';
      }
    }
  }

  // 出力先頭 / 末尾の要約抜粋
  const summaryLines = stdout
    .split('\n')
    .filter((l) => /(✅|⚠️|❌|総合:|root_cause_confirmed|drift|BREAKING|健全|score)/i.test(l))
    .slice(0, 3)
    .map((l) => l.trim());

  results.push({
    id: c.id,
    label: c.label,
    status,
    note,
    elapsed_ms: elapsed,
    exit: exitCode,
    summary: summaryLines,
    stdout: ARG_QUIET ? '' : stdout,
    stderr: ARG_QUIET ? '' : stderr,
  });

  if (!ARG_JSON && !ARG_QUIET) {
    const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
    console.log(`[smoke] ${icon} ${c.id.padEnd(18)} ${elapsed.toString().padStart(5)}ms ${note ? '— ' + note : ''}`);
  }
}

const totalMs = Date.now() - started;
const okCount = results.filter((r) => r.status === 'ok').length;
const warnCount = results.filter((r) => r.status === 'warn').length;
const ngCount = results.filter((r) => r.status === 'ng').length;

const overall = ngCount > 0 ? 'ng' : warnCount > 0 ? 'warn' : 'ok';
const exitCode = ngCount > 0 ? 2 : warnCount > 0 ? 1 : 0;

if (ARG_JSON) {
  console.log(JSON.stringify({
    generated_at: nowIso,
    overall,
    total_ms: totalMs,
    counts: { ok: okCount, warn: warnCount, ng: ngCount, total: results.length },
    results: results.map((r) => ({
      id: r.id,
      label: r.label,
      status: r.status,
      note: r.note,
      elapsed_ms: r.elapsed_ms,
      exit: r.exit,
      summary: r.summary,
    })),
  }, null, 2));
} else {
  console.log('');
  console.log('============================================================');
  console.log(`  smoke-test 集計 ${overall === 'ok' ? '✅' : overall === 'warn' ? '⚠️' : '❌'}  (${totalMs}ms / ${results.length} 検査)`);
  console.log('============================================================');
  console.log(`  ok: ${okCount} / warn: ${warnCount} / ng: ${ngCount}`);
  console.log('');
  if (ngCount > 0 || warnCount > 0) {
    console.log('### 要対応 / 注意');
    for (const r of results) {
      if (r.status === 'ok') continue;
      console.log(`- ${r.status === 'ng' ? '❌' : '⚠️'} ${r.id} — ${r.note}`);
      if (r.summary.length > 0) {
        for (const s of r.summary) console.log(`    ${s}`);
      }
    }
    console.log('');
  }
  console.log(`overall=${overall} exit=${exitCode}`);
}

process.exit(exitCode);
