#!/usr/bin/env node
/**
 * Phase 2: ジャンルファイル先頭に要約・チェックリストを付与（本文は削除しない）
 * 重複フッター（関連ファイル表の二重）のみ除去
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "docs", "constitution");

const SUMMARIES = {
  "00-preamble.md": {
    summary:
      "憲法の地図・mermaid フロー・予実/PC台帳レーン分離。全文通読の代わりにここで全体像だけ掴む。",
    checklist: ["新規タスク", "レーン混同の不安があるとき"],
  },
  "01-fundamentals.md": {
    summary:
      "§0 索引駆動・§1 役割・§1-2 モデル/予算。毎タスク開始とティア宣言の根拠。",
    checklist: ["タスク開始", "モデル選択", "クレジット警告"],
  },
  "02-kintone-development.md": {
    summary: "§4〜§8: フィールド整合・非同期・一括・エラー表示・デプロイ3点セット。",
    checklist: ["kintone REST", "deploy 前", "フィールド追加"],
  },
  "03-quality-engineering.md": {
    summary: "§9〜§15: 完了チェック・自己レビュー・§14 戦略転換・§15 完成度4要件。",
    checklist: ["実装中", "2回失敗", "リファクタ判断"],
  },
  "04-environment-security.md": {
    summary: "§16 WSL/Win・§17 mcp.json 手順・§18 秘密情報。",
    checklist: ["mcp.json 編集", "パス変更", "認証情報"],
  },
  "05-knowledge-rag.md": {
    summary: "§19〜§21 と RAG 第6章。鮮度・RAG 検索義務・学習サイクル。",
    checklist: ["docs 追加", "rag:ingest", "TSB 起票"],
  },
  "06-mcp-disaster-recovery.md": {
    summary: "§22〜§25: MCP バックアップ・復旧・変更義務・FAQ 受け渡し。",
    checklist: ["MCP 赤", "restore-mcp", "バックアップ"],
  },
  "07-frontend-web-quality.md": {
    summary: "§26〜§30: 視覚検診・a11y・性能・レスポンシブ・診断タイミング。",
    checklist: ["UI 変更", "customize 画面", "アクセシビリティ"],
  },
  "08-deliverables-architecture.md": {
    summary: "§31 納品・§32 図解・§33 外部調査。調査3ステップの根拠。",
    checklist: ["C:\\tmp 納品", "アーキ図", "公式Doc調査"],
  },
  "09-human-autonomy-reporting.md": {
    summary: "§34 人間尊重・§35 自律・§37 報告・§41 一問一答。報告体裁の憲法根拠。",
    checklist: ["報告ターン", "§41 質問", "自律実行範囲"],
  },
  "10-session-operations.md": {
    summary: "§42〜§46: 過去ログ・WORKFLOW・夕反省・朝ルーチン最上位。",
    checklist: ["セッション切替", "session:clock", "朝イチ"],
  },
  "11-professional-judgment.md": {
    summary: "§47 批判・§48 複数案・§49 先回り。設計判断の三本柱。",
    checklist: ["仕様迷い", "GO/NO-GO", "リスク説明"],
  },
  "12-mcp-usage.md": {
    summary: "§50 想起儀式・死蔵根絶・§50-3 CTO規定・§50-3-8 DeepSeek突合。",
    checklist: ["MCP 選択", "コード変更前", "コスト"],
  },
  "13-parallel-session.md": {
    summary: "§51 並列禁止・session:clock・セッション分割。1タスク1操作。",
    checklist: ["並列の誘惑", "長時間セッション", "切替"],
  },
  "14-self-governance-safemode.md": {
    summary: "第18〜19章: 自己統治・§55 セーフモード。判断材料欠損時。",
    checklist: ["health-check 赤", "Read 失敗", "縮小運転"],
  },
  "15-raci-responsibility.md": {
    summary: "Tier A/B・§52-8 shell・§56 RACI・開発=AI/確認=浜田。",
    checklist: ["Tier 判定", "破壊的操作", "自律修正"],
  },
  "16-amendment-process.md": {
    summary: "§57 憲法改定・[BREAKING]・改定キュー。AGENTS 改変はここを先に読む。",
    checklist: ["AGENTS 改定", "ルール追加", "§57 GO"],
  },
};

const FOOTER_DUP = /^## 関連ファイル[\s\S]*$/m;

function enhance(file, meta) {
  const fp = path.join(dir, file);
  let text = fs.readFileSync(fp, "utf8");
  if (text.includes("## 30秒要約（Phase 2）")) {
    console.log("[phase2] skip (already enhanced):", file);
    return;
  }

  const summaryIdx = text.indexOf("## 要約");
  if (summaryIdx === -1) {
    console.warn("[phase2] WARN unexpected structure:", file);
    return;
  }
  const preamble = text.slice(0, text.indexOf("---", 20)).trimEnd();

  const bodyMarkers = ["## 第", "## 🗺️", "## 作業レーン"];
  let bodyStart = -1;
  for (const mk of bodyMarkers) {
    const i = text.indexOf(mk, summaryIdx);
    if (i >= 0 && (bodyStart < 0 || i < bodyStart)) bodyStart = i;
  }
  let body = bodyStart >= 0 ? text.slice(bodyStart) : text.slice(summaryIdx);
  body = body.replace(FOOTER_DUP, "").trimEnd();

  const block = `---

## 30秒要約（Phase 2）

${meta.summary}

## いつ読む（チェックリスト）

${meta.checklist.map((c) => `- ${c}`).join("\n")}

## 条文本文（AGENTS 抽出・削除禁止）

> 以下は \`AGENTS.md\` からの抽出コピー。**省略・削除しない**。解釈疑義は \`AGENTS.md\` 正本。

`;

  const footer = `

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | \`AGENTS.md\` |
| 索引 | \`RULES-INDEX.md\` |
| 読本目次 | \`docs/constitution/README.md\` |
| 検証 | \`npm run constitution:verify-coverage\` |
`;

  const out = `${preamble}${block}${body}${footer}\n`;
  fs.writeFileSync(fp, out, "utf8");
  console.log("[phase2] enhanced:", file);
}

for (const file of Object.keys(SUMMARIES)) {
  enhance(file, SUMMARIES[file]);
}
