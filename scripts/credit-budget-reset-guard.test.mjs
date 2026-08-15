#!/usr/bin/env node
/**
 * 課金日急落を旧期間へ書かない（2026-08-15 33%→1% 誤認の回帰）
 *   node scripts/credit-budget-reset-guard.test.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts', 'credit-budget.mjs');

function tmpState(records, periodStart = '2026-07-15') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'credit-reset-guard-'));
  const usage = path.join(dir, 'credit-usage.json');
  const history = path.join(dir, 'credit-usage-history.jsonl');
  fs.writeFileSync(
    usage,
    JSON.stringify(
      {
        schema_version: 1,
        reset_day: 15,
        current_period_start: periodStart,
        daily_records: records,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  return { dir, usage, history };
}

function runSet(env, pct) {
  return spawnSync(process.execPath, [script, 'set', String(pct)], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

console.log('[test:credit-budget-reset-guard] start');

{
  const { dir, usage, history } = tmpState([{ date: '2026-08-13', percent: 33 }]);
  try {
    const r = runSet(
      { CREDIT_USAGE_FILE: usage, CREDIT_HISTORY_FILE: history, CREDIT_TODAY_ISO: '2026-08-15' },
      1,
    );
    assert.notEqual(r.status, 0, '33→1 on reset day must exit 1');
    assert.match(r.stderr, /旧期間へ記録できません/);
    const after = JSON.parse(fs.readFileSync(usage, 'utf8'));
    assert.equal(after.daily_records.length, 1);
    assert.equal(after.daily_records[0].percent, 33);
    console.log('  ✅ block 33→1 into old period');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const { dir, usage, history } = tmpState([{ date: '2026-08-13', percent: 15 }]);
  try {
    const r = runSet(
      { CREDIT_USAGE_FILE: usage, CREDIT_HISTORY_FILE: history, CREDIT_TODAY_ISO: '2026-08-15' },
      1,
    );
    assert.notEqual(r.status, 0, '15→1 (DeepSeek counterexample) must exit 1');
    console.log('  ✅ block 15→1');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const { dir, usage, history } = tmpState([{ date: '2026-08-13', percent: 8 }]);
  try {
    const r = runSet(
      { CREDIT_USAGE_FILE: usage, CREDIT_HISTORY_FILE: history, CREDIT_TODAY_ISO: '2026-08-15' },
      1,
    );
    assert.notEqual(r.status, 0, '8→1 (new<=5) must exit 1');
    console.log('  ✅ block 8→1');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const { dir, usage, history } = tmpState([{ date: '2026-08-13', percent: 33 }]);
  try {
    const r = runSet(
      { CREDIT_USAGE_FILE: usage, CREDIT_HISTORY_FILE: history, CREDIT_TODAY_ISO: '2026-08-15' },
      33,
    );
    assert.equal(r.status, 0, 'same-level on reset day (old period still showing) allowed');
    const after = JSON.parse(fs.readFileSync(usage, 'utf8'));
    assert.equal(after.daily_records.at(-1).percent, 33);
    assert.match(r.stderr + r.stdout, /期間未ロール|月次リセット/);
    console.log('  ✅ allow 33→33 with warn');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const { dir, usage, history } = tmpState([], '2026-08-15');
  try {
    const r = runSet(
      { CREDIT_USAGE_FILE: usage, CREDIT_HISTORY_FILE: history, CREDIT_TODAY_ISO: '2026-08-15' },
      1,
    );
    assert.equal(r.status, 0, 'after reset --now, set 1% is new period');
    const after = JSON.parse(fs.readFileSync(usage, 'utf8'));
    assert.equal(after.daily_records.at(-1).percent, 1);
    console.log('  ✅ allow 1% after period already rolled');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

{
  const { dir, usage, history } = tmpState([{ date: '2026-08-13', percent: 32 }]);
  try {
    const r = runSet(
      { CREDIT_USAGE_FILE: usage, CREDIT_HISTORY_FILE: history, CREDIT_TODAY_ISO: '2026-08-13' },
      33,
    );
    assert.equal(r.status, 0, 'mid-period increment allowed');
    console.log('  ✅ allow mid-period 32→33');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('[test:credit-budget-reset-guard] OK');
