#!/usr/bin/env node
/**
 * 浜田「実装OK」サインの機械記録
 *
 * Usage:
 *   npm run cio:implementation-ok-seal -- --project business-improvement-ver02 --scope "案B1"
 *   npm run cio:implementation-ok-seal -- --show
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEAL_REL = 'docs/handoff/implementation-ok-seal.json';

function parseArgs() {
  const out = { project: '', scope: '', signedBy: '浜田', note: '', gates: [] };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project') out.project = args[++i] || '';
    else if (args[i] === '--scope') out.scope = args[++i] || '';
    else if (args[i] === '--signed-by') out.signedBy = args[++i] || '浜田';
    else if (args[i] === '--note') out.note = args[++i] || '';
    else if (args[i] === '--gates') out.gates = (args[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (args[i] === '--show') out.show = true;
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

function main() {
  const args = parseArgs();
  const sealPath = path.join(root, SEAL_REL);

  if (args.show) {
    if (!fs.existsSync(sealPath)) {
      console.log('[cio:implementation-ok-seal] 未記録 — 浜田サイン待ち');
      process.exit(0);
    }
    console.log(fs.readFileSync(sealPath, 'utf8'));
    process.exit(0);
  }

  if (!args.project || !args.scope) {
    console.error('Usage: --project <id> --scope "<text>" [--gates a,b] [--note ...]');
    process.exit(1);
  }

  const seal = {
    project: args.project,
    signedAt: new Date().toISOString(),
    signedBy: args.signedBy,
    scope: args.scope,
    gatesRun: args.gates.length ? args.gates : ['cio:morning:pre-implement', 'cio:guard:5038'],
    gitHead: gitHead(),
    note: args.note || '浜田「実装OK」サイン記録',
  };

  fs.mkdirSync(path.dirname(sealPath), { recursive: true });
  fs.writeFileSync(sealPath, JSON.stringify(seal, null, 2) + '\n', 'utf8');
  console.log('[cio:implementation-ok-seal] OK →', SEAL_REL);
  console.log(JSON.stringify(seal, null, 2));
}

main();
