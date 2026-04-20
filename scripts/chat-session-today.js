/**
 * 日付メモ YYYY-MM-DD.md を用意する。既定の保存先は Windows の
 *   C:\Claudeとの会話メモ  （WSL では /mnt/c/Claudeとの会話メモ）
 * 続きのチャットで、そのファイルを @ するか中身を貼り付ける。
 *
 * 別パスにしたいとき: CHAT_MEMO_DIR=/path/to/dir
 * /mnt/c が無い環境ではリポジトリの chat-sessions/ にフォールバック。
 *
 * 実行: npm run chat:today
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoSessions = join(root, "chat-sessions");
const repoTemplate = join(repoSessions, "TEMPLATE.md");

/** メモを置くディレクトリ（環境変数 > C:\Claudeとの会話メモ > chat-sessions） */
function resolveMemoDir() {
  const override = process.env.CHAT_MEMO_DIR?.trim();
  if (override) return override;
  const winDefault = "/mnt/c/Claudeとの会話メモ";
  if (existsSync("/mnt/c")) {
    return winDefault;
  }
  return repoSessions;
}

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const memoDir = resolveMemoDir();
mkdirSync(memoDir, { recursive: true });

const readmeWin = join(memoDir, "README.md");
if (!existsSync(readmeWin)) {
  writeFileSync(
    readmeWin,
    [
      "# Claude / Cursor 用・会話の続きメモ",
      "",
      "- このフォルダの `YYYY-MM-DD.md` に、その日の要点をメモしておきます。",
      "- **過去の日付ファイルは削除しない**（履歴として残す）。その日の続きは**当日ファイルに追記**します。",
      "- **Cursor**: チャット入力欄で `@ファイル` からこの `.md` を指定するか、メモをコピーして貼り付けます。",
      "- **WSL の kintone-ai-lab から作成**: リポジトリで `npm run chat:today`（ここに今日のファイルが無ければ作成）。",
      "- 恒久ルール・決定事項は **`kintone-ai-lab/RULES-INDEX.md`** の随時メモにも**追記**（行を消さない）。",
      "- トークン・パスワード・個人情報は書かないでください。",
      "",
    ].join("\n"),
    "utf8",
  );
}

const policyPath = join(memoDir, "00-履歴の残し方.md");
if (!existsSync(policyPath)) {
  writeFileSync(
    policyPath,
    [
      "# 履歴・ルールの残し方",
      "",
      "1. このフォルダの **過去の `YYYY-MM-DD.md` は消さない**。",
      "2. 当日のメモは **同じファイルに追記**（長ければ見出しで区切る）。",
      "3. 「ルールにした」ことは **リポジトリの `RULES-INDEX.md`** にも 1 行追記。",
      "4. `.cursor/rules` や `kintone-apps.md` がコード・フィールドの正本。",
      "",
    ].join("\n"),
    "utf8",
  );
}

const templateInMemo = join(memoDir, "TEMPLATE.md");
if (!existsSync(templateInMemo) && existsSync(repoTemplate)) {
  writeFileSync(templateInMemo, readFileSync(repoTemplate, "utf8"), "utf8");
}

const stamp = todayStr();
const outPath = join(memoDir, `${stamp}.md`);

if (existsSync(outPath)) {
  console.log(outPath);
  if (memoDir.startsWith("/mnt/c/")) {
    const winPath = "C:\\" + memoDir.slice("/mnt/c/".length).replace(/\//g, "\\");
    console.log("Windows パス例: " + winPath + "\\" + stamp + ".md");
  }
  console.log("(already exists)");
  process.exit(0);
}

let body = "";
if (existsSync(repoTemplate)) {
  body = readFileSync(repoTemplate, "utf8").replace(/YYYY-MM-DD/g, stamp);
} else if (existsSync(templateInMemo)) {
  body = readFileSync(templateInMemo, "utf8").replace(/YYYY-MM-DD/g, stamp);
} else {
  body = `# チャットメモ — ${stamp}\n\n## 続きから読むサマリ\n\n-\n`;
}

writeFileSync(outPath, body, "utf8");
console.log(outPath);
if (memoDir.startsWith("/mnt/c/")) {
  const winPath = "C:\\" + memoDir.slice("/mnt/c/".length).replace(/\//g, "\\");
  console.log("Windows パス: " + winPath + "\\" + stamp + ".md");
}
console.log("(created from TEMPLATE.md)");
console.log("");
console.log("続きのチャット: 上記ファイルを @ で指定するか、エディタで開いて内容を貼り付け。併用なら RULES-INDEX.md も。");
