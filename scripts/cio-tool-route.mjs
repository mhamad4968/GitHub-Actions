#!/usr/bin/env node
/**
 * 依頼意図 → MCP / npm ルーティング提案
 *
 *   npm run cio:tool:route -- --intent "736 deploy"
 *   npm run cio:tool:route -- --intent "CVE-2024" --phase WORK
 *   npm run cio:tool:route -- --intent "736 deploy" --app 736 --json --log
 *
 * @see docs/runbooks/ai-team-tool-routing-v2.md
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRoutePlan,
  formatRoutePlan,
  loadToolRoutingManifest,
  writeRouteLog,
} from './lib/cio-tool-routing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const out = { intent: '', phase: null, appId: null, json: false, log: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--intent') out.intent = argv[++i] || '';
    else if (a === '--phase') out.phase = argv[++i] || null;
    else if (a === '--app' || a === '--app-id') out.appId = argv[++i] || null;
    else if (a === '--json') out.json = true;
    else if (a === '--log') out.log = true;
    else if (!a.startsWith('-') && !out.intent) out.intent = a;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.intent) {
    console.error('Usage: npm run cio:tool:route -- --intent "<依頼要約>" [--phase WORK] [--app 736] [--json] [--log]');
    process.exit(1);
  }

  const manifest = loadToolRoutingManifest(root);
  const plan = buildRoutePlan(manifest, args.intent, {
    phase: args.phase,
    appId: args.appId,
  });

  if (args.log) {
    const rel = writeRouteLog(root, plan);
    plan.logFile = rel;
  }

  if (args.json) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(formatRoutePlan(plan));
    if (plan.logFile) console.log(`  log: ${plan.logFile}`);
  }

  process.exit(plan.primaryIntentId ? 0 : 2);
}

main();
