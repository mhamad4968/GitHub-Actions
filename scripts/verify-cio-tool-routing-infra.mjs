#!/usr/bin/env node
/**
 * D v2 AI チーム MCP/ツールルーティング infra 検査
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRoutePlan,
  loadToolRoutingManifest,
  validateRoutingManifest,
} from './lib/cio-tool-routing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'docs/runbooks/ai-team-tool-routing-v2.md',
  'data/cio-ai-team-tool-routing.json',
  'data/cio-tool-routing-test-intents.json',
  'scripts/cio-tool-route.mjs',
  'scripts/lib/cio-tool-routing.mjs',
  '.cursor/skills/ai-team-tool-routing/SKILL.md',
  'chat-sessions/tool-routing-logs/.gitkeep',
];

const needles = [
  {
    rel: 'docs/runbooks/session-lifecycle-v2.md',
    needles: ['cio:tool:route', 'ai-team-tool-routing-v2'],
  },
  {
    rel: 'data/cio-handoff-template.json',
    needles: ['ai-team-tool-routing-v2.md'],
  },
  {
    rel: 'data/cio-project-lanes.json',
    needles: ['ai-team-tool-routing', 'tool-routing-governance'],
  },
  {
    rel: 'data/cio-rules-topic-index.json',
    needles: ['cio-ai-team-tool-routing.json', 'ai-team-tool-routing'],
  },
  {
    rel: 'package.json',
    needles: ['cio:tool:route', 'verify:cio-tool-routing-infra'],
  },
];

const requiredCategories = [
  'security',
  'performance',
  'incident',
  'compliance',
  'data',
];

function main() {
  const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)));
  if (missing.length) {
    console.error('[verify:cio-tool-routing-infra] NG missing', missing.join(', '));
    process.exit(1);
  }

  const manifest = loadToolRoutingManifest(root);
  const validation = validateRoutingManifest(manifest);
  if (!validation.ok) {
    console.error('[verify:cio-tool-routing-infra] NG manifest', validation.issues.join('; '));
    process.exit(1);
  }

  for (const cat of requiredCategories) {
    const has = manifest.intents.some((i) => i.category === cat);
    if (!has) {
      console.error(`[verify:cio-tool-routing-infra] NG missing category intent: ${cat}`);
      process.exit(1);
    }
  }

  for (const { rel, needles: ns } of needles) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const n of ns) {
      if (!text.includes(n)) {
        console.error(`[verify:cio-tool-routing-infra] NG "${n}" not in ${rel}`);
        process.exit(1);
      }
    }
  }

  const tests = JSON.parse(
    fs.readFileSync(path.join(root, 'data/cio-tool-routing-test-intents.json'), 'utf8')
  );
  for (const t of tests) {
    const plan = buildRoutePlan(manifest, t.intent, { appId: t.app });
    if (plan.primaryIntentId !== t.expectId) {
      console.error(
        `[verify:cio-tool-routing-infra] NG route test "${t.intent}" expected ${t.expectId} got ${plan.primaryIntentId}`
      );
      process.exit(1);
    }
  }

  console.log(
    `[verify:cio-tool-routing-infra] OK D v2 tool routing (${manifest.intents.length} intents, ${tests.length} route tests)`
  );
  process.exit(0);
}

main();
