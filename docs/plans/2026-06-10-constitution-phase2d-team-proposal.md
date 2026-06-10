# 憲法 Phase 2-D — AIチーム合意提案書（2026-06-10）

> **起票**: 2026-06-10  
> **状態**: **提案・部分実装（索引 hygiene のみ GO）**  
> **制約**: AGENTS.md § 本文 **変更・削除禁止** / `constitution.mdc` **手編集禁止** / **1人作業禁止**

---

## §0. GitHub 確認（2026-06-10）

| workflow | main 最新 | 備考 |
|----------|-----------|------|
| cursor-env-gates | ✅ success (`80db083`) | — |
| constitution-gates | ✅ success | — |
| kintone-customize-deploy | ✅ success (`cb70cf0` 以降) | `aa8faec` 時点の **eslint NG** は **709/711 修正済** |
| 日次 GHA（SN/ICT） | ✅ success | — |

**結論**: 現時点の **main に未解決 CI エラーなし**。

---

## §1. AIチームレビュー（3者）

| 役割 | 実施 | 結論 |
|------|------|------|
| **Explore** | Phase 2-D 未着手点・安全な追加のみリスト | Phase 2-D = §↔ジャンル機械リンク。索引 drift 修正は先行可 |
| **DeepSeek** | 第2者反例レビュー | **Phase 2-D 即実装 NG** — 計画書 + 第2者承認後。exempt は理由監査必須 |
| **CIO** | 突合3行 + 本提案書 | 索引 hygiene のみ今回 GO。本文・ミラーは触らない |

### CIO 突合3行（§50-3-8）

1. 本提案は **追記・索引・検証ゲート** のみ — AGENTS 解釈は不変。
2. `exempt` 追加は **`exemptAudit` に理由・日付** を残す（抜け穴防止）。
3. Phase 2-D 本体は **浜田 GO 後** — `verify:cio-four-ai-governance` 全通過を完了条件。

---

## §2. 今回 GO（安全・最小 — チーム合意）

| # | 内容 | 状態 |
|---|------|------|
| A | `ai-kernel-mdc-manifest.json` — 2 `.mdc` を exempt + `exemptAudit` | **実装済** |
| B | `cursor-rules-topic-index.json` — 2 `.mdc` 追記 | **実装済** |
| C | 本提案書 + Phase 2 計画への参照追記 | **本ファイル** |

**非 GO（Phase 2-D 本体）**:

- `constitution-genre-catalog.json` 新設
- `sync-rules-index-section-genre.mjs` / verify 連鎖
- `18-ai-team-read-map.md` への「30秒ルート」大追記（DeepSeek 懸念 — 別途文案レビュー）
- AGENTS.md § 本文の再分割

---

## §3. Phase 2-D 実装ロードマップ（浜田 GO 後）

1. `data/constitution-genre-catalog.json` — GENRES 三重定義の単一正本化
2. `extract-constitution-by-genre.mjs` — §→genre map 出力 + `manualPhase2` マージ保持
3. `sync-rules-index-section-genre.mjs` + `verify-rules-index-section-genre.mjs`
4. `rules:sync-index-all` / `verify:cio-four-ai-governance` へ組込
5. `npm run rules:regenerate-constitution` + 鮮度検証
6. RAG mirror + handoff 追記

**完了条件**: governance 全 OK + DeepSeek 1問 + 浜田目視（索引のみ）

---

## §4. 誤削除防止チェックリスト

- [ ] AGENTS.md diff に `-` 行（本文削除）が **0**
- [ ] `constitution.mdc` を手編集していない
- [ ] `.mdc` をサブフォルダへ移動していない
- [ ] `npm run verify:cio-four-ai-governance` OK
- [ ] `npm run verify:constitution-genre-kernels` OK
- [ ] `npm run constitution:verify-coverage` OK（Phase 2-D 時）

---

## 関連

- Phase 2 正本: `docs/plans/2026-05-21-constitution-phase2-safe-subdivision.md`
- 役割別ナビ: `docs/constitution/18-ai-team-read-map.md`
- 運用: `docs/runbooks/cio-four-ai-governance.md`
