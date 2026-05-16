#!/usr/bin/env node
/**
 * afterAgentResponse — `pending-report-checksheet.json` があるとき検証する。
 * - `mode: head-only`（全ターン既定）: **§1 先頭4行**＋**`CEO-MINIMUM-ABSOLUTE-BASELINE.txt` 全文（非空行すべて）**（先頭ウィンドウ＋全文）。V2・§P 本文は不要。
 * - `mode: full`（報告意図）: V2 七行・矛盾・§1 四行・**CEO 最低基準全文**に加え **§P □A1＋ダブルチェック（誰と・結果）＋`ダブルチェック要約:`（誰が／無の明示）**を必須。
 * 欠落時は stop フォロー用フラグを立てる（stdout は空 JSON）。
 * 各判定を logs/report-turn-head-audit.log に 1 行 JSON で追記（git 対象外）。
 *
 * @see every-turn-rules-confirm.mdc §1e（CEO 命令: 報告ターンは V2 厳格・矛盾は警告止まりにしない）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipelineStep, setOutcome } from './report-pipeline-audit.mjs';
import { clearNgGate, setNgGate } from './ng-recovery-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stateDir = path.join(root, '.cursor/hooks/state');
const pendingPath = path.join(stateDir, 'pending-report-checksheet.json');
const followPath = path.join(stateDir, 'checksheet-followup-needed.json');
const logDir = path.join(root, 'logs');
const violationLog = path.join(logDir, 'report-checksheet-violations.log');
/** §1 四行厳格判定の監査ログ（1 行 1 JSON・git 対象外の logs/） */
const turnHeadAuditLog = path.join(logDir, 'report-turn-head-audit.log');

/** 応答先頭付近のみを対象（本文途中の偶然一致を避ける） */
const TURN_HEAD_WINDOW = 6500;

/**
 * every-turn-rules-confirm.mdc §1 — ティア・【適用憲法】・[🎖️ 本セッション割当]・[ルール確認]
 * @returns {{ ok: boolean, missing: string[] }}
 */
/**
 * 報告ターン（V2）: `CEO-MINIMUM-ABSOLUTE-BASELINE.txt` の **非空行すべて**が応答に含まれること（一行も欠けない）。
 * @see chat-sessions/CEO-MINIMUM-ABSOLUTE-BASELINE.txt
 */
function detectCeoMinimumBlock(text) {
  const t = String(text || '');
  const p = path.join(root, 'chat-sessions', 'CEO-MINIMUM-ABSOLUTE-BASELINE.txt');
  if (!fs.existsSync(p)) {
    return /最低基準[（(]/.test(t) && /例外は[み見]とめない|例外は見落とさない/.test(t);
  }
  const raw = (fs.readFileSync(p, 'utf8') || '').replace(/^\uFEFF/, '');
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  for (const line of lines) {
    if (!t.includes(line)) return false;
  }
  return true;
}

/**
 * 報告ターン（V2）: §P **□A1**・**ダブルチェック（誰と・結果）**・**`ダブルチェック要約:`** に **誰が**第2者相当の確認をしたか（または **無／非該当／スキップ**の明示）が書かれていること。
 * @see docs/session-report-checklist.md §P A1
 */
function detectDoubleCheckAttribution(text) {
  const t = String(text || '');
  if (!/□\s*A1\b/i.test(t)) return false;
  if (!/ダブルチェック\s*[（(]\s*誰/i.test(t)) return false;
  const m = t.match(/ダブルチェック要約\s*:\s*([^\n\r]+)/i);
  if (!m) return false;
  const summary = (m[1] || '').trim();
  if (summary.length < 6) return false;
  if (
    !/(DeepSeek|Kimi|OpenRouter|両名|第2者|無\s*[（(]|非該当|スキップ理由|§50-3-8|着手前ダブルチェック|検証締めダブルチェック)/i.test(
      summary
    )
  ) {
    return false;
  }
  return true;
}

function detectStrictTurnHead(text) {
  const head = String(text || '').slice(0, TURN_HEAD_WINDOW);
  const missing = [];
  if (!/\[\s*§1-2-3\s*ティア判定\s*:/.test(head)) {
    missing.push('TIER_LINE');
  }
  if (!/【\s*適用憲法\s*】/.test(head)) {
    missing.push('CONSTITUTION_LINE');
  }
  const hasAssignBracket = /\[\s*\u{1F396}\uFE0F?\s*本セッション割当\s*\]/u.test(head);
  if (!hasAssignBracket) {
    missing.push('ASSIGN_LINE');
  }
  if (!/\[ルール確認\]/.test(head)) {
    missing.push('RULES_CONFIRM_LINE');
  }
  return { ok: missing.length === 0, missing };
}

function appendTurnHeadAudit(payload) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const rec = {
      iso: new Date().toISOString(),
      ...payload,
    };
    fs.appendFileSync(turnHeadAuditLog, `${JSON.stringify(rec)}\n`, 'utf8');
  } catch {
    /* noop */
  }
}

/**
 * V1（最小 3 行）または V2（7 行）を受理。`CHECKSHEET_VERSION` と `CHECKSHEET_OK: yes` が揃えば「有効」。
 * @returns {{ valid: boolean, version: 1|2|null }}
 */
function evalChecksheet(text) {
  if (!text || typeof text !== 'string') return { valid: false, version: null };
  const v2 =
    /【セッション報告チェックシート】[\s\S]*?CHECKSHEET_VERSION:\s*2[\s\S]*?CHECKSHEET_OK:\s*yes/i;
  if (v2.test(text)) return { valid: true, version: 2 };
  const v1 =
    /【セッション報告チェックシート】[\s\S]*?CHECKSHEET_VERSION:\s*1[\s\S]*?CHECKSHEET_OK:\s*yes/i;
  if (v1.test(text)) return { valid: true, version: 1 };
  return { valid: false, version: null };
}

/** V2 4 新フィールドを抽出（無ければ null） */
function parseV2Fields(text) {
  const out = {};
  const grab = (key) => {
    const re = new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, 'mi');
    const m = text.match(re);
    return m ? m[1].trim() : null;
  };
  out.secondReviewer = grab('SECOND_REVIEWER');
  out.specTouched = grab('SPEC_TOUCHED');
  out.destructiveOps = grab('DESTRUCTIVE_OPS');
  out.dryRunGap = grab('DRY_RUN_TO_APPLY_GAP');
  return out;
}

/**
 * V2 矛盾検出（厳格モード: 1 件でもあれば stop フォロー＋パイプライン FAILED）。
 * @returns {string[]} 検出した警告コード（空なら問題なし）
 */
function detectV2Warnings(f) {
  const warns = [];
  if (!f) return warns;
  const noneReason = (v) => {
    if (!v) return false;
    const m = v.match(/^none\s*\(\s*reason\s*=\s*([^)]*)\s*\)/i);
    if (!m) return false;
    const reason = (m[1] || '').trim();
    if (!reason) return true;
    if (
      /^(軽微|簡単|small|minor|none|なし|無し|trivial|同上|同様|同上記|TBD|TODO|未定|該当なし|n\/a|na)$/i.test(
        reason
      )
    ) {
      return true;
    }
    if (reason.length < 4) return true;
    return false;
  };
  if (/^yes$/i.test(f.specTouched || '')) {
    const s = (f.secondReviewer || '').trim();
    if (s && !/^none\b/i.test(s) && !/^(deepseek|kimi|openrouter)$/i.test(s)) {
      warns.push('SPEC_YES_SECOND_REVIEWER_VALUE_INVALID');
    }
  }
  if (
    /^yes$/i.test(f.specTouched || '') &&
    f.secondReviewer &&
    /^none\b/i.test(f.secondReviewer)
  ) {
    if (noneReason(f.secondReviewer)) {
      warns.push('SPEC_TOUCHED_NO_SECOND_REVIEWER');
    } else {
      warns.push('SPEC_TOUCHED_WITH_REVIEWER_SKIP');
    }
  }
  if (/^no$/i.test(f.specTouched || '') && f.secondReviewer && /^none\b/i.test(f.secondReviewer)) {
    if (noneReason(f.secondReviewer)) {
      warns.push('SPEC_NOT_TOUCHED_TRIVIAL_NONE_REASON');
    }
  }
  if (
    f.destructiveOps &&
    !/^none\b/i.test(f.destructiveOps) &&
    /^same-turn$/i.test(f.dryRunGap || '')
  ) {
    warns.push('DESTRUCTIVE_DRYRUN_SAME_TURN');
  }
  for (const k of ['secondReviewer', 'specTouched', 'destructiveOps', 'dryRunGap']) {
    if (!f[k]) warns.push(`MISSING_FIELD_${k}`);
  }
  return warns;
}

function logViolation(reason, preview) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const line = `[${new Date().toISOString()}] ${reason} text_preview=${JSON.stringify(preview)}\n`;
    fs.appendFileSync(violationLog, line, 'utf8');
  } catch {
    /* noop */
  }
}

function main() {
  let input = {};
  try {
    const raw = (fs.readFileSync(0, 'utf8') || '').replace(/^\uFEFF/, '');
    input = JSON.parse(raw || '{}');
  } catch {
    input = {};
  }

  const text = input.text ?? '';

  if (!fs.existsSync(pendingPath)) {
    process.stdout.write('{}\n');
    return;
  }

  let pending;
  try {
    pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
  } catch {
    try {
      fs.unlinkSync(pendingPath);
    } catch {
      /* noop */
    }
    process.stdout.write('{}\n');
    return;
  }

  const correlationId =
    typeof pending.correlationId === 'string' && pending.correlationId
      ? pending.correlationId
      : `legacy-${pending.ts ?? Date.now()}`;

  /** 長時間タスクでも pending が生きるよう 8 時間。TTL 切れは監査ログに残す（黙って消さない） */
  const pendingTtlMs = 8 * 60 * 60 * 1000;
  const ageMs = Date.now() - (pending.ts ?? 0);
  const turnHead = detectStrictTurnHead(text);

  if (ageMs > pendingTtlMs) {
    appendTurnHeadAudit({
      correlationId,
      event: 'PENDING_TTL',
      turnHead,
      ageMs,
    });
    logViolation('PENDING_EXPIRED_TTL', `age_ms=${ageMs}`);
    setOutcome(correlationId, 'FAILED_TTL', { ageMs });
    setNgGate('FAILED_TTL', { ageMs });
    try {
      fs.unlinkSync(pendingPath);
    } catch {
      /* noop */
    }
    process.stdout.write('{}\n');
    return;
  }

  const mode = pending.mode === 'head-only' ? 'head-only' : 'full';

  if (mode === 'head-only') {
    if (!turnHead.ok) {
      appendTurnHeadAudit({
        correlationId,
        event: 'FAILED_STRICT_TURN_HEAD_HEAD_ONLY',
        turnHead,
        responseChars: text.length,
      });
      for (const m of turnHead.missing) {
        logViolation(`STRICT_TURN_HEAD_HEAD_ONLY_${m}`, text.slice(0, 900));
      }
      pipelineStep(correlationId, 'TURN_HEAD_STRICT_FAIL_HEAD_ONLY', {
        missing: turnHead.missing,
      });
      try {
        fs.writeFileSync(
          followPath,
          JSON.stringify(
            {
              ts: Date.now(),
              reason: 'TURN_HEAD_ONLY',
              correlationId,
              missing: turnHead.missing,
            },
            null,
            2
          ),
          'utf8'
        );
      } catch {
        /* noop */
      }
      setOutcome(correlationId, 'FAILED_STRICT_TURN_HEAD', {
        missing: turnHead.missing,
        mode: 'head-only',
      });
      setNgGate('TURN_HEAD_ONLY', { missing: turnHead.missing });
      process.stdout.write('{}\n');
      return;
    }
    if (!detectCeoMinimumBlock(text)) {
      appendTurnHeadAudit({
        correlationId,
        event: 'FAILED_CEO_MINIMUM_BLOCK_HEAD_ONLY',
        turnHead,
        responseChars: text.length,
      });
      logViolation('CEO_MINIMUM_BLOCK_HEAD_ONLY', text.slice(0, 1200));
      pipelineStep(correlationId, 'CEO_MINIMUM_BLOCK_HEAD_ONLY', {});
      try {
        fs.writeFileSync(
          followPath,
          JSON.stringify(
            { ts: Date.now(), reason: 'CEO_MINIMUM_BLOCK', correlationId },
            null,
            2
          ),
          'utf8'
        );
      } catch {
        /* noop */
      }
      setOutcome(correlationId, 'FAILED_CEO_MINIMUM_BLOCK', {
        checksheet: false,
        strictTurnHead: true,
        mode: 'head-only',
      });
      setNgGate('CEO_MINIMUM_BLOCK');
      try {
        fs.unlinkSync(pendingPath);
      } catch {
        /* noop */
      }
      process.stdout.write('{}\n');
      return;
    }
    try {
      fs.unlinkSync(pendingPath);
    } catch {
      /* noop */
    }
    appendTurnHeadAudit({
      correlationId,
      event: 'SUCCESS_HEAD_ONLY',
      turnHead,
      responseChars: text.length,
    });
    setOutcome(correlationId, 'SUCCESS', {
      checksheet: false,
      strictTurnHead: true,
      mode: 'head-only',
    });
    clearNgGate();
    process.stdout.write('{}\n');
    return;
  }

  const evalRes = evalChecksheet(text);
  if (evalRes.valid) {
    try {
      fs.unlinkSync(pendingPath);
    } catch {
      /* noop */
    }

    /** CEO 命令（2026-05-08）: 報告ターンは V2 七行を正とし、矛盾は警告止まりにしない */
    if (evalRes.version === 1) {
      appendTurnHeadAudit({
        correlationId,
        event: 'FAILED_STRICT_V1',
        turnHead,
        responseChars: text.length,
      });
      logViolation('V1_DISALLOWED_STRICT_MODE', text.slice(0, 800));
      pipelineStep(correlationId, 'V1_REJECTED_REQUIRE_V2', {
        responseChars: text.length,
      });
      try {
        fs.writeFileSync(
          followPath,
          JSON.stringify(
            { ts: Date.now(), reason: 'V1_REQUIRE_V2', correlationId },
            null,
            2
          ),
          'utf8'
        );
      } catch {
        /* noop */
      }
      setOutcome(correlationId, 'FAILED_STRICT_V1', { checksheet: true, version: 1 });
      setNgGate('V1_REQUIRE_V2');
      process.stdout.write('{}\n');
      return;
    }

    let v2Warnings = [];
    let v2Fields = null;
    if (evalRes.version === 2) {
      v2Fields = parseV2Fields(text);
      v2Warnings = detectV2Warnings(v2Fields);
      for (const w of v2Warnings) {
        logViolation(`V2_${w}`, JSON.stringify(v2Fields));
      }
      if (v2Warnings.length > 0) {
        appendTurnHeadAudit({
          correlationId,
          event: 'FAILED_V2_CONSTRAINTS',
          turnHead,
          warnings: v2Warnings,
          v2Fields,
        });
        pipelineStep(correlationId, 'V2_CHECKSHEET_HARD_FAIL', {
          warnings: v2Warnings,
          fields: v2Fields,
        });
        try {
          fs.writeFileSync(
            followPath,
            JSON.stringify(
              {
                ts: Date.now(),
                reason: 'V2_VIOLATION',
                correlationId,
                warnings: v2Warnings,
              },
              null,
              2
            ),
            'utf8'
          );
        } catch {
          /* noop */
        }
        setOutcome(correlationId, 'FAILED_V2_CONSTRAINTS', {
          checksheet: true,
          version: 2,
          warnings: v2Warnings,
          fields: v2Fields,
        });
        setNgGate('V2_VIOLATION', { warnings: v2Warnings });
        process.stdout.write('{}\n');
        return;
      }
    }

    if (evalRes.version === 2) {
      if (!detectCeoMinimumBlock(text)) {
        appendTurnHeadAudit({
          correlationId,
          event: 'FAILED_CEO_MINIMUM_BLOCK',
          turnHead,
          v2Fields,
        });
        logViolation('CEO_MINIMUM_BLOCK_MISSING', text.slice(0, 1200));
        pipelineStep(correlationId, 'CEO_MINIMUM_BLOCK_MISSING', {});
        try {
          fs.writeFileSync(
            followPath,
            JSON.stringify(
              { ts: Date.now(), reason: 'CEO_MINIMUM_BLOCK', correlationId },
              null,
              2
            ),
            'utf8'
          );
        } catch {
          /* noop */
        }
        setOutcome(correlationId, 'FAILED_CEO_MINIMUM_BLOCK', {
          checksheet: true,
          version: 2,
        });
        setNgGate('CEO_MINIMUM_BLOCK');
        process.stdout.write('{}\n');
        return;
      }
    }

    if (evalRes.version === 2) {
      if (!detectDoubleCheckAttribution(text)) {
        appendTurnHeadAudit({
          correlationId,
          event: 'FAILED_DOUBLE_CHECK_ATTRIBUTION',
          turnHead,
          v2Fields,
        });
        logViolation('DOUBLE_CHECK_ATTRIBUTION_MISSING', text.slice(0, 1400));
        pipelineStep(correlationId, 'DOUBLE_CHECK_ATTRIBUTION_MISSING', {});
        try {
          fs.writeFileSync(
            followPath,
            JSON.stringify(
              { ts: Date.now(), reason: 'DOUBLE_CHECK_ATTRIBUTION', correlationId },
              null,
              2
            ),
            'utf8'
          );
        } catch {
          /* noop */
        }
        setOutcome(correlationId, 'FAILED_DOUBLE_CHECK_ATTRIBUTION', {
          checksheet: true,
          version: 2,
        });
        setNgGate('DOUBLE_CHECK_ATTRIBUTION');
        try {
          fs.unlinkSync(pendingPath);
        } catch {
          /* noop */
        }
        process.stdout.write('{}\n');
        return;
      }
    }

    if (evalRes.version === 2) {
      if (!turnHead.ok) {
        appendTurnHeadAudit({
          correlationId,
          event: 'FAILED_STRICT_TURN_HEAD',
          turnHead,
          v2Fields,
        });
        for (const m of turnHead.missing) {
          logViolation(`STRICT_TURN_HEAD_${m}`, text.slice(0, 900));
        }
        pipelineStep(correlationId, 'TURN_HEAD_STRICT_FAIL', {
          missing: turnHead.missing,
        });
        try {
          fs.writeFileSync(
            followPath,
            JSON.stringify(
              {
                ts: Date.now(),
                reason: 'TURN_HEAD_VIOLATION',
                correlationId,
                missing: turnHead.missing,
              },
              null,
              2
            ),
            'utf8'
          );
        } catch {
          /* noop */
        }
        setOutcome(correlationId, 'FAILED_STRICT_TURN_HEAD', {
          missing: turnHead.missing,
        });
        setNgGate('TURN_HEAD_VIOLATION', { missing: turnHead.missing });
        process.stdout.write('{}\n');
        return;
      }
    }

    try {
      if (fs.existsSync(followPath)) fs.unlinkSync(followPath);
    } catch {
      /* noop */
    }
    appendTurnHeadAudit({
      correlationId,
      event: 'SUCCESS',
      turnHead,
      v2Fields,
      checksheetVersion: evalRes.version,
    });
    setOutcome(correlationId, 'SUCCESS', {
      checksheet: true,
      version: evalRes.version,
      v2Warnings,
      v2Fields,
      strictTurnHead: true,
    });
    clearNgGate();
    process.stdout.write('{}\n');
    return;
  }

  appendTurnHeadAudit({
    correlationId,
    event: 'MISSING_CHECKSHEET',
    turnHead,
    responseChars: text.length,
  });
  logViolation('MISSING_CHECKSHEET', text.slice(0, 800));
  pipelineStep(correlationId, 'AGENT_RESPONSE_MISSING_CHECKSHEET', {
    responseChars: text.length,
  });
  try {
    fs.writeFileSync(
      followPath,
      JSON.stringify(
        { ts: Date.now(), reason: 'MISSING_CHECKSHEET', correlationId },
        null,
        2
      ),
      'utf8'
    );
  } catch {
    /* noop */
  }
  setNgGate('MISSING_CHECKSHEET');
  try {
    fs.unlinkSync(pendingPath);
  } catch {
    /* noop */
  }

  process.stdout.write('{}\n');
}

main();
