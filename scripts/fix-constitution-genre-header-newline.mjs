#!/usr/bin/env node
/**
 * Fix Phase2 glitch: `README.md`--- → proper newline before --- (UTF-8 safe).
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dir = join(process.cwd(), "docs", "constitution");
const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
let fixed = 0;
for (const f of files) {
  const p = join(dir, f);
  let text = await readFile(p, "utf8");
  const next = text.replace(/README\.md`---/g, "README.md`\n\n---");
  if (next !== text) {
    await writeFile(p, next, "utf8");
    fixed += 1;
    console.log(`fixed: ${f}`);
  }
}
console.log(`[fix-constitution-genre-header-newline] ${fixed} file(s) updated`);
