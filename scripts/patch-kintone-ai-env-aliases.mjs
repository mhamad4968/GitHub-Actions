#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  "temp",
  "kintone_ai_user.env",
);
if (!fs.existsSync(p)) process.exit(2);
let t = fs.readFileSync(p, "utf8");
if (/^KINTONE_USERNAME=/m.test(t)) {
  console.log("[patch] already has KINTONE_USERNAME");
  process.exit(0);
}
const m = t.match(/^KINTONE_AI_USERNAME=(.+)$/m);
const pw = t.match(/^KINTONE_AI_PASSWORD=(.+)$/m);
if (!m || !pw) process.exit(1);
t += `KINTONE_USERNAME=${m[1]}\nKINTONE_PASSWORD=${pw[1]}\n`;
fs.writeFileSync(p, t);
console.log("[patch] OK added KINTONE_USERNAME aliases");
