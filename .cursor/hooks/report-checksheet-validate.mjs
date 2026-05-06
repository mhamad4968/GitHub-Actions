#!/usr/bin/env node
/**
 * afterAgentResponse — 報告意図が直前にあるとき、応答に機械可読チェックシートがあるか検証。
 * 欠落時は stop フック用フラグを立てる（stdout は空 JSON。afterAgentResponse は出力未使用想定）。
 *
 * @see every-turn-rules-confirm.mdc §1e
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stateDir = path.join(root, '.cursor/hooks/state');
const pendingPath = path.join(stateDir, 'pending-report-checksheet.json');
const followPath = path.join(stateDir, 'checksheet-followup-needed.json');
const logDir = path.join(root, 'logs');
const violationLog = path.join(logDir, 'report-checksheet-violations.log');

function hasValidChecksheet(text) {
  if (!text || typeof text !== 'string') return false;
  const re =
    /【セッション報告チェックシート】[\s\S]*?CHECKSHEET_VERSION:\s*1[\s\S]*?CHECKSHEET_OK:\s*yes/i;
  return re.test(text);
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
    const raw = fs.readFileSync(0, 'utf8');
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

  const ageMs = Date.now() - (pending.ts ?? 0);
  if (ageMs > 20 * 60 * 1000) {
    try {
      fs.unlinkSync(pendingPath);
    } catch {
      /* noop */
    }
    process.stdout.write('{}\n');
    return;
  }

  if (hasValidChecksheet(text)) {
    try {
      fs.unlinkSync(pendingPath);
    } catch {
      /* noop */
    }
    try {
      if (fs.existsSync(followPath)) fs.unlinkSync(followPath);
    } catch {
      /* noop */
    }
    process.stdout.write('{}\n');
    return;
  }

  logViolation('MISSING_CHECKSHEET', text.slice(0, 800));
  try {
    fs.writeFileSync(
      followPath,
      JSON.stringify({ ts: Date.now(), reason: 'MISSING_CHECKSHEET' }, null, 2),
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
