# 憲法・ルール整理計画（ジャンル分割）

**起票**: 2026-05-17（CEO 依頼）  
**状態**: Phase 1 完了（分割読本 + 索引）

---

## 目的

- `AGENTS.md` を **ジャンル別ファイル**に分割し、AI が **索引 → 1〜2 ジャンル**で読めるようにする。
- **§ 番号・機械ゲート**は `AGENTS.md` 正本を維持（`mandatory-read-gate` 等を壊さない）。

---

## Phase 1（完了）

| 成果物 | 説明 |
|--------|------|
| `docs/constitution/README.md` | マスタ索引・読み方 |
| `docs/constitution/00-…` 〜 `16-…` | 章ベース 17 ファイル（自動抽出） |
| `scripts/extract-constitution-by-genre.mjs` | 再生成スクリプト |
| `npm run constitution:extract-genres` | 上記の npm ラッパー |

---

## Phase 2（今後・CEO/CIO）

| ID | 内容 | 備考 |
|----|------|------|
| CR-02 | 各ジャンルファイルの **文章整理**（重複削減・箇条書き統一） | 人手 + AI レビュー |
| CR-03 | `RULES-INDEX.md` を **ジャンルファイルへ直リンク** | 索引の二重管理を減らす |
| CR-04 | `AGENTS.md` を **薄い目次 + include** に（§57 GO 後） | [BREAKING] 候補 |
| CR-05 | RAG ingest に `docs/constitution/**` を追加 | 検索精度向上 |

---

## 正本順位（不変）

1. `AGENTS.md`（§ 番号・ゲート）
2. `docs/constitution/*`（読本）
3. `.cursor/rules/*.mdc`（想起・glob）
