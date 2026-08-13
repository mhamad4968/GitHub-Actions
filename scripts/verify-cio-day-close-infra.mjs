#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'data/cio-day-close-chain.json',
  'scripts/cio-day-close.mjs',
  'docs/runbooks/cio-day-close-v1.md',
];

function main() {
  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) {
      console.error('[verify:cio-day-close-infra] NG missing', rel);
      process.exit(1);
    }
  }
  const chain = JSON.parse(fs.readFileSync(path.join(root, 'data/cio-day-close-chain.json'), 'utf8'));
  if (chain.pauseAfter !== 'GO' || chain.notAColdStartGate !== true) {
    console.error('[verify:cio-day-close-infra] NG pauseAfter/notAColdStartGate');
    process.exit(1);
  }
  const src = fs.readFileSync(path.join(root, 'scripts/cio-day-close.mjs'), 'utf8');
  if (!src.includes('--until-pause') || !src.includes('cio:eod:github')) {
    console.error('[verify:cio-day-close-infra] NG until-pause wiring');
    process.exit(1);
  }
  const eod = fs.readFileSync(path.join(root, 'scripts/cio-eod-github.mjs'), 'utf8');
  if (!eod.includes('classifyGhRuns')) {
    console.error('[verify:cio-day-close-infra] NG eod classifyGhRuns');
    process.exit(1);
  }
  const evening = fs.readFileSync(path.join(root, 'scripts/evening-reflect.mjs'), 'utf8');
  if (evening.includes('翌朝 06:00 cron')) {
    console.error('[verify:cio-day-close-infra] NG evening cron auto');
    process.exit(1);
  }
  if (!src.includes('cio:checkpoint:sync-live-674')) {
    console.error('[verify:cio-day-close-infra] NG after-go live-674');
    process.exit(1);
  }
  if (!src.includes('--message')) {
    console.error('[verify:cio-day-close-infra] NG close-git message');
    process.exit(1);
  }
  const until = src.slice(src.indexOf('function untilPause'), src.indexOf('function afterGo'));
  if (until.includes('cio:session:close-git')) {
    console.error('[verify:cio-day-close-infra] NG until-pause must not close-git');
    process.exit(1);
  }
  const cold = fs.readFileSync(path.join(root, 'scripts/cio-session-cold-start.mjs'), 'utf8');
  if (cold.includes('cio:day-close')) {
    console.error('[verify:cio-day-close-infra] NG must not be cold-start gate');
    process.exit(1);
  }
  const help = spawnSync(process.execPath, [path.join(root, 'scripts/cio-day-close.mjs'), '--help'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (help.status !== 0 || !help.stdout.includes('--until-pause')) {
    console.error('[verify:cio-day-close-infra] NG --help');
    process.exit(1);
  }
  const pkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
  if (!pkg.includes('"cio:day-close"')) {
    console.error('[verify:cio-day-close-infra] NG package.json script');
    process.exit(1);
  }
  console.log('[verify:cio-day-close-infra] OK');
}

main();
