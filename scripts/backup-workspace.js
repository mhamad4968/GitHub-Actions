/**
 * カスタマイズ・スクリプト・正本ドキュメントなどを、リポジトリ外に近い形で日付フォルダにコピーする（ローカルバックアップ）。
 * - シークレットはコピーしない（**.env** は対象外）。
 * - 巨大な node_modules / .git はコピーしない。
 *
 * 実行: npm run backup
 * 出力: backups/YYYY-MM-DD-HHmmss/
 */
import { mkdirSync, copyFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const backupsRoot = join(root, "backups");

function pad2(n) {
  return String(n).padStart(2, "0");
}

const d = new Date();
const stamp = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
const dest = join(backupsRoot, stamp);

/** ディレクトリをまるごとコピー（無ければスキップ） */
function copyDirIfExists(relFrom, relTo) {
  const from = join(root, relFrom);
  const to = join(dest, relTo);
  if (!existsSync(from) || !statSync(from).isDirectory()) {
    return { relFrom, ok: false, reason: "missing" };
  }
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  return { relFrom, ok: true };
}

/** 単一ファイルをコピー */
function copyFileIfExists(relPath) {
  const from = join(root, relPath);
  if (!existsSync(from) || !statSync(from).isFile()) {
    return { relPath, ok: false, reason: "missing" };
  }
  const to = join(dest, relPath);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  return { relPath, ok: true };
}

mkdirSync(dest, { recursive: true });

const results = [];

results.push(copyDirIfExists("customize", "customize"));
results.push(copyDirIfExists("chat-sessions", "chat-sessions"));
results.push(copyDirIfExists("scripts", "scripts"));
results.push(copyDirIfExists("src", "src"));
results.push(copyDirIfExists(".cursor/rules", ".cursor/rules"));
results.push(copyDirIfExists(".github/workflows", ".github/workflows"));
results.push(copyDirIfExists("security-next-automation/src", "security-next-automation/src"));
results.push(copyDirIfExists("security-next-automation/docs", "security-next-automation/docs"));

for (const f of [
  "CLAUDE.md",
  "docs/agent-restore-checkpoint.md",
  "kintone-apps.md",
  "RULES-INDEX.md",
  "package.json",
  "package-lock.json",
  "eslint.config.js",
  "security-next-automation/package.json",
  "security-next-automation/package-lock.json",
]) {
  results.push(copyFileIfExists(f));
}

const summary = {
  createdAt: new Date().toISOString(),
  destination: dest,
  note: "Secrets (.env) and node_modules are not included.",
  items: results,
};

writeFileSync(join(dest, "BACKUP-MANIFEST.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");

console.log("Backup completed:", dest);
console.log("See BACKUP-MANIFEST.json inside for copied paths.");
