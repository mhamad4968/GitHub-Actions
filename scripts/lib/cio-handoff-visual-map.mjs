/**
 * 方針3 — Handoff ビジュアルマッピング（4AI引っ越し完了表）
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SPEC_REL = 'templates/yojitsu-budget-lite/SPEC.md';
const MCP_REQUIRED = ['deepseek', 'kimi', 'repo-tree', 'eslint-mcp', 'openrouter'];

function run(cmd, root) {
  try {
    return { ok: true, out: execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim() };
  } catch (e) {
    return { ok: false, out: (e.stdout || e.stderr || e.message || '').trim() };
  }
}

function meter(pct, width = 20) {
  const filled = Math.round((pct / 100) * width);
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}] ${pct}%`;
}

/** mcp.json キー有無（disabled 含む）。verify の stdout 文言依存は偽陰性になるため使わない。 */
function loadMcpServerKeys(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const j = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const raw = j.mcpServers || {};
    const out = {};
    for (const k of Object.keys(raw)) out[k] = true;
    return out;
  } catch {
    return {};
  }
}

function mergedMcpServerKeys(root) {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const paths = [
    home ? path.join(home, '.cursor', 'mcp.json') : '',
    path.join(root, '.cursor', 'mcp.json'),
  ].filter(Boolean);
  const merged = {};
  for (const p of paths) Object.assign(merged, loadMcpServerKeys(p));
  return merged;
}

export function specProgress(root) {
  const p = path.join(root, SPEC_REL);
  if (!fs.existsSync(p)) return { done: 0, total: 0, pct: 0 };
  const text = fs.readFileSync(p, 'utf8');
  const done = (text.match(/^- \[x\]/gim) || []).length;
  const pending = (text.match(/^- \[ \]/gim) || []).length;
  const total = done + pending;
  const pct = total ? Math.round((done / total) * 100) : 100;
  return { done, total, pending, pct };
}

export function mcpStatus(root) {
  const keys = mergedMcpServerKeys(root);
  const r = run('npm run verify:cio-mcp-registry', root);
  // exit 1 = 推奨のみ欠落（必須は揃っている）→ registry 自体は運用可。exit 2 のみ NG。
  const registryOk = r.ok || !/\bmissing required\b/i.test(r.out);
  const lines = [];
  for (const name of MCP_REQUIRED) {
    const ok = Boolean(keys[name]);
    lines.push(`  ${ok ? '✅' : '❌'} ${name}`);
  }
  return { registryOk, lines };
}

export function repoTreeSummary(root) {
  const dirs = ['scripts', 'docs/handoff', '.cursor/rules', 'templates/yojitsu-budget-lite'];
  const lines = ['  ┌─ repo-tree (lite) ─────────'];
  for (const d of dirs) {
    const p = path.join(root, d);
    const exists = fs.existsSync(p);
    const n = exists ? fs.readdirSync(p).length : 0;
    lines.push(`  ├─ ${d}/ ${exists ? `${n} entries` : 'MISSING'}`);
  }
  lines.push('  └────────────────────────────');
  return lines.join('\n');
}

export function renderHandoffVisualMap(root, bridge) {
  const prog = specProgress(root);
  const mcp = mcpStatus(root);
  const git = bridge?.gitHead || run('git rev-parse --short HEAD', root).out || '?';
  const next = bridge?.nextTask || '(未設定)';
  const exported = bridge?.exportedAt || '(n/a)';

  return [
    '╔══════════════════════════════════════════════════════════════╗',
    '║     【4AI引っ越し完了マッピング表】 verify --import          ║',
    '╠══════════════════════════════════════════════════════════════╣',
    '║ ① インポート最新コミット                                    ║',
    `║    gitHead: ${git}`.padEnd(63) + '║',
    `║    exported: ${exported.slice(0, 40)}`.padEnd(63) + '║',
    '╠══════════════════════════════════════════════════════════════╣',
    '║ ② SPEC.md 進捗（チェックボックス）                          ║',
    `║    ${meter(prog.pct)} (${prog.done}/${prog.total})`.padEnd(63) + '║',
    `║    未完了: ${prog.pending} 件`.padEnd(63) + '║',
    '╠══════════════════════════════════════════════════════════════╣',
    '║ ③ MCP 稼働ステータス (registry)                             ║',
    ...mcp.lines.map((l) => `║ ${l}`.padEnd(63) + '║'),
    `║    verify:cio-mcp-registry: ${mcp.registryOk ? 'OK' : 'NG'}`.padEnd(63) + '║',
    '╠══════════════════════════════════════════════════════════════╣',
    '║ repo-tree 構造スナップショット                              ║',
    ...repoTreeSummary(root)
      .split('\n')
      .map((l) => `║ ${l}`.padEnd(63) + '║'),
    '╠══════════════════════════════════════════════════════════════╣',
    '║ 次タスク                                                     ║',
    `║ ${next.slice(0, 58)}`.padEnd(63) + '║',
    '╚══════════════════════════════════════════════════════════════╝',
    '',
    '【AI-KERNEL】前提=bridge OK | 手順=本題へ | 禁止=凍結レーン触らない | exit=0',
  ].join('\n');
}
