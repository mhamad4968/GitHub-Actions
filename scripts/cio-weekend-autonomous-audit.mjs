#!/usr/bin/env node
/**
 * 週末自律監査 — 健康状態レポート生成（実装凍結時・CEO 不在）
 * @see docs/runbooks/cio-weekend-autonomous-audit.md
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plansDir = path.join(root, 'docs', 'plans');

function jstDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

function run(cmd) {
  try {
    const out = execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, out: (e.stdout || e.stderr || e.message || '').trim() };
  }
}

function main() {
  const ymd = jstDate();
  const outPath = path.join(plansDir, `${ymd}-weekend-health-audit.md`);

  const checks = [
    ['verify:cio-mcp-registry', 'npm run verify:cio-mcp-registry'],
    ['verify:cio-four-ai-governance', 'npm run verify:cio-four-ai-governance'],
    ['npm audit --omit=dev', 'npm audit --omit=dev --json'],
  ];

  const lines = [
    `# 週末健康状態監査レポート（${ymd} JST）`,
    '',
    '**生成**: `npm run cio:weekend:autonomous-audit`',
    '**提出**: 週明け月曜ファーストターンで CEO へ',
    '**実装レーン**: 凍結中（customize/deploy 未実施）',
    '',
    '## サマリ',
    '',
  ];

  let allOk = true;
  for (const [name, cmd] of checks) {
    const r = run(cmd);
    lines.push(`- **${name}**: ${r.ok ? 'OK' : 'NG'}`);
    if (!r.ok) allOk = false;
  }

  lines.push('', '## npm audit（抜粋）', '');
  const audit = run('npm audit --omit=dev');
  lines.push('```', audit.out.slice(0, 2000) || '(empty)', '```');

  lines.push('', '## 次アクション（月曜）', '', '- CEO 検収', '- NG 項目があれば CIO 自律是正', '');

  fs.mkdirSync(plansDir, { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log('[cio-weekend-autonomous-audit]', allOk ? 'OK' : 'NG', outPath);
  process.exit(allOk ? 0 : 1);
}

main();
