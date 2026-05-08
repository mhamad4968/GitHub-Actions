#!/usr/bin/env node
/**
 * 報告ターン → チェックシート検証 → stop フォローまでの経路を追跡する監査（§1e）。
 * - 追記ログ: logs/report-pipeline-audit.log（1 行 1 JSON）
 * - 最新サマリ: .cursor/hooks/state/report-pipeline-current.json（outcome で自動判定）
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const logDir = path.join(root, 'logs');
const auditLogPath = path.join(logDir, 'report-pipeline-audit.log');
const stateDir = path.join(root, '.cursor/hooks/state');
const currentPath = path.join(stateDir, 'report-pipeline-current.json');

const MAX_STEPS = 48;

export function newCorrelationId() {
  return randomUUID();
}

export function readCurrent() {
  try {
    if (fs.existsSync(currentPath)) {
      return JSON.parse(fs.readFileSync(currentPath, 'utf8'));
    }
  } catch {
    /* noop */
  }
  return null;
}

function writeCurrent(cur) {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(currentPath, JSON.stringify(cur, null, 2), 'utf8');
}

function appendLog(rec) {
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(auditLogPath, `${JSON.stringify(rec)}\n`, 'utf8');
}

/**
 * 中間イベント（パイプライン進行）
 * @param {string} correlationId
 * @param {string} event
 * @param {Record<string, unknown>} [detail]
 */
export function pipelineStep(correlationId, event, detail = {}) {
  const ts = Date.now();
  const rec = {
    ts,
    iso: new Date(ts).toISOString(),
    correlationId,
    event,
    ...detail,
  };
  appendLog(rec);

  let cur = readCurrent();
  if (!cur || cur.correlationId !== correlationId) {
    cur = {
      correlationId,
      startedAt: ts,
      startedIso: rec.iso,
      steps: [],
      outcome: 'in_progress',
    };
  }
  cur.steps.push({ at: ts, event, ...detail });
  if (cur.steps.length > MAX_STEPS) {
    cur.steps = cur.steps.slice(-MAX_STEPS);
  }
  cur.lastEvent = event;
  cur.updatedAt = ts;
  cur.updatedIso = rec.iso;
  if (!cur.outcome || cur.outcome === 'in_progress') {
    cur.outcome = 'in_progress';
  }
  writeCurrent(cur);
}

/**
 * 終端 outcome（SUCCESS / FAILED_* / SUPERSEDED）
 */
export function setOutcome(correlationId, outcome, detail = {}) {
  const ts = Date.now();
  const iso = new Date(ts).toISOString();
  appendLog({
    ts,
    iso,
    correlationId,
    event: 'PIPELINE_OUTCOME',
    outcome,
    ...detail,
  });

  const cur = readCurrent();
  if (cur && cur.correlationId === correlationId) {
    cur.steps = cur.steps || [];
    cur.steps.push({ at: ts, event: 'PIPELINE_OUTCOME', outcome, ...detail });
    if (cur.steps.length > MAX_STEPS) {
      cur.steps = cur.steps.slice(-MAX_STEPS);
    }
    cur.outcome = outcome;
    cur.outcomeDetail = detail;
    cur.finishedAt = ts;
    cur.finishedIso = iso;
    cur.lastEvent = 'PIPELINE_OUTCOME';
    cur.updatedAt = ts;
    cur.updatedIso = iso;
    writeCurrent(cur);
  }
}
