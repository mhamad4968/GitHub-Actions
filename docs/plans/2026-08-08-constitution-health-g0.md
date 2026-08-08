# 憲法・形骸化点検（G0）— 2026-08-08

> **地位**: 調査・要約のみ（実装・commit前提にしない）  
> **上位提案**: 8月ポートフォリオ ③  
> **触らない**: AGENTS 全文改定・新憲法・hooks 大規模変更

## 1. 実行結果（本ターン）

| 検査 | 結果 | メモ |
|------|------|------|
| `verify:constitution-handoff` | **OK** | 物理ガード健在 |
| `verify:formalization-h9-review` | **OK** | due · advisory=GREEN · samples=3 |
| `verify:desktop-ai-emergency-sync` | **OK**（sync 後） | checkpoint Desktop 差分を同期して解消 |
| `verify:constitution-evening` | **OK** | lifecycle-v2 · probes · E1-E9 |

## 2. 読み取り（いまの健全性）

- **生きているゲート**: handoff 物理ガード、H9 観測（GREEN）、MCP registry 必須10、依頼 compose GO3行
- **形骸化しにくい側**: Desktop 36 / META 28 ポインタ、`cio:mcp:gate`、tool-route
- **空月の誤誘導**: score topTask が制約再掲になりやすい → checkpoint「8月提案レーン」で緩和済

## 3. 足りる／足りない（実装しない判断）

| 項目 | 判定 |
|------|------|
| GO境界の分かりにくさ | **①で薄い固定済** — 憲法全文改定は不要 |
| H9 早期 GREEN/降格 | **禁止維持**（checkpoint 明記） |
| registry「生きてるゲートだけ」整理 | **G1候補** — 削除は Tier B。今は台帳＋月次パックで足りる |
| cloud handoff「憲法改善・統合」 | **別ラウンド**（本 G0 では着手しない） |

## 4. 次に浜田 GO が要るもの（任意）

1. score-spec に constraint vs work 区別（提案⑤のコード化）
2. 憲法大統合の G1 spec 起票（やるなら）
3. Tier B: mcp.json Cold 整理（月次パックで「不要」判定済）

## 5. 結論（G0）

**今すぐ憲法をいじる必然はない。** ①②で依頼レーンと MCP 台帳は整った。残りは夜の完了通知と、空きがあれば B-MDFLOW の薄い依存図（④）のみ。
