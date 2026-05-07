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
import process from "node:process";

// 資格情報・API キーは process.env からのみ取得（ハードコード禁止・GitHub Push Protection 準拠）
// 呼び出し側は `npx dotenv -e .env -e .env.proxy -- node scripts/cio-mcp-quickprobe.mjs` 等で env を注入する。
// env が未設定の MCP は SKIP_NO_KEY として扱う。
const TARGETS = {
  kintone: {
    cmd: "npx",
    args: ["-y", "@kintone/mcp-server@latest"],
    env: {
      KINTONE_BASE_URL: process.env.KINTONE_BASE_URL,
      KINTONE_USERNAME: process.env.KINTONE_USERNAME,
      KINTONE_PASSWORD: process.env.KINTONE_PASSWORD,
    },
  },
  deepseek: {
    cmd: "npx",
    args: ["-y", "mcp-deepseek@latest"],
    env: { DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY },
  },
  kimi: {
    cmd: "npx",
    args: ["-y", "kimi-api-mcp@latest"],
    env: { MOONSHOT_API_KEY: process.env.MOONSHOT_API_KEY },
  },
  openrouter: {
    cmd: "npx",
    args: ["-y", "@mcpservers/openrouterai@latest"],
    env: { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY },
  },
};

function probe(name, spec, timeoutMs = 60000) {
  const t0 = Date.now();
  // env のいずれかが空（未注入）なら SKIP として扱う
  const missing = Object.entries(spec.env).filter(([, v]) => !v).map(([k]) => k);
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
    const to = setTimeout(() => finish("TIMEOUT", `over ${timeoutMs}ms`), timeoutMs);
    proc.on("error", (e) => finish("PROC_ERROR", e.message));
    proc.stderr.on("data", () => {});
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
        const init = await send("initialize", {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "cio-quickprobe", version: "1.0.0" },
        });
        if (!init.result) {
          finish("INIT_FAIL", JSON.stringify(init).slice(0, 200));
          return;
        }
        notify("notifications/initialized");
        const tl = await send("tools/list", {});
        const count = tl.result?.tools?.length ?? -1;
        clearTimeout(to);
        finish("OK", `tools=${count} server=${init.result?.serverInfo?.name || "?"}`);
      } catch (e) {
        finish("ERR", e.message);
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
const results = await Promise.all(entries.map(([n, s]) => probe(n, s, 60000)));
console.log("name        status       elapsed_ms  detail");
for (const r of results) {
  console.log(`${r.name.padEnd(11)} ${r.status.padEnd(12)} ${String(r.elapsed).padStart(8)}  ${r.detail || ""}`);
}
const ok = results.filter((r) => r.status === "OK").length;
const skip = results.filter((r) => r.status === "SKIP_NO_KEY").length;
const ng = results.length - ok - skip;
console.log(`SUMMARY: OK ${ok}/${results.length}  SKIP=${skip}  NG=${ng}`);
process.exit(ng === 0 ? 0 : 1);
