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
 * 6. (S16) 憲法ファイル watcher (file-watcher.mjs) 稼働確認 — 未起動は warn（ng ではない）
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

/** MCP 子プロセスが undici 等で global File を要求するため Node 20+ が必要。WSL で `npm run` が /usr/bin/node (v18) のままだと cyber-news 等が誤 NG になる。 */
function parseSemverFromDirname(name) {
  const m = name.match(/^v(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
function cmpSemverDirDesc(a, b) {
  const pa = parseSemverFromDirname(a);
  const pb = parseSemverFromDirname(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pb[i] - pa[i];
  }
  return 0;
}
function findNvmNodeBinMinMajor20() {
  if (process.env.MCP_PROBE_NODE && fs.existsSync(process.env.MCP_PROBE_NODE)) {
    return process.env.MCP_PROBE_NODE;
  }
  const nvmNodes = path.join(os.homedir(), '.nvm/versions/node');
  if (!fs.existsSync(nvmNodes)) return null;
  const dirs = fs.readdirSync(nvmNodes).filter((d) => /^v\d+\.\d+\.\d+/.test(d));
  dirs.sort(cmpSemverDirDesc);
  for (const d of dirs) {
    const major = Number(d.slice(1).split('.')[0]);
    if (major < 20) continue;
    const bin = path.join(nvmNodes, d, 'bin/node');
    if (fs.existsSync(bin)) return bin;
  }
  return null;
}
function resolveNodeBinForMcpProbe(requestedCmd) {
  if (typeof requestedCmd !== 'string') return requestedCmd;
  if (path.basename(requestedCmd) !== 'node') return requestedCmd;
  const nvmNode = findNvmNodeBinMinMajor20();
  return nvmNode || requestedCmd;
}

function probeMcp(name, server, opts = {}) {
  if (!server || typeof server !== 'object') {
    return { name, status: 'ng', note: 'server 定義がオブジェクトではありません' };
  }
  if (server.disabled) return { name, status: 'skip', note: 'disabled:true' };
  // Cursor が接続する URL/SSE 型（例: Figma 公式）は stdio の command が無い → ここでは疎通対象外
  if (typeof server.url === 'string' && server.url.trim() && (typeof server.command !== 'string' || !server.command.trim())) {
    return { name, status: 'skip', note: 'url-only MCP（stdio initialize 対象外・IDE 側で接続）' };
  }
  if (typeof server.command !== 'string' || !server.command.trim()) {
    return { name, status: 'ng', note: 'server.command 未定義または空（mcp.json を修正）' };
  }
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

  // ⚠ 2026-04-23 (TSB-013 真因 v2): cron 環境で `uv` (Python uvx) 系 MCP が起動失敗する問題対策。
  //   cve-search の command="uv" は PATH 依存。crontab の PATH=/NVM_v24:/usr/bin:/bin には
  //   uv (~/.local/bin/uv) が含まれず、cron 実行時のみ ❌ 誤検知 (exit=null = uv not found)。
  //   手動 / Cursor 経由は ~/.local/bin が PATH にあるため正常動作 = 環境差で false negative。
  //   → ~/.local/bin を PATH 先頭に必ず追加して cron / 手動どちらでも uv 系 MCP を発見可能にする。
  if (!hasExplicitPath) {
    const localBin = `${process.env.HOME || '/home/mhamada202408224'}/.local/bin`;
    env.PATH = `${localBin}:${env.PATH || ''}`;
  }

  const cmd = resolveNodeBinForMcpProbe(server.command);
  const args = server.args || [];

  // ⚠ 2026-04-23: MCP probe timeout を 30 → 60 秒に延長 (TSB-013 対策)
  //   過去の 4h cron で cve-search が cold start (NVD DB 2.2M records 読込) で
  //   30 秒以内に initialize 応答を返せず ❌ 誤検知が発生していた。
  //   実 call では即応答 OK = サーバ自体は健全。timeout を rag (60s) と同じ値に統一。
  //   ※ ただし真の真因は uv の PATH 不足だった (上記 v2 対策が本筋)。timeout 60s は念のため維持。
  const res = spawnSync(cmd, args, {
    input: init + '\n',
    encoding: 'utf8',
    timeout: 60_000,
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
let ragDeepCheck = null;    // rag MCP DB 内容チェック (TSB-012 再発防止)
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

    // ───── rag MCP 専用 DB 内容チェック (TSB-012 再発防止 / 2026-04-23 追加) ─────
    // mcp-local-rag v0.13.0 は server mode で --db-path CLI 引数を無視し env DB_PATH のみ参照する。
    // 設定不備で documentCount=0 になる事故を 2026-04-23 03:00 早朝に発見 (TSB-012) し、
    // 静的設定チェック + 動的 status 呼出の二段階で再発防止する。
    const ragServer = servers.rag;
    if (ragServer && !ragServer.disabled) {
      const hasDbPathEnv = !!(ragServer.env && ragServer.env.DB_PATH);
      const hasDbPathArg = (ragServer.args || []).includes('--db-path');
      const configIssues = [];
      if (!hasDbPathEnv) configIssues.push('env.DB_PATH 未設定 (v0.13.0 server mode は CLI 引数無視)');
      if (hasDbPathArg && !hasDbPathEnv) configIssues.push('args に --db-path 残存 (env.DB_PATH 必須)');

      let documentCount = null;
      let statusErr = null;
      try {
        const reqs = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'health-check-rag', version: '1.0' } } })
          + '\n'
          + JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'status', arguments: {} } })
          + '\n';
        const res = spawnSync(resolveNodeBinForMcpProbe(ragServer.command), ragServer.args || [], {
          input: reqs,
          encoding: 'utf8',
          timeout: 60_000,
          env: { ...process.env, ...(ragServer.env || {}) },
        });
        const m = (res.stdout || '').match(/documentCount["\\:\s]+(\d+)/);
        if (m) documentCount = Number(m[1]);
        else statusErr = `status 応答パース失敗 (exit=${res.status})`;
      } catch (e) {
        statusErr = `status 呼出失敗: ${e.message}`;
      }

      let status = 'ok';
      const notes = [];
      if (configIssues.length > 0) { status = 'ng'; notes.push(configIssues.join(' / ')); }
      if (documentCount === 0) { status = 'ng'; notes.push('documentCount=0 (DB 認識不可 / TSB-012)'); }
      if (documentCount === null && !statusErr) notes.push('documentCount 不明');
      if (statusErr) { status = 'ng'; notes.push(statusErr); }
      if (typeof documentCount === 'number' && documentCount > 0) notes.push(`documentCount=${documentCount}`);

      ragDeepCheck = {
        status,
        document_count: documentCount,
        config_issues: configIssues,
        note: notes.join(' / '),
      };
    }

    // Windows: stdio MCP の CLI 直 probe は IDE 外で偽陰性になりやすい → 既定 skip（厳格: HEALTH_CHECK_STRICT_WIN=1）
    if (process.platform === 'win32' && process.env.HEALTH_CHECK_STRICT_WIN !== '1') {
      for (const r of mcpResults) {
        if (r.status === 'ng' && String(r.note || '').includes('応答なし')) {
          r.status = 'skip';
          r.note = `${r.note} → Windows CLI=IDE 外のため skip（厳格: set HEALTH_CHECK_STRICT_WIN=1）`;
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
const whichRes =
  process.platform === 'win32'
    ? spawnSync('where.exe', ['node'], { encoding: 'utf8' })
    : spawnSync('which', ['node'], { encoding: 'utf8' });
const nvmCurRes = spawnSync('bash', ['-lc', 'echo $NVM_INC && nvm version 2>/dev/null || true'], { encoding: 'utf8' });
const nvmV24 = fs.existsSync(path.join(os.homedir(), '.nvm/versions/node/v24.14.1/bin/node'));
const nodeVerStr = (nodeRes.stdout || '').trim().replace(/^v/i, '');
const nodeMajor = Number(nodeVerStr.split('.')[0]) || 0;
const nodeOkWindows = process.platform === 'win32' && nodeMajor >= 20;

const node = {
  current: (nodeRes.stdout || '').trim() || 'unknown',
  npm: (npmRes.stdout || '').trim() || 'unknown',
  which_node: (whichRes.stdout || '').trim().split(/\r?\n/)[0] || '',
  nvm_default: 'lts/*',
  cursor_node: '',
  nvm_v24_present: nvmV24,
  status: nvmV24 || nodeOkWindows ? 'ok' : 'ng',
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

// ───── node_modules 完全性チェック (S9 wiring / R15-R16 連動 / TSB-007 episode 3 対策) ─────
let nodeModulesCheck = { status: 'skip', note: 'check-node-modules.mjs not present' };
const nodeModulesScriptPath = path.join(REPO_ROOT, 'scripts', 'check-node-modules.mjs');
if (fs.existsSync(nodeModulesScriptPath)) {
  const nmRes = spawnSync('node', [nodeModulesScriptPath, '--json'], { encoding: 'utf8', timeout: 30_000 });
  if (nmRes.status === 0) {
    nodeModulesCheck = { status: 'ok', note: 'node_modules 完全性 OK' };
  } else if (nmRes.status === 1) {
    let detail = '';
    try { const j = JSON.parse(nmRes.stdout || '{}'); detail = `欠損 ${j.missing?.length || 0} / バージョン不一致 ${j.version_mismatch?.length || 0}`; } catch { detail = '詳細パース失敗'; }
    nodeModulesCheck = { status: 'ng', note: `node_modules 不整合: ${detail} (npm ci 推奨)` };
  } else {
    nodeModulesCheck = { status: 'ng', note: `script error (exit=${nmRes.status})` };
  }
}

// ───── Git ahead/behind チェック (S15 wiring / I-10 2026-04-25) ─────
//   目的: push 忘れ / pull 忘れ早期検知
//   背景: 4/22-23 で 134 commits ahead 状態が続いた前例 → push trigger 自動化したい
let gitStatusCheck = { status: 'skip', note: 'git command unavailable' };
try {
  const remoteCheck = spawnSync('git', ['-C', REPO_ROOT, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { encoding: 'utf8', timeout: 5_000 });
  if (remoteCheck.status === 0) {
    const upstream = remoteCheck.stdout.trim();
    const counts = spawnSync('git', ['-C', REPO_ROOT, 'rev-list', '--left-right', '--count', `${upstream}...HEAD`], { encoding: 'utf8', timeout: 5_000 });
    if (counts.status === 0) {
      const [behindStr, aheadStr] = counts.stdout.trim().split(/\s+/);
      const behind = Number(behindStr) || 0;
      const ahead = Number(aheadStr) || 0;
      const branch = (spawnSync('git', ['-C', REPO_ROOT, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).stdout || '').trim();
      // 50 commits 以上 ahead / behind なら警告 (push/pull 忘れ閾値)
      const heavyAhead = ahead >= 50;
      const heavyBehind = behind >= 10;
      if (heavyAhead || heavyBehind) {
        gitStatusCheck = {
          status: 'ng',
          note: `${branch}: ${ahead} ahead / ${behind} behind ${upstream} (push/pull 忘れの恐れ)`,
          ahead, behind, branch, upstream,
        };
      } else if (ahead === 0 && behind === 0) {
        gitStatusCheck = { status: 'ok', note: `${branch} = ${upstream} (完全同期)`, ahead, behind, branch, upstream };
      } else {
        gitStatusCheck = {
          status: 'ok',
          note: `${branch}: ${ahead} ahead / ${behind} behind ${upstream}`,
          ahead, behind, branch, upstream,
        };
      }
    } else {
      gitStatusCheck = { status: 'skip', note: 'rev-list 失敗 (branch 未追跡?)' };
    }
  } else {
    gitStatusCheck = { status: 'skip', note: 'upstream 未設定' };
  }
} catch (e) {
  gitStatusCheck = { status: 'skip', note: `git status check error: ${e?.message || e}` };
}

// ───── 憲法ファイル watcher 稼働 (S16 / K-3 / §51-3 段階 3) ─────
let ruleWatcherCheck = { status: 'ok', note: 'file-watcher.mjs 稼働中 (憲法 5 ファイル SHA256 監視)' };
{
  const rwPs = spawnSync(
    'bash',
    ['-lc', "ps aux | grep -v grep | grep -F 'scripts/file-watcher.mjs' || true"],
    { encoding: 'utf8', timeout: 5_000 },
  );
  if (!(rwPs.stdout || '').trim()) {
    ruleWatcherCheck = {
      status: 'warn',
      note: 'file-watcher 未稼働 — `npm run watcher:start` 推奨 (K-3 / commit 前並列編集検知)',
    };
  }
}

// ───── MCP 死蔵検知 (S12 wiring / 改善案 #12) ─────
let mcpDormancyCheck = { status: 'skip', note: 'check-mcp-dormancy.mjs not present' };
const mcpDormancyScriptPath = path.join(REPO_ROOT, 'scripts', 'check-mcp-dormancy.mjs');
if (fs.existsSync(mcpDormancyScriptPath)) {
  const mdRes = spawnSync('node', [mcpDormancyScriptPath, '--json', '--days=7'], { encoding: 'utf8', timeout: 30_000 });
  try {
    const j = JSON.parse(mdRes.stdout || '{}');
    if (j.status === 'ok') {
      const exemptNote = j.exempt > 0 ? ` (${j.exempt} exempt)` : '';
      mcpDormancyCheck = { status: 'ok', note: `${j.active}/${j.total} active${exemptNote} (過去 ${j.window_short_days} 日)` };
    } else if (j.status === 'warn') {
      const exemptNote = j.exempt > 0 ? ` (${j.exempt} exempt)` : '';
      mcpDormancyCheck = {
        status: 'warn',
        note: `死蔵 ${j.dormant} / 削除候補 ${j.deletion_candidate} (過去 ${j.window_short_days} 日) — 参考のみ${exemptNote}`,
      };
    } else if (j.status === 'ng') {
      mcpDormancyCheck = { status: 'ng', note: `死蔵 ${j.dormant} / 削除候補 ${j.deletion_candidate} (過去 ${j.window_short_days} 日)` };
    } else if (j.dormant > 0 || j.deletion_candidate > 0) {
      mcpDormancyCheck = { status: 'ng', note: `死蔵 ${j.dormant} / 削除候補 ${j.deletion_candidate} (過去 ${j.window_short_days} 日)` };
    } else {
      mcpDormancyCheck = { status: 'ng', note: 'parse error or unknown status' };
    }
  } catch {
    mcpDormancyCheck = { status: 'ng', note: `script error (exit=${mdRes.status})` };
  }
}

// ───── 集計 ─────
// ⚠ 2026-04-24 (S13 v2 / Phase Z 第 1 ループで判明した「半完成」状態の解消):
//    S13 v1 (commit b9f3b01) は nodeModulesCheck + mcpDormancyCheck の起動のみで
//    集計と markdown 出力に未反映だった。v2 で summary + markdown 出力に統合。
const ragDeepNgCount = ragDeepCheck && ragDeepCheck.status === 'ng' ? 1 : 0;
const ragDeepOkCount = ragDeepCheck && ragDeepCheck.status === 'ok' ? 1 : 0;
const nodeModulesOkCount = nodeModulesCheck.status === 'ok' ? 1 : 0;
const nodeModulesNgCount = nodeModulesCheck.status === 'ng' ? 1 : 0;
const nodeModulesSkipCount = nodeModulesCheck.status === 'skip' ? 1 : 0;
const mcpDormancyOkCount = mcpDormancyCheck.status === 'ok' ? 1 : 0;
const mcpDormancyNgCount = mcpDormancyCheck.status === 'ng' ? 1 : 0;
const mcpDormancyWarnCount = mcpDormancyCheck.status === 'warn' ? 1 : 0;
const mcpDormancySkipCount = mcpDormancyCheck.status === 'skip' ? 1 : 0;
const gitStatusOkCount = gitStatusCheck.status === 'ok' ? 1 : 0;
const gitStatusNgCount = gitStatusCheck.status === 'ng' ? 1 : 0;
const gitStatusSkipCount = gitStatusCheck.status === 'skip' ? 1 : 0;
const ruleWatcherOkCount = ruleWatcherCheck.status === 'ok' ? 1 : 0;
const ruleWatcherWarnCount = ruleWatcherCheck.status === 'warn' ? 1 : 0;
const summary = {
  ok: mcpResults.filter((r) => r.status === 'ok').length + [node, disk, memory, cron, selfCheck].filter((s) => s.status === 'ok').length + ragDeepOkCount + nodeModulesOkCount + mcpDormancyOkCount + gitStatusOkCount + ruleWatcherOkCount,
  ng: mcpResults.filter((r) => r.status === 'ng').length + [node, cron, selfCheck].filter((s) => s.status === 'ng').length + ragDeepNgCount + nodeModulesNgCount + mcpDormancyNgCount + gitStatusNgCount,
  warn: ruleWatcherWarnCount + mcpDormancyWarnCount,
  skip: mcpResults.filter((r) => r.status === 'skip').length + nodeModulesSkipCount + mcpDormancySkipCount + gitStatusSkipCount,
};

const result = {
  generated_at: new Date().toISOString(),
  mcp: mcpResults,
  cursor_divergence: cursorDivergence,
  rag_deep_check: ragDeepCheck,
  node,
  disk,
  memory,
  cron,
  self_check: selfCheck,
  node_modules: nodeModulesCheck,
  mcp_dormancy: mcpDormancyCheck,
  git_status: gitStatusCheck,
  rule_watcher: ruleWatcherCheck,
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

// ⚠ 2026-04-24 (S13 v2): 自己診断強化 (S9 + S12 wiring 結果) を追加表示
out('### 🛡 自己診断強化 (S9 + S12 wiring)');
out('');
{
  const nmIcon = { ok: '✅', ng: '❌', skip: '⏭' }[nodeModulesCheck.status] || '?';
  out(`- **node_modules 完全性 (S9)**: ${nmIcon} ${nodeModulesCheck.note}`);
  const mdIcon = { ok: '✅', warn: '⚠️', ng: '❌', skip: '⏭' }[mcpDormancyCheck.status] || '?';
  out(`- **MCP 死蔵検知 (S12)**: ${mdIcon} ${mcpDormancyCheck.note}`);
  const gsIcon = { ok: '✅', ng: '❌', skip: '⏭' }[gitStatusCheck.status] || '?';
  out(`- **Git ahead/behind (S15)**: ${gsIcon} ${gitStatusCheck.note}`);
  const rwIcon = { ok: '✅', warn: '⚠️' }[ruleWatcherCheck.status] || '?';
  out(`- **憲法ファイル watcher (S16 / K-3)**: ${rwIcon} ${ruleWatcherCheck.note}`);
}
out('');

if (ragDeepCheck) {
  out('### 🔎 rag MCP DB 内容チェック (TSB-012 再発防止)');
  out('');
  const icon = ragDeepCheck.status === 'ok' ? '✅' : '❌';
  out(`- ${icon} ${ragDeepCheck.note}`);
  if (ragDeepCheck.status === 'ng' && ragDeepCheck.config_issues.length > 0) {
    out('');
    out('> **対策**: `~/.cursor/mcp.json` の rag セクションで `env.DB_PATH` と `env.CACHE_DIR` を絶対パスで設定し、`args` から `--db-path` / `--cache-dir` は削除する。理由: mcp-local-rag v0.13.0 server mode は CLI 引数を無視し env vars のみ参照するため (TSB-012 詳細)。');
  }
  out('');
}

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
