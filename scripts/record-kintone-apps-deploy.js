/**
 * デプロイ成功後に kintone-apps.md を更新する。
 * - メイン一覧にまだ無いアプリ ID のときだけ表に 1 行追加（名称はプレースホルダ）
 * - 毎回「GitHub Actions デプロイ記録」表に 1 行追加（監査用）
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const appId = process.argv[2];
const relPath = process.argv[3] ?? "";

if (!appId || !/^\d+$/.test(appId)) {
  console.error("Usage: node scripts/record-kintone-apps-deploy.js <APP_ID> <REL_PATH>");
  process.exit(2);
}

const root = process.cwd();
const mdPath = path.join(root, "kintone-apps.md");

/** メイン「アプリ一覧」セクション内にこの ID の行があるか（631 / **631** 両対応） */
function isAppInMainSection(content, id) {
  const parts = content.split("## アプリ一覧");
  if (parts.length < 2) return false;
  const untilBreak = parts[1].split(/\n---\n/)[0] ?? parts[1];
  const needleBare = `| ${id} |`;
  const needleBold = `**${id}**`;
  return untilBreak.includes(needleBare) || untilBreak.includes(needleBold);
}

/** メイン表の 「Security NEXT」行の直前に新規行を挿入 */
function insertMainTableRow(content, id, rel) {
  const lines = content.split("\n");
  const needle = "| Security NEXT";
  const idx = lines.findIndex((l) => l.startsWith(needle));
  if (idx === -1) {
    console.warn("Security NEXT 行が見つからず、メイン表への挿入をスキップしました");
    return content;
  }
  const pathCell = rel ? `\`${rel}\`` : "—";
  const row = `| （CI追記・アプリ名は手動更新） | ${id} | ${pathCell} | \`npm run deploy:${id}\` |`;
  lines.splice(idx, 0, row);
  return lines.join("\n");
}

/** 「GitHub Actions デプロイ記録」ブロックを追記または表に行追加 */
function appendDeployLog(content, id, rel) {
  const utc = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const pathMd = rel ? `\`${rel}\`` : "—";
  const header = "### GitHub Actions デプロイ記録（自動）";
  const tableHeader = "| 日時（UTC） | アプリID | customize パス |";
  const sep = "|-------------|----------|----------------|";

  if (!content.includes(header)) {
    const block = [
      "",
      header,
      "",
      tableHeader,
      sep,
      `| ${utc} | ${id} | ${pathMd} |`,
      "",
    ].join("\n");
    const anchor =
      "\n\n---\n\n## Security NEXT ニュース — フォームの確定仕様（自動化と一致）";
    if (content.includes(anchor)) {
      return content.replace(anchor, `${block}${anchor}`);
    }
    return `${content.trimEnd()}\n${block}\n`;
  }

  const afterHeader = content.indexOf(header);
  const fromHeader = content.slice(afterHeader);
  const sepIdx = fromHeader.indexOf(sep);
  if (sepIdx === -1) {
    console.warn("デプロイ記録の区切り行が見つかりません");
    return content;
  }
  const insertPos = afterHeader + sepIdx + sep.length;
  const newLine = `\n| ${utc} | ${id} | ${pathMd} |`;
  return content.slice(0, insertPos) + newLine + content.slice(insertPos);
}

let text = readFileSync(mdPath, "utf8");

if (!isAppInMainSection(text, appId)) {
  console.log(`メイン一覧に未登録の ID ${appId} のため、表に 1 行追加します`);
  text = insertMainTableRow(text, appId, relPath);
} else {
  console.log(`メイン一覧に ID ${appId} は既にあるため、表への新規行はスキップします`);
}

text = appendDeployLog(text, appId, relPath);

writeFileSync(mdPath, text, "utf8");
console.log("kintone-apps.md を更新しました");
