#!/usr/bin/env node
/**
 * 汎用タスク完了 seal — 業務改善以外のレーン完了記録
 *
 * Usage:
 *   npm run cio:task-complete-seal -- --lane 674-done --scope "一覧検索 deploy 済"
 *   npm run cio:task-complete-seal -- --show
 *   npm run cio:task-complete-seal -- --list
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEAL_REL = 'docs/handoff/task-completion-seals.json';

function parseArgs() {
  const out = { lane: '', scope: '', signedBy: '浜田', note: '', gates: [] };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lane') out.lane = args[++i] || '';
    else if (args[i] === '--scope') out.scope = args[++i] || '';
    else if (args[i] === '--signed-by') out.signedBy = args[++i] || '浜田';
    else if (args[i] === '--note') out.note = args[++i] || '';
    else if (args[i] === '--gates') out.gates = (args[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (args[i] === '--show') out.show = true;
    else if (args[i] === '--list') out.list = true;
  }
  return out;
}

function gitHead() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function loadSeals() {
  const p = path.join(root, SEAL_REL);
  if (!fs.existsSync(p)) return [];
  try {
    const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveSeals(arr) {
  const p = path.join(root, SEAL_REL);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(arr, null, 2) + '\n', 'utf8');
}

function main() {
  const args = parseArgs();

  if (args.list || args.show) {
    const seals = loadSeals();
    if (!seals.length) {
      console.log('[cio:task-complete-seal] 未記録');
      process.exit(0);
    }
    if (args.show) {
      console.log(JSON.stringify(seals[seals.length - 1], null, 2));
    } else {
      for (const s of seals) {
        console.log(`${s.signedAt} | ${s.lane} | ${s.scope}`);
      }
    }
    process.exit(0);
  }

  if (!args.lane || !args.scope) {
    console.error('Usage: --lane <id> --scope "<text>" [--gates a,b] [--note ...]');
    process.exit(1);
  }

  const seal = {
    lane: args.lane,
    signedAt: new Date().toISOString(),
    signedBy: args.signedBy,
    scope: args.scope,
    gatesRun: args.gates,
    gitHead: gitHead(),
    note: args.note || 'タスク完了記録',
  };

  const seals = loadSeals();
  seals.push(seal);
  saveSeals(seals);

  console.log('[cio:task-complete-seal] OK →', SEAL_REL);
  console.log(JSON.stringify(seal, null, 2));
}

main();
