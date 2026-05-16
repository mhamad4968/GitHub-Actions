#!/usr/bin/env node
/**
 * beforeSubmitPrompt — ユーザ送信ごとに afterAgentResponse 用 pending を立てる（既定）。
 * - **報告意図** (`isReportIntentPrompt`): `mode: full` — 報告前自動判定（session-clock / report-pipeline）＋ V2 厳格（validate 側）。
 * - **その他の全ターン**: `mode: head-only` — **§1 先頭4行**に加え **`CEO-MINIMUM-ABSOLUTE-BASELINE.txt` 全文（非空行すべて）**を機械検証（V2・§P は不要）。CEO 最低基準は **全応答の条件**。
 *
 * 緊急で従来（報告意図ターンのみ pending）へ戻す: 環境変数 **`HOOKS_STRICT_HEAD_EVERY_TURN=0`**
 *
 * ユーザ送信はブロックしない（continue: true 固定）。
 *
 * **手元テスト（stdin）**: PowerShell の `echo '{...}' | node 本スクリプト` だけだと stdin が空扱いになり
 * `additional_context` が付かないことがある。**Cursor 本番 hooks は stdin 正常想定**。
 * 確実に試す: `npm run hook:smoke:report-pending` または Node の `spawnSync(..., { input: JSON.stringify({prompt})+'\\n' })`。
 *
 * @see every-turn-rules-confirm.mdc §1e
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  newCorrelationId,
  pipelineStep,
  readCurrent,
  setOutcome,
} from './report-pipeline-audit.mjs';
import {
  buildNgGateActivePendingPrefix,
  buildNgRecoverySuffix,
  setNgGate,
} from './ng-recovery-gate.mjs';
import { verifyCioDesktopPaths } from './cio-desktop-path-guard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stateDir = path.join(root, '.cursor/hooks/state');
const pendingPath = path.join(stateDir, 'pending-report-checksheet.json');
const logDir = path.join(root, 'logs');
const precheckLog = path.join(logDir, 'report-precheck.log');

/** Desktop 側の AI緊急用（浜田 PC 既定パス・checkpoint 正本と同旨） */
const DESKTOP_AI_EMERGENCY_WIN = 'C:\\Users\\mhamada202408224\\Desktop\\AI緊急用';

function logPrecheck(line) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(precheckLog, `[${new Date().toISOString()}] ${line}\n`, 'utf8');
  } catch {
    /* noop */
  }
}

/**
 * 報告送信直前の軽量自動判定（hooks 内・秒オーダー）。
 * @returns {{ ok: boolean, violations: string[] }}
 */
function runReportPrecheck() {
  const violations = [];
  if (process.env.SKIP_REPORT_PRECHECK === '1') {
    logPrecheck('SKIP_REPORT_PRECHECK=1 → スキップ');
    return { ok: true, violations: [], skipped: true };
  }

  const clk = spawnSync(process.execPath, ['scripts/session-clock.mjs', 'check'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000,
  });
  if (clk.status === 2) {
    violations.push('§51-6-2（session-clock: 4 時間超または時計異常）');
  }

  const desk = verifyCioDesktopPaths();
  if (!desk.ok) {
    violations.push(`CIO Desktop 正本: ${desk.missing.join(' | ')}`);
  }

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const pipe = spawnSync(npmCmd, ['run', 'report:pipeline-status'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 25000,
    env: { ...process.env },
  });
  const st = pipe.status;
  if (st === 1) {
    violations.push('report-pipeline: 直近 outcome が FAILED_*（`npm run report:pipeline-status` exit 1）');
  } else if (st === 2) {
    violations.push('report-pipeline: in_progress（前回の報告フォロー未完了・exit 2）');
  } else if (st !== 0 && st !== 4 && st !== null && st !== undefined) {
    violations.push(`report-pipeline: report:pipeline-status が異常終了 (exit ${st})`);
  }

  const ceo = spawnSync(process.execPath, ['scripts/verify-ceo-minimum-baseline.mjs'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 12_000,
    env: { ...process.env },
  });
  if (ceo.status !== 0 && ceo.status !== null) {
    violations.push(
      'CEO 最低基準ブロック（`chat-sessions/CEO-MINIMUM-ABSOLUTE-BASELINE.txt` と Desktop `＃重要確認事項.txt` の一致）不整合 — `npm run verify:ceo-minimum-baseline`'
    );
  }

  const ok = violations.length === 0;
  logPrecheck(ok ? `OK violations=0` : `NG ${violations.join(' | ')}`);
  return { ok, violations, skipped: false };
}

function buildPrecheckAdditionalContext(violations) {
  const checklist = '`docs/session-report-checklist.md`（§P を含む正本。**Read ツールで通読**し、抜けと自己矛盾を潰す）';
  const desktop = `\`${DESKTOP_AI_EMERGENCY_WIN.replace(/\\/g, '/')}\`（**配下の全ファイル**を **名前昇順**で Read。**.txt** / **.md** を含む。フォルダが無いときはチャットに **「AI緊急用フォルダ不在」** とパスを 1 行）`;
  const pack = '`chat-sessions/constitution-first-read-pack/00-ORDER.txt` に従い **細分化パックを順に** Read';
  return (
    '【報告前自動判定】**NG（不合格＝失敗）** — ' +
    violations.join('／') +
    '\n\n' +
    '**CEO 指示（省略禁止・「どちらか一方」不可）**: 次を **すべて** 実施するまで **報告を続けない**（同一メッセージの追記で逃げない）。完了後に **新規**「報告」意図メッセージからやり直す。\n' +
    '- (A) ' +
    checklist +
    ' — **必須**\n' +
    '- (B) ' +
    desktop +
    ' — **必須**\n' +
    '- (C) ' +
    pack +
    ' — **必須**\n' +
    buildNgRecoverySuffix() +
    '\n\n' +
    '完了したら `[ルール確認]` 行に **(A)(B)(C) それぞれ**で Read したパスを列挙する。'
  );
}

function isReportIntentPrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') return false;
  const p = prompt.trim();
  if (/CHECKSHEET|チェックシート|完了報告|日終わり|セッション終了|本日のまとめ|本日の成果|本日の報告/i.test(p)) return true;
  /** 運用で頻出する「報告」文脈（pending 未発火＝検証スキップの再発防止） */
  if (/報告未了|報告なし|報告ルール|セッション報告(?!チェックシート)/i.test(p)) return true;
  /** CEO 最低基準・Desktop 正本への言及は報告厳格モード（V2 強制・自動判定対象） */
  if (/最低基準|絶対条件|重要確認事項|＃重要確認|CEO.?最低|例外は[み見]とめない/i.test(p)) return true;
  /** 「報告違反」単体では「報告を」にマッチしないため明示（§1e hooks 未発火の再発防止） */
  if (/報告違反|§\s*1e|セッション報告チェックシート.*(欠|無)/i.test(p)) return true;
  if (/(§\s*1e|チェックシート).{0,40}(欠落|違反|ない|不足|出して|入れて)/i.test(p)) return true;
  if (/(欠落|違反|ない|不足).{0,40}(§\s*1e|チェックシート|セッション報告)/i.test(p)) return true;
  if (/(報告して|報告を|報告に|報告で|報告の|報告:|報告：|完了報告|中間報告)/.test(p)) return true;
  if (/中間報告|締めくくり|成果.*反省|状況.*まとめ/i.test(p)) return true;
  if (/まとめ/.test(p) && /(セッション|本日|今日)/.test(p)) return true;
  return false;
}

function writePendingFile(prompt, mode) {
  const prev = readCurrent();
  if (prev && prev.correlationId && prev.outcome === 'in_progress') {
    setOutcome(prev.correlationId, 'SUPERSEDED', {
      reason: mode === 'full' ? 'new_user_report_intent_pending' : 'new_user_turn_pending_head_only',
    });
  }
  const correlationId = newCorrelationId();
  const ts = Date.now();
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    pendingPath,
    JSON.stringify(
      {
        ts,
        correlationId,
        mode,
        promptPreview: String(prompt).slice(0, 400),
      },
      null,
      2
    ),
    'utf8'
  );
  pipelineStep(correlationId, 'PENDING_SET', {
    promptPreview: String(prompt).slice(0, 200),
    mode,
  });
}

function main() {
  let input = {};
  try {
    const raw = (fs.readFileSync(0, 'utf8') || '').replace(/^\uFEFF/, '');
    input = JSON.parse(raw || '{}');
  } catch {
    input = {};
  }

  const prompt = input.prompt ?? '';
  const out = { continue: true };
  const gatePrefix = buildNgGateActivePendingPrefix();

  const strictEveryTurn = process.env.HOOKS_STRICT_HEAD_EVERY_TURN !== '0';
  const report = isReportIntentPrompt(prompt);

  if (!report && !strictEveryTurn) {
    if (gatePrefix) out.additional_context = gatePrefix;
    process.stdout.write(`${JSON.stringify(out)}\n`);
    return;
  }

  if (!report && strictEveryTurn) {
    try {
      writePendingFile(prompt, 'head-only');
    } catch {
      /* noop */
    }
    if (gatePrefix) out.additional_context = gatePrefix;
    process.stdout.write(`${JSON.stringify(out)}\n`);
    return;
  }

  const pre = runReportPrecheck();
  try {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(
      path.join(stateDir, 'report-precheck-last.json'),
      JSON.stringify(
        { ts: Date.now(), ok: pre.ok, violations: pre.violations, skipped: pre.skipped ?? false },
        null,
        2
      ),
      'utf8'
    );
  } catch {
    /* noop */
  }
  if (!pre.ok) {
    setNgGate('PRECHECK_NG', { violations: pre.violations });
    out.additional_context = (gatePrefix || '') + buildPrecheckAdditionalContext(pre.violations);
  } else if (!pre.skipped) {
    out.additional_context =
      (gatePrefix || '') +
      '【報告前自動判定】**OK** — `session-clock.mjs check` および `npm run report:pipeline-status` は通過。続けて §1e（§P・§M-2）に従って報告を出力してください。';
  } else if (gatePrefix) {
    out.additional_context = gatePrefix;
  }

  try {
    writePendingFile(prompt, 'full');
  } catch {
    /* noop */
  }

  process.stdout.write(`${JSON.stringify(out)}\n`);
}

main();
