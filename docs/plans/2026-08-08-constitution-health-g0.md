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

**今すぐ憲法をいじる必然はない。** ①②で依頼レーンと MCP 台帳は整った。

## 6. 「憲法大統合」を今やらない理由と、やれる境界（2026-08-08 追記）

| やること | 今 |
|----------|-----|
| AGENTS / constitution 全文統合 | **しない**（退行・観測破壊リスク） |
| Desktop META ポインタ維持 | **既に十分** |
| GO3行（依頼レーン） | **①で済** |
| **薄い統合**（仕様/実装/検証の1枚） | **済** — Desktop `37-SPEC-IMPL-VERIFY-MAP.txt`（ポインタのみ） |
| G1 起票（大統合の範囲定義） | **任意・別日** — 対象ファイル一覧と「触らない」を1枚にする程度 |

**やれるところ（本追記）**: 統合の前提条件を固定するだけ。

1. 正本は `docs/constitution/*` + Desktop META · AGENTS は索引  
2. 統合しても **H9 early GREEN 禁止**・**alwaysApply 2件**は不変  
3. 着手条件 = 浜田の明示GO + 観測期間の扱い合意

## 7. 薄い統合（実装メモ · 2026-08-08）

- **何をしたか**: Desktop 37 = 仕様 md / 実装 code / 検証 verify の結線 + E1–E3・36 へのポインタ
- **何をしなかったか**: AGENTS 改定 · constitution 全文マージ · 08-INDEX の日次書き換え
- **機械**: `META_CHARTER_DESKTOP_MAX_PREFIX` 36→37 · `verify:desktop-ai-emergency-sync` 連番更新
