# 憲法・ルール整理計画（ジャンル分割）

**起票**: 2026-05-17（CEO 依頼）  
**状態**: Phase 2 完了（要約・索引リンク・カバレッジ検証・ヘッダ改行修正）

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

## Phase 2（2026-05-17 完了）

| ID | 内容 | 成果物 |
|----|------|--------|
| CR-02 | 30秒要約・チェックリスト追加（**本文削除なし**） | `constitution:enhance-phase2` |
| CR-03 | `RULES-INDEX` ジャンル早見表 | §→ファイル直リンク |
| CR-02b | § カバレッジ検証 | `constitution:verify-coverage`（71 § OK） |
| — | DeepSeek §50-3-8 突合 | リンク検証・重複定義・サマリ上書きリスクを注意 |
| CR-02c | `README.md`--- 改行欠落修正 | `scripts/fix-constitution-genre-header-newline.mjs`（UTF-8 安全） |
| — | **教訓** | PowerShell `Set-Content` で日本語破損 → **revert `a4d999d` 相当を Node で再修正** |

## Phase 3（今後・§57 GO 後）

| ID | 内容 | 備考 |
|----|------|------|
| CR-04 | `AGENTS.md` を **薄い目次 + include** に | [BREAKING] |
| CR-05 | RAG ingest に `docs/constitution/**` を追加 | 検索精度向上 |

---

## 正本順位（不変）

1. `AGENTS.md`（§ 番号・ゲート）
2. `docs/constitution/*`（読本）
3. `.cursor/rules/*.mdc`（想起・glob）
