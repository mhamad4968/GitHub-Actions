#!/usr/bin/env node
/**
 * mandatory_reads 機械スタンプ — entry-points.json E1 正本
 *
 * @see docs/plans/2026-07-11-constitution-round3-master-spec.md R3-5
 * @see npm run cio:session:cold-start（Phase 5c）
 * @see .cursor/hooks/session-start-autopilot.mjs（additional_context）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditMandatoryReadFiles,
  flattenMandatoryReads,
  loadMandatoryReads,
} from './lib/cio-mandatory-reads-entry-points.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAMP_JSON = path.join(root, 'logs', 'mandatory-reads-stamp-latest.json');
const STAMP_TXT = path.join(root, 'logs', 'mandatory-reads-stamp-latest.txt');

/**
 * @param {string} repoRoot
 * @returns {string} 改行なし1行（[ルール確認] 追記用）
 */
export function buildMandatoryReadsStampLine(repoRoot = root) {
  const mr = loadMandatoryReads(repoRoot);
  const audit = auditMandatoryReadFiles(repoRoot);
  const missing = audit.filter((x) => !x.exists).map((x) => x.rel);
  const wake = mr.wake_once_per_session.length;
  const sess = mr.every_session.length;
  if (missing.length) {
    const head = missing.slice(0, 2).join(' · ');
    const tail = missing.length > 2 ? ' …' : '';
    return `必読WAKE: NG ${missing.length}/${audit.length} 欠落（entry-points E1 · ${head}${tail}）`;
  }
  return `必読WAKE: ${audit.length}件OK（wake=${wake} session=${sess} · entry-points E1 · 免除しない）`;
}

/**
 * @param {string} repoRoot
 * @param {{ source?: string }} [opts]
 */
export function writeMandatoryReadsStamp(repoRoot = root, opts = {}) {
  const mr = loadMandatoryReads(repoRoot);
  const audit = auditMandatoryReadFiles(repoRoot);
  const missing = audit.filter((x) => !x.exists).map((x) => x.rel);
  const line = buildMandatoryReadsStampLine(repoRoot);
  const payload = {
    stampedAt: new Date().toISOString(),
    source: opts.source || 'cli',
    entryPoints: 'data/cio-rule-entry-points.json',
    entrance: 'E1-every-turn',
    wake_once_per_session: mr.wake_once_per_session,
    every_session: mr.every_session,
    total: audit.length,
    missing,
    ok: missing.length === 0,
    chatLine: line,
  };
  fs.mkdirSync(path.dirname(STAMP_JSON), { recursive: true });
  fs.writeFileSync(STAMP_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(STAMP_TXT, `[${payload.stampedAt}] ${line}\n`, 'utf8');
  return { line, payload, missing };
}

function fail(msg) {
  console.error(`[cio:mandatory-reads:stamp] ❌ ${msg}`);
  process.exit(2);
}

function main() {
  let result;
  try {
    result = writeMandatoryReadsStamp(root, { source: 'npm run cio:mandatory-reads:stamp' });
  } catch (e) {
    fail(e.message || String(e));
  }
  if (result.missing.length) {
    for (const rel of result.missing) console.error(`  - missing: ${rel}`);
    fail(`${result.missing.length} mandatory_reads file(s) missing`);
  }
  console.log(`[cio:mandatory-reads:stamp] ✅ OK ${result.payload.total} files`);
  process.stdout.write(`${result.line}\n`);
  process.exit(0);
}

const selfAbs = path.resolve(fileURLToPath(import.meta.url));
const argvAbs = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (argvAbs === selfAbs) {
  main();
}
