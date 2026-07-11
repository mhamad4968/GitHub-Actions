#!/usr/bin/env node
/**
 * 依頼効率化ツール v0.1 検査
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildComposeBlock,
  loadRequestComposeTemplates,
  TEMPLATES_REL,
  validateRequestComposeTemplates,
} from './lib/cio-request-compose.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  TEMPLATES_REL,
  'scripts/cio-request-compose.mjs',
  'scripts/lib/cio-request-compose.mjs',
  'docs/runbooks/cio-request-compose.md',
  'docs/plans/2026-07-11-request-efficiency-tool-spec.md',
  'chat-sessions/desktop-ai-emergency-read-pack/36-REQUEST-COMPOSE-INDEX.txt',
];

const needles = [
  {
    rel: 'package.json',
    needles: ['cio:request:compose', 'verify:cio-request-compose'],
  },
  {
    rel: 'docs/runbooks/cio-request-compose.md',
    needles: ['浜田 OK', 'cio:request:compose', '【レーン】'],
  },
];

function main() {
  let bad = false;
  const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)));
  if (missing.length) {
    console.error('[verify:cio-request-compose] NG missing', missing.join(', '));
    bad = true;
  }

  const templates = loadRequestComposeTemplates(root);
  const tv = validateRequestComposeTemplates(templates);
  if (!tv.ok) {
    console.error('[verify:cio-request-compose] NG templates', tv.issues.join(', '));
    bad = true;
  }

  for (const { rel, needles: ns } of needles) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const n of ns) {
      if (!text.includes(n)) {
        console.error(`[verify:cio-request-compose] NG needle ${rel}: ${n}`);
        bad = true;
      }
    }
  }

  const sample = buildComposeBlock(root, {
    laneId: 'kintone',
    intent: 'verify smoke',
    app: '736',
  });
  for (const key of ['【レーン】', '【やりたいこと】', '【触らない】', '【GO待ち】', '【AIへ】']) {
    if (!sample.block.includes(key)) {
      console.error(`[verify:cio-request-compose] NG block missing ${key}`);
      bad = true;
    }
  }
  if (!sample.block.includes('app 736')) {
    console.error('[verify:cio-request-compose] NG app not in block');
    bad = true;
  }

  try {
    buildComposeBlock(root, { laneId: 'kintone', intent: 'no app' });
    console.error('[verify:cio-request-compose] NG kintone without app should fail');
    bad = true;
  } catch {
    console.log('[verify:cio-request-compose] OK kintone requires --app');
  }

  if (bad) process.exit(2);
  console.log('[verify:cio-request-compose] ✅ OK（5レーン · 貼付ブロック生成）');
}

main();
