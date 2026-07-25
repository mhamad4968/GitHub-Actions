#!/usr/bin/env node
/**
 * CEO 最低基準・report-checksheet-validate（head-only / full）の自動判定スモーク。
 * CI / 手元で `npm run verify:ceo-report-hooks-e2e` を実行。
 *
 * 終了: 0=全ケース期待どおり / 2=不整合
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = path.join(root, '.cursor/hooks/state');
const pendingPath = path.join(stateDir, 'pending-report-checksheet.json');
const followPath = path.join(stateDir, 'checksheet-followup-needed.json');
const validateHook = path.join(root, '.cursor/hooks/report-checksheet-validate.mjs');
const ceoPath = path.join(root, 'chat-sessions', 'CEO-MINIMUM-ABSOLUTE-BASELINE.txt');

const head = `[§1-2-3 ティア判定: L2] e2e
【適用憲法】§1e
[🎖️ 本セッション割当] CIO=e2e | DeepSeek=未使用 | Kimi=未使用 | OpenRouter=未使用
[ルール確認] scripts/verify-ceo-report-hooks-e2e.mjs
`;

const v2 = `【セッション報告チェックシート】
CHECKSHEET_VERSION: 2
CHECKSHEET_OK: yes
SECOND_REVIEWER: none(reason=e2eスモークのみ・SPEC未変更)
SPEC_TOUCHED: no
DESTRUCTIVE_OPS: none
DRY_RUN_TO_APPLY_GAP: n/a
`;

const sectionA1 = `□ A1 ダブルチェック（誰と・結果）
着手前: （着手前ダブルチェック: 非該当 — e2eスモークのみ）
ダブルチェック要約: 無（純スモーク・SPEC_TOUCHED no に整合）
`;

function readCeoBlock() {
  return fs.readFileSync(ceoPath, 'utf8').replace(/^\uFEFF/, '').trim();
}

function clearFollow() {
  try {
    fs.unlinkSync(followPath);
  } catch {
    /* noop */
  }
}

function readFollowReason() {
  try {
    const j = JSON.parse(fs.readFileSync(followPath, 'utf8'));
    return j.reason ?? null;
  } catch {
    return null;
  }
}

function runValidate(mode, body, requireCeoBlock = false) {
  clearFollow();
  try {
    fs.unlinkSync(pendingPath);
  } catch {
    /* noop */
  }
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    pendingPath,
    JSON.stringify({
      ts: Date.now(),
      correlationId: `e2e-${mode}-${Date.now()}`,
      mode,
      requireCeoBlock,
    }),
    'utf8'
  );
  const r = spawnSync(process.execPath, [validateHook], {
    cwd: root,
    input: `${JSON.stringify({ text: body })}\n`,
    encoding: 'utf8',
  });
  const reason = readFollowReason();
  return { status: r.status, reason, stdout: (r.stdout || '').trim() };
}

function fail(msg) {
  console.error(`[verify-ceo-report-hooks-e2e] ❌ ${msg}`);
  process.exit(2);
}

function ok(msg) {
  console.log(`[verify-ceo-report-hooks-e2e] ✅ ${msg}`);
}

const ceo = readCeoBlock();

// 1) head-only: §1 のみ → 成功（CEO全文は不要）
const r1 = runValidate('head-only', `${head}\n本文のみ・CEOブロックなし。\n`);
if (r1.reason !== null) fail(`head-only: follow不要 実際=${JSON.stringify(r1.reason)}`);
ok('head-only: §1のみ → 成功');

// 2) head-only: §1 + CEO 全文 → 成功（follow 無し）
const r2 = runValidate('head-only', `${head}\n${ceo}\n`);
clearFollow();
if (readFollowReason() !== null) fail('head-only CEO 充足: follow が残っている');
ok('head-only: §1 + CEO 全文 → follow なし（成功）');

// 3) 締めfull: V2+§1 だが CEO の1行削除 → CEO_MINIMUM_BLOCK
const ceoBroken = ceo.split(/\r?\n/).filter((l) => !l.includes('1. 報告違反ゼロ')).join('\n');
const r3 = runValidate('full', `${head}\n${ceoBroken}\n${sectionA1}\n${v2}\n`, true);
if (r3.reason !== 'CEO_MINIMUM_BLOCK') {
  fail(`full CEO 1行欠: 期待 CEO_MINIMUM_BLOCK 実際=${JSON.stringify(r3.reason)}`);
}
ok('締めfull: CEO 1行欠け → follow.reason=CEO_MINIMUM_BLOCK');

// 3b) full: §1 + CEO + V2 だが □A1／要約なし → DOUBLE_CHECK_ATTRIBUTION
const r3b = runValidate('full', `${head}\n${ceo}\n${v2}\n`);
if (r3b.reason !== 'DOUBLE_CHECK_ATTRIBUTION') {
  fail(`full ダブルチェック欠: 期待 DOUBLE_CHECK_ATTRIBUTION 実際=${JSON.stringify(r3b.reason)}`);
}
ok('full: □A1／ダブルチェック要約なし → follow.reason=DOUBLE_CHECK_ATTRIBUTION');

// 4) 締めfull: §1 + CEO + §P A1 + V2 → 成功
const r4 = runValidate('full', `${head}\n${ceo}\n${sectionA1}\n${v2}\n`, true);
clearFollow();
if (readFollowReason() !== null) fail('full 正常: follow が残っている');
ok('締めfull: §1 + CEO + □A1+要約 + V2 → follow なし（成功）');

// 5) pending hook（stdin 経路）
const smoke = spawnSync(process.execPath, ['scripts/hook-smoke-report-pending.mjs', '本日の報告をします'], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env },
});
const out = smoke.stdout || '';
if (!out.includes('additional_context')) {
  fail(`hook-smoke: additional_context 欠落 stdout=${out.slice(0, 400)}`);
}
if (smoke.status !== 0) fail(`hook-smoke: exit ${smoke.status}`);

ok('hook-smoke:report-pending → additional_context 付与');

const clear = spawnSync('npm', ['run', 'hooks:gate-clear'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (clear.status !== 0) {
  console.warn(`[verify-ceo-report-hooks-e2e] warn hooks:gate-clear exit=${clear.status}`);
}

console.log(
  '[verify-ceo-report-hooks-e2e] 全ケース OK（通常は§1+V2+A1、締め・GOのみCEO全文を追加検査）'
);
process.exit(0);
