#!/usr/bin/env node
/**
 * cio-mcp-quickprobe.mjs — CIO／マルチエージェント向け MCP 軽量 probe（initialize + tools/list）
 *
 * 使い方:
 *   node scripts/cio-mcp-quickprobe.mjs           # 全ターゲット
 *   node scripts/cio-mcp-quickprobe.mjs kintone   # 単独
 *
 * **CIO 判断（2026-05-10）**: 3AI・kintone の資格情報は **process.env を正**とするが、
 * **未設定なら `%USERPROFILE%\.cursor\mcp.json` とリポ `.cursor/mcp.json` の server.env をマージ**（値は **ログに出さない**）。
 * マージ後も不足なら **SKIP せず exit 2**（自律マルチエージェント運用として未整備とみなす）。
 *
 * 終了コード: 0=全て OK / 1=initialize 等の失敗 / 2=必須 env 欠落
 *
 * **WSL + `/mnt/...`（drvfs）**: `npx` が **リポの cwd（drvfs）** だと極端に遅い。**`cwd=$HOME`（ext4）** ＋ **`NPM_CONFIG_CACHE=$HOME/.npm`** で I/O を Linux 側へ寄せる（DeepSeek §50-3-8 突合）。
 * - 既定: drvfs 検出時 **全ターゲット +60s**（合計 120s）に加え、**kimi のみ WSL+drvfs で最低 480s**（並列 npx 競合・API 遅延の余裕。`CIO_MCP_PROBE_KIMI_TIMEOUT_MS` で上書き）
 * - drvfs 時は **Promise.all ではなく直列 probe**（帯域・npm レジストリの同時叩きを避ける）
 * - 上書き: **`CIO_MCP_PROBE_TIMEOUT_MS`**、**`CIO_MCP_PROBE_KIMI_TIMEOUT_MS`**
 * - 再試行: **`CIO_MCP_PROBE_RETRY_ON_TIMEOUT=1`**（既定）で TIMEOUT 時 **1 回だけ**再 probe。`0` で無効
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { fillMissingApprovedAiEnv } from "./lib/mcp-ai-secret-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** dotenv のあと、未設定キーを mcp.json の server.env で埋める（**先: ユーザ → 次: リポ**。平文は stdout に出さない） */
function applyCioEnvFromMcpJson() {
  const setIf = (envKey, val) => {
    if (val != null && String(val) !== "" && !process.env[envKey]) process.env[envKey] = String(val);
  };
  const files = [
    path.join(process.env.USERPROFILE || process.env.HOME || "", ".cursor", "mcp.json"),
    path.join(root, ".cursor", "mcp.json"),
  ];
  for (const f of files) {
    if (!f || !fs.existsSync(f)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(f, "utf8"));
      const s = j.mcpServers || {};
      const ke = s.kintone?.env;
      if (ke) {
        setIf("KINTONE_BASE_URL", ke.KINTONE_BASE_URL);
        setIf("KINTONE_USERNAME", ke.KINTONE_USERNAME);
        setIf("KINTONE_PASSWORD", ke.KINTONE_PASSWORD);
      }
      const kse = s["kintone-space"]?.env;
      if (kse) {
        setIf("KINTONE_BASE_URL", kse.KINTONE_BASE_URL);
        setIf("KINTONE_USERNAME", kse.KINTONE_USERNAME);
        setIf("KINTONE_PASSWORD", kse.KINTONE_PASSWORD);
      }
      setIf("MOONSHOT_API_KEY", s.kimi?.env?.MOONSHOT_API_KEY);
      setIf("DEEPSEEK_API_KEY", s.deepseek?.env?.DEEPSEEK_API_KEY);
      setIf("OPENROUTER_API_KEY", s.openrouter?.env?.OPENROUTER_API_KEY);
    } catch {
      /* ignore */
    }
  }
}

applyCioEnvFromMcpJson();
try {
  fillMissingApprovedAiEnv(process.env);
} catch {
  // Keep the existing missing-env NG path when secure storage is unavailable or invalid.
}

/** `/mnt/c/...` 等 drvfs 上のリポで、WSL 上の Node から実行されているか */
function isWslDrvfsRepo(repoRoot) {
  if (process.platform !== "linux") return false;
  const norm = path.resolve(repoRoot);
  if (!norm.startsWith("/mnt/")) return false;
  try {
    const v = fs.readFileSync("/proc/version", "utf8");
    return /Microsoft|WSL/i.test(v);
  } catch {
    return false;
  }
}

/** 1 サーバーあたりの probe タイムアウト（ms） */
function getProbeTimeoutMs() {
  const raw = process.env.CIO_MCP_PROBE_TIMEOUT_MS;
  if (raw != null && String(raw).trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 5000) return Math.floor(n);
  }
  let ms = 60000;
  if (isWslDrvfsRepo(root)) ms += 60000;
  return ms;
}

function retryOnTimeoutEnabled() {
  const v = process.env.CIO_MCP_PROBE_RETRY_ON_TIMEOUT;
  if (v == null || String(v).trim() === "") return true;
  return !/^(0|false|no)$/i.test(String(v).trim());
}

/** drvfs 上のリポから実行するとき、子プロセスの cwd / npm キャッシュを ext4 へ */
function wslDrvfsSpawnTuning() {
  if (!isWslDrvfsRepo(root)) return {};
  const home = process.env.HOME;
  if (home && fs.existsSync(home)) {
    return {
      cwd: home,
      extraEnv: { NPM_CONFIG_CACHE: path.join(home, ".npm") },
    };
  }
  return {
    cwd: "/tmp",
    extraEnv: { NPM_CONFIG_CACHE: "/tmp/.npm-cio-mcp-probe" },
  };
}

/** ターゲット別（WSL+drvfs の kimi だけ長め） */
function timeoutMsForTarget(name, baseMs) {
  if (name !== "kimi") return baseMs;
  const kRaw = process.env.CIO_MCP_PROBE_KIMI_TIMEOUT_MS;
  if (kRaw != null && String(kRaw).trim() !== "") {
    const kn = Number(kRaw);
    if (Number.isFinite(kn) && kn >= 5000) return Math.floor(kn);
  }
  if (isWslDrvfsRepo(root)) return Math.max(baseMs, 480000);
  return baseMs;
}

/** kimi 向け DNS（WSL 経路の IPv6 不調時の切り分け） */
function extraEnvForTarget(name) {
  if (name === "kimi" && isWslDrvfsRepo(root)) {
    const prev = process.env.NODE_OPTIONS || "";
    const add = "--dns-result-order=ipv4first";
    return {
      NODE_OPTIONS: prev.includes("dns-result-order") ? prev : `${prev} ${add}`.trim(),
    };
  }
  return {};
}

/** `--extended` 時のみ（Composer 実務系・registry 必須10 のうち未 probe 分） */
const EXTENDED_TARGETS = {
  playwright: {
    cmd: "npx",
    args: ["-y", "@playwright/mcp@latest"],
    env: {},
  },
  markdownify: {
    cmd: "npx",
    args: ["-y", "@iflow-mcp/markdownify-mcp@0.0.2"],
    env: {},
  },
  "duckduckgo-search": {
    cmd: "npx",
    args: ["-y", "duckduckgo-mcp-server"],
    env: { DDG_REGION: process.env.DDG_REGION || "jp-ja" },
  },
};

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
    // 2026-07-25: do not probe mcp-deepseek@latest (defaults deepseek-chat → API 400)
    cmd: process.execPath,
    args: [path.join(root, "scripts", "mcp-deepseek-v4", "entry.mjs")],
    env: {
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
      DEEPSEEK_DEFAULT_MODEL:
        process.env.DEEPSEEK_DEFAULT_MODEL || "deepseek-v4-flash",
    },
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
  memory: {
    cmd: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    env: {},
  },
  "sequential-thinking": {
    cmd: "npx",
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    env: {},
  },
};

function probeOnce(name, spec, timeoutMs) {
  const t0 = Date.now();
  const missing = Object.entries(spec.env).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    return Promise.resolve({
      name,
      status: "NG",
      detail: `missing env after approved source merge: ${missing.join(",")}`,
      elapsed: 0,
    });
  }
  return new Promise((resolve) => {
    const tune = wslDrvfsSpawnTuning();
    const spawnOpts = {
      env: { ...process.env, ...spec.env, ...tune.extraEnv, ...extraEnvForTarget(name) },
      stdio: ["pipe", "pipe", "pipe"],
      // Windows の `.cmd` は直接 spawn できないため、固定引数で cmd.exe を明示起動する。
      shell: false,
    };
    if (tune.cwd) spawnOpts.cwd = tune.cwd;
    const isWindowsNpx = process.platform === "win32" && spec.cmd === "npx";
    const command = isWindowsNpx ? process.env.ComSpec || "cmd.exe" : spec.cmd;
    const args = isWindowsNpx ? ["/d", "/s", "/c", "npx.cmd", ...spec.args] : spec.args;
    const proc = spawn(command, args, spawnOpts);
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

/** Windows では markdownify は WSL 直起動が正（TSB-029）。npx 拡張 probe は SKIP。 */
function maybeSkipExtendedOnWindows(name) {
  if (process.platform !== "win32") return null;
  if (name === "markdownify") {
    return {
      name,
      status: "SKIP",
      detail: "Windows: WSL mcp.json TSB-029 node launch (npx @iflow-mcp unsafe here)",
      elapsed: 0,
    };
  }
  return null;
}

async function probe(name, spec, timeoutMs) {
  const skip = maybeSkipExtendedOnWindows(name);
  if (skip) return skip;
  let r = await probeOnce(name, spec, timeoutMs);
  if (r.status === "TIMEOUT" && retryOnTimeoutEnabled()) {
    console.error(
      `[cio-mcp-quickprobe] WARN target=${name} TIMEOUT first=${r.elapsed}ms → single retry (timeoutMs=${timeoutMs})`,
    );
    const r2 = await probeOnce(name, spec, timeoutMs);
    if (r2.status === "OK") {
      return {
        ...r2,
        detail: `${r2.detail || ""} (retry-after-timeout; first=${r.elapsed}ms)`,
      };
    }
    return {
      ...r2,
      detail: `${r2.detail || ""} (retry-after-timeout-failed; first=${r.elapsed}ms)`,
    };
  }
  return r;
}

const useExtended = process.argv.includes("--extended");
const probeMap = useExtended ? { ...TARGETS, ...EXTENDED_TARGETS } : TARGETS;
const filter = process.argv.find(
  (a) =>
    a !== "--extended" &&
    !a.startsWith("-") &&
    !/[\\/]/.test(a) &&
    Object.prototype.hasOwnProperty.call(probeMap, a),
);
const entries = Object.entries(probeMap).filter(([n]) => !filter || n === filter);
if (entries.length === 0) {
  console.error(
    "unknown target: " + filter + "  (available: " + Object.keys(probeMap).join(", ") + ")",
  );
  process.exit(2);
}

const timeoutMs = getProbeTimeoutMs();
if (isWslDrvfsRepo(root) && !process.env.CIO_MCP_PROBE_TIMEOUT_MS) {
  const t = wslDrvfsSpawnTuning();
  console.error(
    `[cio-mcp-quickprobe] WSL+drvfs detected → cwd=${t.cwd || "(default)"} NPM_CONFIG_CACHE=${t.extraEnv?.NPM_CONFIG_CACHE || ""} baseTimeoutMs=${timeoutMs} kimiFloorMs=480000 serialProbes=true`,
  );
}
const results = isWslDrvfsRepo(root)
  ? await (async () => {
      const acc = [];
      for (const [n, s] of entries) {
        acc.push(await probe(n, s, timeoutMsForTarget(n, timeoutMs)));
      }
      return acc;
    })()
  : await Promise.all(entries.map(([n, s]) => probe(n, s, timeoutMsForTarget(n, timeoutMs))));
console.log("name        status       elapsed_ms  detail");
for (const r of results) {
  console.log(`${r.name.padEnd(11)} ${r.status.padEnd(12)} ${String(r.elapsed).padStart(8)}  ${r.detail || ""}`);
}
const ok = results.filter((r) => r.status === "OK").length;
const skip = results.filter((r) => r.status === "SKIP").length;
const ng = results.filter((r) => r.status !== "OK" && r.status !== "SKIP").length;
console.log(`SUMMARY: OK ${ok}/${results.length}  SKIP=${skip}  NG=${ng}`);
const exitMissing = results.some((r) => r.status === "NG" && r.detail?.includes("missing env"));
if (ng === 0 && useExtended && !filter) {
  const layer12Script = path.join(root, "scripts", "verify-cio-mcp-layer12-probe.mjs");
  const l12 = spawnSync(process.execPath, [layer12Script], { cwd: root, encoding: "utf8", stdio: "inherit" });
  if (l12.status !== 0) {
    console.error("[cio-mcp-quickprobe] NG layer12 probe (kintone-schema-mcp / git-history-mcp)");
    process.exit(1);
  }
  console.log("[cio-mcp-quickprobe] OK layer12 MCP initialize (extended)");
}
process.exit(ng === 0 ? 0 : exitMissing ? 2 : 1);
