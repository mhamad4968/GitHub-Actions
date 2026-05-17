#!/usr/bin/env node
/**
 * AI 専用 kintone ユーザの検証（admin 経路でないこと・代表 API 疎通）
 *
 * 用法: npm run kintone:ai-user:verify
 */
import "dotenv/config";

const DENY_CODES = new Set(
  (process.env.KINTONE_AI_DENY_CODES || "admin,Administrator,administrator")
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean),
);

const base = (process.env.KINTONE_BASE_URL || "").replace(/\/$/, "");
const user = process.env.KINTONE_AI_USERNAME || process.env.KINTONE_USERNAME;
const pass = process.env.KINTONE_AI_PASSWORD || process.env.KINTONE_PASSWORD;
/** 未設定ならログイン名の強制一致はしない（部署管理アカウント運用） */
const expect = (process.env.KINTONE_AI_USER_CODE || "").trim();

if (!base || !user || !pass) {
  console.error("[verify-kintone-ai-user] NG: KINTONE_* env missing");
  process.exit(2);
}

let fail = 0;

if (DENY_CODES.has(user) || /^admin$/i.test(user)) {
  console.error("[verify-kintone-ai-user] NG: still using admin-class login:", user);
  fail++;
} else if (expect && user !== expect) {
  console.warn(
    "[verify-kintone-ai-user] WARN: login code",
    user,
    "!= expected",
    expect,
    "(意図的なら KINTONE_AI_USER_CODE で上書き)",
  );
} else {
  console.log("[verify-kintone-ai-user] OK login code:", user);
}

const auth = Buffer.from(`${user}:${pass}`).toString("base64");
const hdr = { "X-Cybozu-Authorization": auth };

async function probe(label, url) {
  const res = await fetch(url, { headers: hdr });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[verify-kintone-ai-user] NG ${label} HTTP`, res.status);
    fail++;
    return;
  }
  try {
    JSON.parse(text);
    console.log(`[verify-kintone-ai-user] OK ${label}`);
  } catch {
    console.error(`[verify-kintone-ai-user] NG ${label} not JSON`);
    fail++;
  }
}

await probe("app 685", `${base}/k/v1/app.json?id=685`);
await probe("space 48", `${base}/k/v1/space.json?id=48`);

/** customize 反映 API は AI ユーザに不許可であるべき（403/401 なら OK） */
const prev = await fetch(`${base}/k/v1/preview/app/customize.json`, {
  method: "GET",
  headers: hdr,
});
if (prev.status === 200) {
  console.warn(
    "[verify-kintone-ai-user] WARN: preview customize GET returned 200 — confirm AI user lacks deploy rights",
  );
} else {
  console.log("[verify-kintone-ai-user] OK customize preview not openly writable:", prev.status);
}

process.exit(fail ? 1 : 0);
