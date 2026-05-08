#!/usr/bin/env node
/**
 * afterAgentResponse — 報告意図が直前にあるとき、応答に機械可読チェックシートがあるか検証。
 * 欠落・V1 のみ・V2 矛盾のいずれかで stop フォロー用フラグを立てる（stdout は空 JSON）。
 *
 * @see every-turn-rules-confirm.mdc §1e（CEO 命令: 報告ターンは V2 厳格・矛盾は警告止まりにしない）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipelineStep, setOutcome } from './report-pipeline-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stateDir = path.join(root, '.cursor/hooks/state');
const pendingPath = path.join(stateDir, 'pending-report-checksheet.json');
const followPath = path.join(stateDir, 'checksheet-followup-needed.json');
const logDir = path.join(root, 'logs');
const violationLog = path.join(logDir, 'report-checksheet-violations.log');

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
    if (/^(軽微|簡単|small|minor|none|なし|無し)$/i.test(reason)) return true;
    return false;
  };
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
  if (ageMs > pendingTtlMs) {
    logViolation('PENDING_EXPIRED_TTL', `age_ms=${ageMs}`);
    setOutcome(correlationId, 'FAILED_TTL', { ageMs });
    try {
      fs.unlinkSync(pendingPath);
    } catch {
      /* noop */
    }
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
        process.stdout.write('{}\n');
        return;
      }
    }

    try {
      if (fs.existsSync(followPath)) fs.unlinkSync(followPath);
    } catch {
      /* noop */
    }
    setOutcome(correlationId, 'SUCCESS', {
      checksheet: true,
      version: evalRes.version,
      v2Warnings,
      v2Fields,
    });
    process.stdout.write('{}\n');
    return;
  }

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
  try {
    fs.unlinkSync(pendingPath);
  } catch {
    /* noop */
  }

  process.stdout.write('{}\n');
}

main();
