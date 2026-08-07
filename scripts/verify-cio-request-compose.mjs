#!/usr/bin/env node
/**
 * 依頼効率化ツール v0.1 検査
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildComposeBlock,
  COMPOSE_LOG_DIR_REL,
  loadRequestComposeTemplates,
  TEMPLATES_REL,
  validateRequestComposeTemplates,
  writeComposeLog,
} from './lib/cio-request-compose.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  TEMPLATES_REL,
  'scripts/cio-request-compose.mjs',
  'scripts/lib/cio-request-compose.mjs',
  'docs/runbooks/cio-request-compose.md',
  'docs/plans/2026-07-11-request-efficiency-tool-spec.md',
  'docs/plans/2026-08-08-request-efficiency-v02-and-go-boundary.md',
  'chat-sessions/desktop-ai-emergency-read-pack/36-REQUEST-COMPOSE-INDEX.txt',
  'chat-sessions/request-compose-logs/.gitkeep',
  '.cursor/skills/cio-request-compose/SKILL.md',
];

const needles = [
  {
    rel: 'package.json',
    needles: ['cio:request:compose', 'verify:cio-request-compose'],
  },
  {
    rel: 'docs/runbooks/cio-request-compose.md',
    needles: [
      '浜田 OK',
      'cio:request:compose',
      '【レーン】',
      '確認 A',
      'G0',
      'GO境界・3行',
      'request-compose-logs',
      'cio-request-compose/SKILL.md',
    ],
  },
  {
    rel: 'chat-sessions/desktop-ai-emergency-read-pack/36-REQUEST-COMPOSE-INDEX.txt',
    needles: ['GO境界・3行', 'GO 段階対応表', '--phase investigate', 'cio-request-compose'],
  },
  {
    rel: 'docs/plans/2026-08-08-request-efficiency-v02-and-go-boundary.md',
    needles: ['確認A（compose OK）', 'G0（「調査から」）', 'G2（「実装GO」明示）'],
  },
  {
    rel: '.cursor/skills/cio-request-compose/SKILL.md',
    needles: ['確認A（compose OK）', 'cio:request:compose', '実装GO'],
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
  for (const key of ['【段階】', '【レーン】', '【やりたいこと】', '【触らない】', '【GO待ち】', '【AIへ】']) {
    if (!sample.block.includes(key)) {
      console.error(`[verify:cio-request-compose] NG block missing ${key}`);
      bad = true;
    }
  }
  if (!sample.block.includes('確認A（このOK≠実装GO）')) {
    console.error('[verify:cio-request-compose] NG block missing 確認A stage label');
    bad = true;
  }
  if (!sample.block.includes('app 736')) {
    console.error('[verify:cio-request-compose] NG app not in block');
    bad = true;
  }

  const investigate = buildComposeBlock(root, {
    laneId: 'kintone',
    intent: 'verify investigate',
    app: '688',
    phase: 'investigate',
  });
  if (!investigate.block.includes('調査のみ')) {
    console.error('[verify:cio-request-compose] NG investigate phase missing 調査のみ');
    bad = true;
  }
  if (!investigate.block.includes('実装GOまで')) {
    console.error('[verify:cio-request-compose] NG investigate phase missing 実装GO');
    bad = true;
  }
  if (investigate.block.includes('pre-implement-gate')) {
    console.error('[verify:cio-request-compose] NG investigate should not suggest pre-implement-gate in hint');
    bad = true;
  }

  try {
    buildComposeBlock(root, { laneId: 'kintone', intent: 'no app' });
    console.error('[verify:cio-request-compose] NG kintone without app should fail');
    bad = true;
  } catch {
    console.log('[verify:cio-request-compose] OK kintone requires --app');
  }

  try {
    const logRel = writeComposeLog(root, sample, {
      laneId: 'kintone',
      intent: 'verify smoke',
      app: '736',
    });
    const logAbs = path.join(root, logRel);
    if (!fs.existsSync(logAbs)) {
      console.error('[verify:cio-request-compose] NG compose log not written');
      bad = true;
    } else {
      const parsed = JSON.parse(fs.readFileSync(logAbs, 'utf8'));
      if (parsed.schema !== 'cio-request-compose-log/v1' || !parsed.block) {
        console.error('[verify:cio-request-compose] NG compose log schema');
        bad = true;
      } else {
        console.log(`[verify:cio-request-compose] OK log → ${COMPOSE_LOG_DIR_REL}/`);
      }
      fs.unlinkSync(logAbs);
    }
  } catch (e) {
    console.error('[verify:cio-request-compose] NG writeComposeLog', e.message);
    bad = true;
  }

  if (bad) process.exit(2);
  console.log('[verify:cio-request-compose] ✅ OK（5レーン · 貼付 · ログ · Skill）');
}

main();
