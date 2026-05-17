#!/usr/bin/env node
/**
 * Cybozu に AI 専用ユーザを作成（admin 資格で実行・CEO GO 後）
 *
 * 出力: temp/kintone_ai_user.env（gitignore）— パスワードはログに出さない
 * 用法: npx dotenv -e .env -e .env.proxy -- node scripts/create-kintone-ai-user.mjs
 *       --dry-run  作成せず手順のみ
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "temp", "kintone_ai_user.env");
const CODE = (process.env.KINTONE_AI_USER_CODE || "cio_ai").trim();
const DRY = process.argv.includes("--dry-run");

const base = (process.env.KINTONE_BASE_URL || "").replace(/\/$/, "");
const adminUser = process.env.KINTONE_USERNAME;
const adminPass = process.env.KINTONE_PASSWORD;

if (!base || !adminUser || !adminPass) {
  console.error("[create-kintone-ai-user] NG: KINTONE_BASE_URL / KINTONE_USERNAME / KINTONE_PASSWORD が必要");
  process.exit(2);
}

const auth = Buffer.from(`${adminUser}:${adminPass}`).toString("base64");
const headers = {
  "X-Cybozu-Authorization": auth,
  "Content-Type": "application/json",
};

async function userExists(code) {
  const url = `${base}/v1/users.json?codes[]=${encodeURIComponent(code)}`;
  const res = await fetch(url, { headers: { "X-Cybozu-Authorization": auth } });
  if (!res.ok) return false;
  const j = await res.json();
  return Array.isArray(j.users) && j.users.length > 0;
}

function genPassword() {
  return crypto.randomBytes(18).toString("base64url");
}

async function createUser(code, password) {
  const res = await fetch(`${base}/v1/users.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      users: [
        {
          code,
          password,
          name: "CIO AI",
          surName: "CIO",
          givenName: "AI",
          timezone: "Asia/Tokyo",
          locale: "ja",
        },
      ],
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST /v1/users.json ${res.status}: ${text.slice(0, 300)}`);
  }
}

if (DRY) {
  console.log("[create-kintone-ai-user] DRY-RUN: would create code=", CODE);
  console.log("  → then set app permissions in cybozu.com admin (see docs/runbooks/kintone-ai-dedicated-user.md)");
  process.exit(0);
}

if (await userExists(CODE)) {
  console.log("[create-kintone-ai-user] user already exists:", CODE);
  if (!fs.existsSync(OUT)) {
    console.error(
      "  → temp/kintone_ai_user.env がありません。既存ユーザのパスワードを CEO が手元で設定し、",
      "     KINTONE_AI_USERNAME / KINTONE_AI_PASSWORD を temp/kintone_ai_user.env に書いて apply を実行してください。",
    );
    process.exit(1);
  }
  process.exit(0);
}

const password = genPassword();
await createUser(CODE, password);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const body = [
  "# AI 専用 kintone ユーザ（gitignore・共有禁止）",
  `KINTONE_AI_USERNAME=${CODE}`,
  `KINTONE_AI_PASSWORD=${password}`,
  `KINTONE_USERNAME=${CODE}`,
  `KINTONE_PASSWORD=${password}`,
  "",
].join("\n");
fs.writeFileSync(OUT, body, { encoding: "utf8", mode: 0o600 });

console.log("[create-kintone-ai-user] OK created:", CODE);
console.log("[create-kintone-ai-user] credentials written:", OUT);
console.log(
  "  → 次: cybozu.com 管理画面でアプリ権限を付与 → npm run kintone:ai-user:apply-mcp → npm run kintone:ai-user:verify",
);
