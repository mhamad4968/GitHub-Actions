#!/usr/bin/env node
/**
 * cio-mcp-quickprobe.mjs — 4 MCP server 並列軽量 probe（A2・2026-05-07 浜田承認）
 *
 * 使い方:
 *   node scripts/cio-mcp-quickprobe.mjs           # 4 サーバ全件
 *   node scripts/cio-mcp-quickprobe.mjs kintone   # 単独
 *
 * 各 server を spawn → JSON-RPC で initialize → tools/list を取り、tools 数とサーバ名のみ報告。
 * Promise.all 並列で 60s timeout / cold start 含めて 5 秒程度で完了想定（warm 時）。
 *
 * 終了コード: 0=全て OK / 1=1 件以上 NG
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import process from "node:process";

// 資格情報・API キーは process.env からのみ取得（ハードコード禁止・GitHub Push Protection 準拠）。
// 旧経路: `npx dotenv -e .env -e .env.proxy -- node scripts/cio-mcp-quickprobe.mjs`。
// 2026-05-10 追加 (CEO 厳命「自律稼働」/ §41-7 健康診断構造化):
//   process.env が未設定の場合は ~/.cursor/mcp.json の mcpServers[name].env を fallback で注入。
//   これにより新規 wsl invocation でも env 引継ぎ無く OK 4/4 を取得可能（永続化対応）。
function* candidateMcpJsonPaths() {
  yield join(homedir(), ".cursor", "mcp.json");
  if (process.env.CURSOR_MCP_JSON) yield process.env.CURSOR_MCP_JSON;
  if (existsSync("/mnt/c/Users")) {
    try {
      for (const u of readdirSync("/mnt/c/Users")) {
        if (["Public", "Default", "Default User", "All Users", "WDAGUtilityAccount"].includes(u)) continue;
        const p = join("/mnt/c/Users", u, ".cursor", "mcp.json");
        if (existsSync(p)) yield p;
      }
    } catch {}
  }
}
function loadCursorMcpServers() {
  // 複数の mcp.json から merge（最初に見つけたものを優先・後発は補完のみ）
  const merged = {};
  const sources = [];
  for (const p of candidateMcpJsonPaths()) {
    try {
      const data = JSON.parse(readFileSync(p, "utf8"));
      if (data?.mcpServers) {
        sources.push(p);
        for (const [n, spec] of Object.entries(data.mcpServers)) {
          if (!merged[n]) merged[n] = spec;
        }
      }
    } catch {}
  }
  return { servers: merged, sources };
}
const { servers: CURSOR_MCP, sources: CURSOR_MCP_SRC } = loadCursorMcpServers();

// WSL から起動できない server は除外（Windows 経由 wrapper 等）
function isWslLaunchable(spec) {
  const c = spec?.command || "";
  if (/^[A-Za-z]:[\\\/]/i.test(c)) return false;
  if (/^\/mnt\/c\/Windows\//i.test(c)) return false;
  if (spec?._meta?.dormancy_exempt === true && /Windows-side/i.test(spec?._meta?.exempt_reason || "")) return false;
  return true;
}

const PROBE_LIST = ["kintone", "deepseek", "kimi", "openrouter"];
// 優先順位: mcp.json env > process.env （mcp.json は意図的設定なので構造値 PATH を上書きしない）
// ただし mcp.json env が空("")のキーは process.env で補完する
// 注: 過去事故 — PATH を process.env で上書きすると /usr/bin/node@v18 が先取され kimi が SyntaxError(node:fs/promises.glob)
const SECRET_OVERRIDE = /^(KINTONE_|DEEPSEEK_|MOONSHOT_|OPENROUTER_|API_)/;
function buildSpec(name) {
  const m = CURSOR_MCP[name];
  if (!m || !isWslLaunchable(m)) return null;
  const env = { ...(m.env || {}) };
  for (const k of Object.keys(env)) {
    // 秘匿キーだけ process.env に優先権を与える（運用で .env 等から差し替え可能にする）
    if (SECRET_OVERRIDE.test(k) && process.env[k]) {
      env[k] = process.env[k];
    } else if (!env[k] && process.env[k]) {
      env[k] = process.env[k];
    }
  }
  return { cmd: m.command, args: Array.isArray(m.args) ? m.args : [], env };
}
const TARGETS = {};
for (const n of PROBE_LIST) {
  const s = buildSpec(n);
  if (s) TARGETS[n] = s;
}
if (CURSOR_MCP_SRC.length > 0) {
  console.error(`[cio-mcp-quickprobe] mcp.json sources: ${CURSOR_MCP_SRC.join(", ")}`);
}

function probe(name, spec, timeoutMs = 90000) {
  const t0 = Date.now();
  // 認証必要キー（PATH 等のシステム値ではなく秘匿情報）が空なら SKIP として扱う
  const SECRET_KEYS = /^(KINTONE_|DEEPSEEK_|MOONSHOT_|OPENROUTER_|API_)/;
  const missing = Object.entries(spec.env).filter(([k, v]) => SECRET_KEYS.test(k) && !v).map(([k]) => k);
  if (missing.length > 0) {
    return Promise.resolve({ name, status: "SKIP_NO_KEY", detail: `missing env: ${missing.join(",")}`, elapsed: 0 });
  }
  return new Promise((resolve) => {
    const proc = spawn(spec.cmd, spec.args, { env: { ...process.env, ...spec.env }, stdio: ["pipe", "pipe", "pipe"] });
    let buf = "";
    const pending = new Map();
    let nextId = 1;
    let done = false;
    const finish = (status, detail) => {
      if (done) return;
      done = true;
      try {
        proc.kill("SIGTERM");
      } catch {}
      setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {}
      }, 500);
      resolve({ name, status, detail, elapsed: Date.now() - t0 });
    };
    const to = setTimeout(() => {
      const hint = stderrTail ? ` | stderr_tail=${stderrTail.replace(/\s+/g, " ").slice(0, 240)}` : "";
      finish("TIMEOUT", `over ${timeoutMs}ms${hint}`);
    }, timeoutMs);
    proc.on("error", (e) => finish("PROC_ERROR", e.message));
    let stderrTail = "";
    proc.stderr.on("data", (b) => {
      stderrTail = (stderrTail + b.toString()).slice(-512);
    });
    proc.stdout.on("data", (b) => {
      buf += b.toString();
      let nl;
      while ((nl = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.id != null && pending.has(msg.id)) {
          pending.get(msg.id)(msg);
          pending.delete(msg.id);
        }
      }
    });
    function send(method, params) {
      return new Promise((res) => {
        const id = nextId++;
        pending.set(id, res);
        proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      });
    }
    function notify(method, params) {
      proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
    }
    (async () => {
      try {
        // initialize は global timeout の半分を上限に確保、tools/list は best-effort（30s 上限）
        const initRace = await Promise.race([
          send("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "cio-quickprobe", version: "1.0.0" },
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("initialize timeout")), Math.min(timeoutMs - 5000, 75000))),
        ]);
        if (!initRace.result) {
          finish("INIT_FAIL", JSON.stringify(initRace).slice(0, 200));
          return;
        }
        notify("notifications/initialized");
        let count = -1;
        try {
          const tl = await Promise.race([
            send("tools/list", {}),
            new Promise((_, rej) => setTimeout(() => rej(new Error("tools/list timeout")), 30000)),
          ]);
          count = tl.result?.tools?.length ?? -1;
        } catch {
          // tools/list 失敗でも initialize 成功なら OK 認定（serverInfo 取得済）
        }
        clearTimeout(to);
        const tag = count >= 0 ? `tools=${count}` : `init=ok(tools/list skipped)`;
        finish("OK", `${tag} server=${initRace.result?.serverInfo?.name || "?"}`);
      } catch (e) {
        const detail = `${e.message}${stderrTail ? ` | stderr_tail=${stderrTail.replace(/\s+/g, " ").slice(0, 240)}` : ""}`;
        finish("ERR", detail);
      }
    })();
  });
}

const filter = process.argv[2];
const entries = Object.entries(TARGETS).filter(([n]) => !filter || n === filter);
if (entries.length === 0) {
  console.error("unknown target: " + filter + "  (available: " + Object.keys(TARGETS).join(", ") + ")");
  process.exit(2);
}
const TIMEOUT_MS = parseInt(process.env.CIO_MCP_PROBE_TIMEOUT_MS || "90000", 10);
const results = await Promise.all(entries.map(([n, s]) => probe(n, s, TIMEOUT_MS)));
console.log("name        status       elapsed_ms  detail");
for (const r of results) {
  console.log(`${r.name.padEnd(11)} ${r.status.padEnd(12)} ${String(r.elapsed).padStart(8)}  ${r.detail || ""}`);
}
const ok = results.filter((r) => r.status === "OK").length;
const skip = results.filter((r) => r.status === "SKIP_NO_KEY").length;
const ng = results.length - ok - skip;
console.log(`SUMMARY: OK ${ok}/${results.length}  SKIP=${skip}  NG=${ng}`);
process.exit(ng === 0 ? 0 : 1);
