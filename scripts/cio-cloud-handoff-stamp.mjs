#!/usr/bin/env node
/**
 * Cloud / 長時間エージェント用の「意図・完了定義・状態」をリポに残す（IDE 閉鎖後の回復補助）。
 * 絶対完走は保証しない — 証跡と次セッションの再開点を残す。
 *
 *   npm run cio:cloud-handoff -- start --intent "..." --criteria "PR+CI green"
 *   npm run cio:cloud-handoff -- end --status partial|done|blocked --note "..."
 *   partial|blocked は --note 必須（再開点・次アクション。未完放置と区別する SLO 運用）。
 *   npm run cio:cloud-handoff -- status
 *
 * @see .cursor/rules/cio-constitution.mdc
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logDir = path.join(root, 'logs');
const logPath = path.join(logDir, 'cloud-agent-handoff.log');
const statePath = path.join(root, 'chat-sessions', 'cloud-agent-last-intent.json');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '1';
      out[k] = v;
    } else out._.push(a);
  }
  return out;
}

function appendLog(obj) {
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify(obj)}\n`, 'utf8');
}

function main() {
  const args = parseArgs(process.argv);
  const sub = args._[0] || 'status';
  const iso = new Date().toISOString();

  if (sub === 'status') {
    if (!fs.existsSync(statePath)) {
      // eslint-disable-next-line no-console
      console.log('(no cloud-agent-last-intent.json)');
      process.exit(0);
    }
    // eslint-disable-next-line no-console
    console.log(fs.readFileSync(statePath, 'utf8'));
    process.exit(0);
  }

  if (sub === 'start') {
    const intent = String(args.intent || '').trim() || '(unspecified)';
    const criteria = String(args.criteria || '').trim() || '(unspecified)';
    const rec = {
      event: 'cloud_handoff_start',
      iso,
      intent,
      doneCriteria: criteria,
      branch: String(args.branch || '').trim() || null,
    };
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify(rec, null, 2)}\n`, 'utf8');
    appendLog(rec);
    // eslint-disable-next-line no-console
    console.log(`OK wrote ${path.relative(root, statePath)}`);
    process.exit(0);
  }

  if (sub === 'end') {
    const status = String(args.status || 'partial').trim();
    const note = String(args.note || '').trim();
    if ((status === 'partial' || status === 'blocked') && !note) {
      // eslint-disable-next-line no-console
      console.error(
        'end --status partial|blocked requires --note "..." (next resume step; resumable SLO ≠ abandon)',
      );
      process.exit(2);
    }
    let prev = {};
    try {
      prev = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch {
      prev = {};
    }
    const rec = {
      event: 'cloud_handoff_end',
      iso,
      status,
      note,
      previous: prev,
    };
    appendLog(rec);
    const merged = { ...prev, closedAt: iso, closeStatus: status, closeNote: note };
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`OK appended log + updated ${path.relative(root, statePath)}`);
    process.exit(0);
  }

  // eslint-disable-next-line no-console
  console.error('Usage: start|end|status (see script header)');
  process.exit(2);
}

main();
