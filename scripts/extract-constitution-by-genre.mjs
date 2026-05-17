#!/usr/bin/env node
/**
 * AGENTS.md を章単位で docs/constitution/ に抽出（§ 番号は AGENTS.md 正本のまま）
 * 用法: npm run constitution:extract-genres
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const agentsPath = path.join(root, "AGENTS.md");
const outDir = path.join(root, "docs", "constitution");

/** 出現順（AGENTS.md 内の ## 第N章 の並び） */
const GENRES = [
  {
    file: "00-preamble.md",
    title: "前文・体系図・読み方",
    when: "初回着手・全体像の把握",
    start: /^## 🗺️/,
    end: /^## 第1章/,
    alsoPrefix: true,
  },
  {
    file: "01-fundamentals.md",
    title: "基本原則（§0〜§3・モデル・正本）",
    when: "タスク開始・モデル選択・正本の確認",
    chapter: /^## 第1章/,
  },
  {
    file: "02-kintone-development.md",
    title: "kintone 開発（§4〜§8）",
    when: "フィールド設計・REST・デプロイ",
    chapter: /^## 第2章/,
  },
  {
    file: "03-quality-engineering.md",
    title: "品質保証（§9〜§15）",
    when: "実装中・レビュー・戦略転換",
    chapter: /^## 第3章/,
  },
  {
    file: "04-environment-security.md",
    title: "環境・MCP 設定・セキュリティ（§16〜§18）",
    when: "WSL/Windows・mcp.json 変更",
    chapter: /^## 第4章/,
  },
  {
    file: "05-knowledge-rag.md",
    title: "ナレッジ・RAG（§19〜§21・第6章）",
    when: "ドキュ追加・RAG 検索",
    chapter: /^## 第5章/,
    extraUntil: /^## 第7章/,
  },
  {
    file: "06-mcp-disaster-recovery.md",
    title: "MCP 保全・災害復旧（§22〜§25）",
    when: "MCP 障害・バックアップ",
    chapter: /^## 第7章/,
  },
  {
    file: "07-frontend-web-quality.md",
    title: "WEB フロント品質（§26〜§30）",
    when: "UI・a11y・性能",
    chapter: /^## 第8章/,
  },
  {
    file: "08-deliverables-architecture.md",
    title: "成果物・アーキテクト（§31〜§33）",
    when: "納品・図解・外部調査",
    chapter: /^## 第9章/,
    includeNext: /^## 第10章/,
  },
  {
    file: "09-human-autonomy-reporting.md",
    title: "人間尊重・自律・報告（§34〜§41）",
    when: "報告・一問一答・自律実行",
    chapter: /^## 第11章/,
  },
  {
    file: "10-session-operations.md",
    title: "セッション運用 OS（§42〜§46）",
    when: "セッション切替・朝ルーチン",
    chapter: /^## 第12章/,
  },
  {
    file: "11-professional-judgment.md",
    title: "プロ判断（§47〜§49）",
    when: "批判・複数案・先回り",
    chapter: /^## 第13章/,
  },
  {
    file: "12-mcp-usage.md",
    title: "MCP 活用（§50 系）",
    when: "MCP 選択・想起儀式・CTO 規定",
    chapter: /^## 第14章/,
  },
  {
    file: "13-parallel-session.md",
    title: "並列禁止・セッション分割（§51 系）",
    when: "並列作業・session:clock",
    chapter: /^## 第15章/,
  },
  {
    file: "14-self-governance-safemode.md",
    title: "自己統治・セーフモード（第18〜19章）",
    when: "異常時・セーフモード",
    chapter: /^## 第18章/,
    extraUntil: /^## 第20章/,
  },
  {
    file: "15-raci-responsibility.md",
    title: "RACI・責任の所在（第20章・第16章）",
    when: "Tier A/B・自律レベル",
    chapter: /^## 第20章/,
    extraUntil: /^## 第21章/,
    appendChapters: [/^## 第16章/],
  },
  {
    file: "16-amendment-process.md",
    title: "憲法改定（§57・第21章）",
    when: "AGENTS.md 改変・[BREAKING]",
    chapter: /^## 第21章/,
  },
];

function wrapGenre(meta, body) {
  return `# ${meta.title}

> **条文番号の正本**: \`AGENTS.md\`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: ${meta.when}  
> **索引**: \`RULES-INDEX.md\` → \`docs/constitution/README.md\`

---

## 要約

このジャンルに属する § は、下記本文どおり \`AGENTS.md\` から抽出したものです。解釈の最終正本は \`AGENTS.md\` の同一 § です。

---

${body.trim()}

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | \`AGENTS.md\` |
| 索引 | \`RULES-INDEX.md\` |
| Cursor 常時 | \`.cursor/rules/cio-constitution.mdc\` |
| 手順 | \`WORKFLOW.md\` |
`;
}

function splitChapters(text) {
  const re = /^## 第\d+章[^\n]*/gm;
  const indices = [];
  let m;
  while ((m = re.exec(text)) !== null) indices.push({ i: m.index, h: m[0] });
  const chunks = [];
  for (let k = 0; k < indices.length; k++) {
    const start = indices[k].i;
    const end = k + 1 < indices.length ? indices[k + 1].i : text.length;
    chunks.push({ header: indices[k].h, body: text.slice(start, end) });
  }
  return chunks;
}

function main() {
  const text = fs.readFileSync(agentsPath, "utf8");
  const lines = text.split(/\r?\n/);
  const chapters = splitChapters(text);

  fs.mkdirSync(outDir, { recursive: true });

  const findChapter = (re) => chapters.find((c) => re.test(c.header))?.body ?? "";

  // preamble: start until ch1
  const ch1Idx = lines.findIndex((l) => /^## 第1章/.test(l));
  const preamble =
    lines.slice(0, ch1Idx >= 0 ? ch1Idx : 64).join("\n") +
    "\n\n" +
    findChapter(/^## 第1章/).split("\n").slice(0, 1);

  const written = [];

  const writeGenre = (meta, body) => {
    if (!body.trim()) return;
    const fp = path.join(outDir, meta.file);
    fs.writeFileSync(fp, `${wrapGenre(meta, body)}\n`, "utf8");
    written.push(meta.file);
  };

  writeGenre(GENRES[0], lines.slice(0, ch1Idx).join("\n"));

  writeGenre(GENRES[1], findChapter(/^## 第1章/));
  writeGenre(GENRES[2], findChapter(/^## 第2章/));
  writeGenre(GENRES[3], findChapter(/^## 第3章/));
  writeGenre(GENRES[4], findChapter(/^## 第4章/));

  const ch5 = findChapter(/^## 第5章/);
  const ch6 = findChapter(/^## 第6章/);
  writeGenre(GENRES[5], `${ch5}\n\n${ch6}`.trim());

  writeGenre(GENRES[6], findChapter(/^## 第7章/));
  writeGenre(GENRES[7], findChapter(/^## 第8章/));

  const ch9 = findChapter(/^## 第9章/);
  const ch10 = findChapter(/^## 第10章/);
  writeGenre(GENRES[8], `${ch9}\n\n${ch10}`.trim());

  writeGenre(GENRES[9], findChapter(/^## 第11章/));
  writeGenre(GENRES[10], findChapter(/^## 第12章/));
  writeGenre(GENRES[11], findChapter(/^## 第13章/));
  writeGenre(GENRES[12], findChapter(/^## 第14章/));
  writeGenre(GENRES[13], findChapter(/^## 第15章/));

  const ch18 = findChapter(/^## 第18章/);
  const ch19 = findChapter(/^## 第19章/);
  writeGenre(GENRES[14], `${ch18}\n\n${ch19}`.trim());

  const ch20 = findChapter(/^## 第20章/);
  const ch16 = findChapter(/^## 第16章/);
  writeGenre(GENRES[15], `${ch20}\n\n${ch16}`.trim());

  writeGenre(GENRES[16], findChapter(/^## 第21章/));

  // manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "AGENTS.md",
    files: written,
  };
  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  console.log("[constitution:extract-genres] wrote", written.length, "files →", outDir);
  for (const f of written) console.log(" ", f);
}

main();
