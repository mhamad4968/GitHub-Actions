#!/usr/bin/env node
/**
 * AGENTS.md の § 見出しが docs/constitution/*.md に欠落していないか検査
 * 用法: npm run constitution:verify-coverage
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
const dir = path.join(root, "docs", "constitution");

const sectionRe = /^### (§[\d][\d\w.-]*)/gm;
const agentsSections = new Set();
let m;
while ((m = sectionRe.exec(agents)) !== null) agentsSections.add(m[1]);

const genreFiles = fs
  .readdirSync(dir)
  .filter((f) => /^\d{2}-.*\.md$/.test(f))
  .sort();
const genreText = genreFiles.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");

const missing = [];
for (const sec of agentsSections) {
  if (!genreText.includes(sec)) missing.push(sec);
}

console.log("[verify-constitution-genre-coverage] AGENTS § count:", agentsSections.size);
console.log("[verify-constitution-genre-coverage] genre files:", genreFiles.length);
if (missing.length) {
  console.error("[verify-constitution-genre-coverage] NG missing in genres:", missing.join(", "));
  process.exit(1);
}
console.log("[verify-constitution-genre-coverage] OK all § headers present in genre union");
