#!/usr/bin/env node
/**
 * H9 formalization review — metrics 窓評価（2026-07-25）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function loadH9ReviewSpec(rootRef = root) {
  const p = path.join(rootRef, 'data/cio-formalization-h9-review.json');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function loadThresholds(rootRef, spec) {
  const rel = spec.thresholdsRef || 'data/cio-team-ops-kpi-thresholds.json';
  const p = path.join(rootRef, rel);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function appendMetricsDaily(rootRef, snapshot) {
  const spec = loadH9ReviewSpec(rootRef);
  if (!spec?.metricsHistory) return;
  const p = path.join(rootRef, spec.metricsHistory);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const line = JSON.stringify({ ...snapshot, recordedAt: snapshot.at || new Date().toISOString() });
  fs.appendFileSync(p, `${line}\n`, 'utf8');
}

export function readMetricsWindow(rootRef, spec, now = new Date()) {
  const p = path.join(rootRef, spec.metricsHistory);
  if (!fs.existsSync(p)) return [];
  const windowMs = (spec.metricsWindowDays || 7) * 86400000;
  const cutoff = now.getTime() - windowMs;
  const rows = [];
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      const t = Date.parse(row.recordedAt || row.at);
      if (!Number.isNaN(t) && t >= cutoff) rows.push(row);
    } catch {
      /* skip bad line */
    }
  }
  return rows;
}

function dayKey(iso) {
  return String(iso).slice(0, 10);
}

export function isSampleRed(sample, th) {
  if (Array.isArray(sample.reds) && sample.reds.length) return true;
  const red = th.red || {};
  if ((sample.skip5038Rate ?? 0) > (red.skip5038RateCustomizePct ?? 100)) return true;
  if ((sample.liteUsageRate ?? 0) > (red.liteUsageRatePct ?? 100)) return true;
  if ((sample.reportVerifyFailures ?? 0) >= (red.reportVerifyFailuresPerWeek ?? 999)) return true;
  return false;
}

export function evaluateH9Review(rootRef = root, now = new Date()) {
  const spec = loadH9ReviewSpec(rootRef);
  if (!spec) return { ok: false, error: 'missing spec' };

  const reviewAt = Date.parse(`${spec.reviewDate}T00:00:00+09:00`);
  const th = loadThresholds(rootRef, spec);
  const samples = readMetricsWindow(rootRef, spec, now);

  if (now.getTime() < reviewAt) {
    const daysUntil = Math.ceil((reviewAt - now.getTime()) / 86400000);
    return {
      ok: true,
      phase: 'scheduled',
      reviewDate: spec.reviewDate,
      daysUntil,
      sampleCount: samples.length,
      status: spec.status,
    };
  }

  const redDays = new Set();
  for (const s of samples) {
    if (isSampleRed(s, th)) redDays.add(dayKey(s.recordedAt || s.at));
  }
  const redMetricDays = redDays.size;
  const maxRed = spec.criteria?.green?.maxRedMetricDays ?? 0;
  const minRed = spec.criteria?.red?.minRedMetricDays ?? 2;

  let advisory = 'UNDECIDED';
  if (samples.length === 0) advisory = 'INSUFFICIENT_DATA';
  else if (redMetricDays <= maxRed) advisory = 'GREEN';
  else if (redMetricDays >= minRed) advisory = 'RED';

  return {
    ok: true,
    phase: 'due',
    reviewDate: spec.reviewDate,
    sampleCount: samples.length,
    redMetricDays,
    advisory,
    ceoDecision: spec.ceoDecision,
    status: spec.status,
  };
}
