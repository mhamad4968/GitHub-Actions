#!/usr/bin/env node
/**
 * 週末自律監査 — bridge 連動 + 健康レポート（実装凍結時・CEO 不在）
 * @see docs/runbooks/cio-weekend-autonomous-audit.md
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { bridgePath, loadBridge } from './lib/cio-session-bridge.mjs';

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

function auditBridgeTargets(bridge) {
  const lines = ['', '## 監査詳細（bridge 連動）', ''];
  if (!bridge) {
    lines.push('_bridge 無し — `npm run cio:session:export-handoff` 未実行_', '');
    return lines;
  }
  lines.push(`- **exportedAt**: ${bridge.exportedAt}`);
  lines.push(`- **gitHead**: ${bridge.gitHead}`);
  lines.push(`- **nextTask**: ${bridge.nextTask}`, '');
  lines.push('### 対象ファイル群（repo-tree / eslint 監査対象）', '');
  for (const rel of bridge.nextFiles || []) {
    const p = path.join(root, rel);
    const exists = fs.existsSync(p);
    lines.push(`- \`${rel}\`: ${exists ? '存在 OK' : 'NG 欠落'}`);
  }
  lines.push('', '### MCP 監査ゲート', '');
  const reg = run('npm run verify:cio-mcp-registry');
  lines.push(`- verify:cio-mcp-registry: ${reg.ok ? 'OK' : 'NG'}`);
  const comp = run('npm run cio:guard:composer-mcp-audit');
  lines.push(`- cio:guard:composer-mcp-audit: ${comp.ok ? 'OK' : 'NG'}`);
  lines.push('', '### Self-Healing 布石', '');
  lines.push(
    '- L2 以下の **構文のみ** エラー → Composer 2.5 が `[WEEKEND-SELF-HEALING]` コミット可（仕様意味変更禁止）',
  );
  lines.push('- 正本: `docs/runbooks/cio-weekend-autonomous-audit.md` §Self-Healing', '');
  return lines;
}

function mergeIntoCanonicalReport(detailLines, ymd) {
  const canonical = path.join(plansDir, '2026-05-29-weekend-health-audit.md');
  const marker = '## 監査詳細（bridge 連動）';
  if (fs.existsSync(canonical)) {
    let body = fs.readFileSync(canonical, 'utf8');
    const idx = body.indexOf(marker);
    if (idx >= 0) body = body.slice(0, idx).trimEnd() + '\n';
    body += '\n' + detailLines.join('\n') + '\n';
    fs.writeFileSync(canonical, body, 'utf8');
    return canonical;
  }
  return null;
}

function main() {
  const ymd = jstDate();
  const outPath = path.join(plansDir, `${ymd}-weekend-health-audit.md`);
  const bridge = loadBridge(root);

  const checks = [
    ['verify:cio-mcp-registry', 'npm run verify:cio-mcp-registry'],
    ['verify:cio-four-ai-governance', 'npm run verify:cio-four-ai-governance'],
    ['verify:cio-session-dissolution', 'npm run verify:cio-session-dissolution'],
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

  const detail = auditBridgeTargets(bridge);
  lines.push(...detail);

  lines.push('', '## 次アクション（月曜）', '', '- CEO 検収', '- NG 項目があれば CIO 自律是正', '');

  fs.mkdirSync(plansDir, { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');

  const merged = mergeIntoCanonicalReport(detail, ymd);
  if (merged) console.log('[cio-weekend-autonomous-audit] merged detail →', merged);

  console.log('[cio-weekend-autonomous-audit]', allOk ? 'OK' : 'NG', outPath);
  process.exit(allOk ? 0 : 1);
}

main();
