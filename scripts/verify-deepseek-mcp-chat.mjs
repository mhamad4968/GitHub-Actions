#!/usr/bin/env node
/**
 * DeepSeek v4 実 chat 非空証明（#S-DS-EMPTY-01）
 *
 * 午前の「无响应」再発条件:
 *   thinking 既定 ON + max_tokens≈400 → reasoning だけで finish=length・content=""
 *
 * 本検査:
 *   1) ラッパ同等（thinking disabled + maxTokens 400）で日本語短問 → content 非空
 *   2) （任意）--prove-bug: thinking enabled + 400 で content 空を実測（回帰ドキュメント）
 *
 * 鍵: DEEPSEEK_API_KEY / .env / WSL ai-secrets.env
 * exit 0=OK / 2=NG / 3=鍵なしスキップ（--require-live で 2）
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildChatBody, extractAssistantText } from "./mcp-deepseek-v4/lib-reply.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const proveBug = argv.includes("--prove-bug");
const requireLive = argv.includes("--require-live");

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(p, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

function loadKeyFromWslSecrets() {
  const r = spawnSync(
    "wsl.exe",
    [
      "-d",
      "Ubuntu",
      "-e",
      "bash",
      "-lc",
      "set -a; source /home/mhamada202408224/.config/cursor-mcp/ai-secrets.env; set +a; printf %s \"$DEEPSEEK_API_KEY\"",
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return "";
  return String(r.stdout || "").trim();
}

function resolveKey() {
  const fromEnv = {
    ...loadEnvFile(path.join(root, ".env")),
    ...loadEnvFile(path.join(root, ".env.proxy")),
    ...process.env,
  };
  return (
    String(fromEnv.DEEPSEEK_API_KEY || "").trim() ||
    loadKeyFromWslSecrets() ||
    ""
  );
}

async function callApi(key, body) {
  const base = (process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com").replace(
    /\/$/,
    "",
  );
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { res, json };
}

const key = resolveKey();
if (!key) {
  const msg =
    "[verify:deepseek-mcp-chat] NO KEY — set DEEPSEEK_API_KEY or WSL ai-secrets.env";
  if (requireLive) {
    console.error(msg);
    process.exit(2);
  }
  console.warn(msg + " (skip live)");
  process.exit(3);
}

const prompt =
  "【§50-3-8 盲点3点】短いテスト。盲点を(a)(b)(c)で各1行。最後に OK-DS-CHAT と書け。";

const goodBody = buildChatBody({
  model: process.env.DEEPSEEK_DEFAULT_MODEL || "deepseek-v4-flash",
  message: prompt,
  maxTokens: 400,
  thinking: { type: "disabled" },
  temperature: 0.2,
});

const { res, json } = await callApi(key, goodBody);
if (!res.ok) {
  console.error(
    "[verify:deepseek-mcp-chat] NG API",
    res.status,
    json?.error?.message || JSON.stringify(json).slice(0, 200),
  );
  process.exit(2);
}
const choice = json.choices?.[0];
const extracted = extractAssistantText(choice?.message, {
  finish_reason: choice?.finish_reason,
  usage: json.usage,
});
if (!extracted.ok || extracted.mode !== "content") {
  console.error("[verify:deepseek-mcp-chat] NG empty/non-content", {
    finish: choice?.finish_reason,
    mode: extracted.mode,
    usage: json.usage,
    preview: String(extracted.text).slice(0, 160),
  });
  process.exit(2);
}
if (/^无响应$/.test(extracted.text.trim())) {
  console.error("[verify:deepseek-mcp-chat] NG literal 无响应");
  process.exit(2);
}
if (!/OK-DS-CHAT/i.test(extracted.text) && extracted.text.length < 20) {
  console.error("[verify:deepseek-mcp-chat] NG reply too short", extracted.text);
  process.exit(2);
}
console.log(
  "[verify:deepseek-mcp-chat] OK thinking=disabled maxTokens=400 contentLen=",
  extracted.text.length,
);

if (proveBug) {
  const bugBody = buildChatBody({
    model: process.env.DEEPSEEK_DEFAULT_MODEL || "deepseek-v4-flash",
    message: prompt,
    maxTokens: 400,
    thinking: { type: "enabled" },
  });
  const bug = await callApi(key, bugBody);
  const bugChoice = bug.json.choices?.[0];
  const bugContent = String(bugChoice?.message?.content || "").trim();
  const bugFinish = bugChoice?.finish_reason;
  const rTokens =
    bug.json.usage?.completion_tokens_details?.reasoning_tokens ?? null;
  if (bugContent === "" && bugFinish === "length") {
    console.log(
      "[verify:deepseek-mcp-chat] prove-bug OK — thinking=enabled maxTokens=400 → content空 (reasoning_tokens=",
      rTokens,
      ")",
    );
  } else {
    console.warn(
      "[verify:deepseek-mcp-chat] prove-bug WARN unexpected",
      { bugFinish, bugContentLen: bugContent.length, rTokens },
    );
  }
}

process.exit(0);
