#!/usr/bin/env node
/**
 * GET /k/v1/space.json?id= — Content-Type なしで疎通（stdout は status + body 先頭のみ）。
 */
import "dotenv/config";

const base = (process.env.KINTONE_BASE_URL || "").replace(/\/$/, "");
const user = process.env.KINTONE_USERNAME;
const pass = process.env.KINTONE_PASSWORD;
const id = process.argv[2] || "48";

if (!base || !user || !pass) {
  console.error("missing KINTONE_BASE_URL / KINTONE_USERNAME / KINTONE_PASSWORD");
  process.exit(2);
}

const auth = Buffer.from(`${user}:${pass}`).toString("base64");
const url = `${base}/k/v1/space.json?id=${encodeURIComponent(id)}`;
const res = await fetch(url, {
  method: "GET",
  headers: { "X-Cybozu-Authorization": auth },
});
const text = await res.text();
console.log("status", res.status);
console.log(text.slice(0, 500));
