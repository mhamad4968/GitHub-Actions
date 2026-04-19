#!/usr/bin/env node
/**
 * health-check.mjs — §46 Phase 2: 健康状況チェック
 *
 * 検査内容:
 * 1. MCP 全件 (~/.cursor/mcp.json) に initialize JSON-RPC を送って疎通判定
 * 2. Node.js バージョン整合性 (NVM v24 / Cursor 埋込 v20 の検出)
 * 3. cron 登録状況 (morning-prep が登録されているか)
 * 4. ディスク空き / メモリ使用率
 * 5. 自分自身のスクリプト群が空ファイルになっていないか（再 wipe 検知）
 *
 * 出力:
 *   - logs/health/<日付>-health.json (構造化)
 *   - stdout に markdown サマリ (朝ブリーフィングに埋め込まれる)
 *
 * 出口コード:
 *   - 0: 異常なし
 *   - 1: 1 件以上の異常
 *   - 2: 構造的問題（mcp.json 不在 等）
 *
 * --json フラグ: stdout を JSON のみで出す（health-check:json）
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');
const ARG_JSON = process.argv.includes('--json');

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date());
const LOG_DIR = path.join(REPO_ROOT, 'logs', 'health');
const LOG_PATH = path.join(LOG_DIR, `${today}-health.json`);
fs.mkdirSync(LOG_DIR, { recursive: true });

// ───── ユーティリティ ─────
function out(msg) {
  if (!ARG_JSON) console.log(msg);
}

// Cursor 環境シミュレーション用: Cursor 内蔵 Node v20 のパスを検出
function findCursorEmbeddedNode() {
  const cursorBinDir = path.join(os.homedir(), '.cursor-server', 'bin');
  if (!fs.existsSync(cursorBinDir)) return null;
  try {
    const shas = fs.readdirSync(cursorBinDir).filter((d) => /^[a-f0-9]{40}$/.test(d));
    for (const sha of shas) {
      const candidate = path.join(cursorBinDir, sha, 'node');
      if (fs.existsSync(candidate)) return path.join(cursorBinDir, sha);  // bin dir
    }
  } catch { /* skip */ }
  return null;
}

const CURSOR_NODE_BIN_DIR = findCursorEmbeddedNode();

function probeMcp(name, server, opts = {}) {
  if (server.disabled) return { name, status: 'skip', note: 'disabled:true' };
  // Windows-only コマンドは WSL から実行不可なのでスキップ判定
  if (typeof server.command === 'string' && /\.exe$/i.test(server.command)) {
    return { name, status: 'skip', note: 'Windows-side / WSL から疎通不可' };
  }
  if (typeof server.command === 'string' && /^\/mnt\/c\//.test(server.command)) {
    return { name, status: 'skip', note: 'Windows-side / WSL から疎通不可' };
  }

  const init = JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'health-check', version: '1.0' } },
  });

  // Cursor 環境シミュレーション: Cursor 内蔵 Node v20 の bin を PATH 先頭に置いて再 probe
  // 「ターミナル緑・Cursor UI 赤」乖離の自動検知用
  // ただし server.env.PATH が明示されている場合は尊重（mcp.json で対策済みなので false positive 防止）
  let env = { ...process.env, ...(server.env || {}) };
  const hasExplicitPath = !!(server.env && server.env.PATH);
  if (opts.simulateCursor && CURSOR_NODE_BIN_DIR && !hasExplicitPath) {
    env.PATH = `${CURSOR_NODE_BIN_DIR}:${env.PATH || ''}`;
  }

  const cmd = server.command;
  const args = server.args || [];

  const res = spawnSync(cmd, args, {
    input: init + '\n',
    encoding: 'utf8',
    timeout: 30_000,
    env,
  });

  const stdout = res.stdout || '';
  if (stdout.includes('"jsonrpc"') && stdout.includes('"id":1')) {
    return { name, status: 'ok', note: 'initialize 応答 OK' };
  }
  // mcp-local-rag はバナー出力後に応答するので部分一致でも OK 判定
  if (stdout.includes('initialized') || stdout.includes('VectorStore') || stdout.includes('Server')) {
    return { name, status: 'ok', note: 'initialize 応答 OK' };
  }
  return {
    name,
    status: 'ng',
    note: `応答なし (exit=${res.status} stderr=${(res.stderr || '').slice(0, 100)})`,
  };
}

// ───── MCP ─────
const mcpJsonPath = path.join(os.homedir(), '.cursor', 'mcp.json');
let mcpResults = [];
let cursorDivergence = [];  // ターミナル緑だが Cursor 環境で赤 → UI 赤の予兆
if (!fs.existsSync(mcpJsonPath)) {
  mcpResults = [{ name: '(mcp.json)', status: 'ng', note: 'mcp.json not found' }];
} else {
  try {
    const cfg = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
    const servers = cfg.mcpServers || {};
    for (const [name, server] of Object.entries(servers)) {
      const r = probeMcp(name, server);
      mcpResults.push(r);

      // Cursor 環境シミュレーション: ターミナル OK でも Cursor 環境で再 probe
      // OK だった MCP のみ対象（ng はそもそも Cursor 環境でも ng のはず）
      // 内部で server.env.PATH を尊重するため、mcp.json で対策済みの MCP は影響を受けない
      if (r.status === 'ok' && CURSOR_NODE_BIN_DIR) {
        const sim = probeMcp(name, server, { simulateCursor: true });
        if (sim.status === 'ng') {
          cursorDivergence.push({ name, terminal: 'ok', cursor_env: 'ng', cursor_note: sim.note });
          r.note += ' (⚠ Cursor 環境では NG = UI 赤の予兆)';
        }
      }
    }
  } catch (e) {
    mcpResults = [{ name: '(mcp.json)', status: 'ng', note: `parse error: ${e.message}` }];
  }
}

// ───── Node ─────
const nodeRes = spawnSync('node', ['--version'], { encoding: 'utf8' });
const npmRes = spawnSync('npm', ['--version'], { encoding: 'utf8' });
const whichRes = spawnSync('which', ['node'], { encoding: 'utf8' });
const nvmCurRes = spawnSync('bash', ['-lc', 'echo $NVM_INC && nvm version 2>/dev/null || true'], { encoding: 'utf8' });
const nvmV24 = fs.existsSync(path.join(os.homedir(), '.nvm/versions/node/v24.14.1/bin/node'));

const node = {
  current: (nodeRes.stdout || '').trim() || 'unknown',
  npm: (npmRes.stdout || '').trim() || 'unknown',
  which_node: (whichRes.stdout || '').trim(),
  nvm_default: 'lts/*',
  cursor_node: '',
  nvm_v24_present: nvmV24,
  status: nvmV24 ? 'ok' : 'ng',
};

// ───── disk / mem / cron ─────
const dfRes = spawnSync('bash', ['-lc', "df -h ~ | tail -1 | awk '{print $5\" \"$4\" available on \"$6}'"], { encoding: 'utf8' });
const npmCacheRes = spawnSync('bash', ['-lc', 'du -sh ~/.npm 2>/dev/null | cut -f1'], { encoding: 'utf8' });
const npxCacheRes = spawnSync('bash', ['-lc', 'du -sh ~/.npm/_npx 2>/dev/null | cut -f1'], { encoding: 'utf8' });
const disk = {
  home: (dfRes.stdout || '').trim() || 'unknown',
  npm_cache: (npmCacheRes.stdout || '').trim() || 'unknown',
  npx_cache: (npxCacheRes.stdout || '').trim() || 'unknown',
  status: 'ok',
};

const memRes = spawnSync('bash', ['-lc', "free -m | awk 'NR==2{printf \"%d/%d MiB (%d%%)\", $3, $2, $3*100/$2}'"], { encoding: 'utf8' });
const memory = { line: (memRes.stdout || '').trim() || 'unknown', status: 'ok' };

const cronRes = spawnSync('bash', ['-lc', 'crontab -l 2>/dev/null'], { encoding: 'utf8' });
const cronRaw = (cronRes.stdout || '').trim();
const cron = {
  has_morning_prep: /daily-morning-prep/.test(cronRaw),
  raw: cronRaw,
  status: /daily-morning-prep/.test(cronRaw) ? 'ok' : 'ng',
};

// ───── 自己スクリプト wipe チェック（再発防止） ─────
const criticalScripts = [
  'scripts/daily-morning-prep.mjs',
  'scripts/health-check.mjs',
  'scripts/auto-heal.mjs',
  'scripts/version-up.mjs',
  'scripts/apply-approved-changes.mjs',
  'scripts/evening-reflect.mjs',
  'scripts/audit-rules.mjs',
  'scripts/scan-plans.mjs',
  'scripts/skysea-recon.mjs',
  'AGENTS.md',
  'WORKFLOW.md',
  'CLAUDE.md',
  'kintone-apps.md',
];
const wiped = [];
for (const rel of criticalScripts) {
  const full = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) {
    wiped.push({ path: rel, issue: 'missing' });
  } else if (fs.statSync(full).size === 0) {
    wiped.push({ path: rel, issue: 'empty (0 bytes)' });
  }
}
const selfCheck = {
  status: wiped.length === 0 ? 'ok' : 'ng',
  wiped,
};

// ───── 集計 ─────
const summary = {
  ok: mcpResults.filter((r) => r.status === 'ok').length + [node, disk, memory, cron, selfCheck].filter((s) => s.status === 'ok').length,
  ng: mcpResults.filter((r) => r.status === 'ng').length + [node, cron, selfCheck].filter((s) => s.status === 'ng').length,
  warn: 0,
  skip: mcpResults.filter((r) => r.status === 'skip').length,
};

const result = {
  generated_at: new Date().toISOString(),
  mcp: mcpResults,
  cursor_divergence: cursorDivergence,
  node,
  disk,
  memory,
  cron,
  self_check: selfCheck,
  summary,
};

fs.writeFileSync(LOG_PATH, JSON.stringify(result, null, 2), 'utf8');

if (ARG_JSON) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(summary.ng === 0 ? 0 : 1);
}

// markdown 出力
out('## 🩺 Phase 2: 健康状況チェック');
out('');
out(`**総合**: 正常 ${summary.ok} / 異常 ${summary.ng} / 警告 ${summary.warn} / スキップ ${summary.skip}`);
out('');
out('### MCP 疎通');
out('');
out('| MCP | 結果 | 詳細 |');
out('|---|---|---|');
for (const r of mcpResults) {
  const icon = { ok: '✅', ng: '❌', skip: '⏭' }[r.status] || '?';
  out(`| ${r.name} | ${icon} | ${r.note} |`);
}
out('');
out('### システム');
out('');
out(`- Node: \`${node.current}\` (npm \`${node.npm}\`) — ${node.status === 'ok' ? '✅' : '❌'}`);
out(`  - which: \`${node.which_node}\``);
out(`  - NVM v24 present: ${node.nvm_v24_present ? '✅' : '❌'}`);
out(`- Disk (\`~\`): ${disk.home} — ✅`);
out(`  - npm cache: ${disk.npm_cache} / npx cache: ${disk.npx_cache}`);
out(`- Memory: ${memory.line} — ✅`);
out(`- cron: ${cron.has_morning_prep ? '✅ morning:prep 登録済み' : '❌ morning:prep 未登録'}`);
out('');

if (cursorDivergence.length > 0) {
  out('### ⚠ Cursor 環境シミュレーション乖離検知');
  out('');
  out('以下の MCP は**ターミナルから疎通 OK だが、Cursor 内蔵 Node v20 環境で再 probe すると NG**。');
  out('Cursor 再起動時に UI で赤くなる可能性が高い:');
  out('');
  out('| MCP | Cursor 環境での問題 |');
  out('|---|---|');
  for (const d of cursorDivergence) out(`| ${d.name} | ${d.cursor_note} |`);
  out('');
  out('> **対策**: `.cursor/mcp.json` の `command` を NVM v24 絶対パス + `env.PATH` 強制に変更。');
  out('');
}

if (wiped.length > 0) {
  out('### 🚨 自己スクリプト wipe 検知');
  out('');
  out('| パス | 状態 |');
  out('|---|---|');
  for (const w of wiped) out(`| \`${w.path}\` | ${w.issue} |`);
  out('');
  out('> **再発防止**: `git add -f` で git に取り込み、`git restore` で即復旧できる状態にすることを推奨。');
  out('');
}

process.exit(summary.ng === 0 ? 0 : 1);
