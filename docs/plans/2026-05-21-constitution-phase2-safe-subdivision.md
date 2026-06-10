# 憲法・ルール Phase 2 — 安全な細分化・体系化

**起票**: 2026-05-21（CEO: コミット + AIチーム見やすい体系化 + **1人作業禁止**）  
**状態**: **Phase 2-C 完了**（2026-05-21）— §↔mdc 双方向・`constitution.mdc` 再生成ゲート。**AGENTS.md § 本文は未変更**。

---

## 目的

- AI 4役割が **迷わず・読み過ぎず** 正本に到達する。
- **間違い防止**: 機械検証 + 多AIレビュー + AGENTS 正本非置換。

---

## スコープ（Phase 2-A = 本コミット含む）

| 実施 | 非実施（別GO） |
|------|----------------|
| `18-ai-team-read-map.md`（役割別ナビ） | `AGENTS.md` § 本文の再分割・番号変更 |
| `00-rule-hierarchy` / README / RULES-INDEX 追記 | `constitution.mdc` ミラー全文手編集 |
| 検証 npm スクリプト連鎖の維持 | 新規 `alwaysApply: true` の .mdc 追加 |

---

## 1人作業禁止 — 必須プロトコル（§50-3-11）

```text
1. DeepSeek 1問（盲点・反例・暗黙上書きリスク）
2. CIO 突合3行（正本 AGENTS / part-A / mode-b との一致）
3. npm run cio:guard:5038 -- --stamp --text "…"
4. npm run verify:cio-four-ai-governance
5. commit（本 Phase のみ。push は浜田方針に従う）
```

**第2者**: DeepSeek または Kimi の短問。**完了宣言は CIO のみ**。

---

## Phase 2-B（完了・2026-05-21）

| 成果 | コマンド |
|------|----------|
| `.cursor/rules/README.md` + `data/cursor-rules-topic-index.json`（**物理移動なし**） | `verify:cursor-rules-index` |
| `RULES-INDEX` Cursor ルール逆引き（自動節） | `npm run rules:sync-mdc-index` |
| RAG `.rag/extra-docs/constitution/` ミラー（00/17/18） | `npm run rag:mirror:canonical-docs` |

**DeepSeek 判断**: サブフォルダへ `.mdc` 移動は **非推奨**（Cursor 互換）。論理索引で代替。

## Phase 2-C（完了・2026-05-21）

| 成果 | コマンド |
|------|----------|
| §↔mdc 双方向（RULES-INDEX 自動節 + JSON） | `npm run rules:sync-section-mdc` / `verify:rules-index-section-mdc` |
| 一括索引更新 | `npm run rules:sync-index-all` |
| `constitution.mdc` 手編集禁止 + 鮮度検査 | `rules:regenerate-constitution` / `verify:constitution-mdc-freshness` |
| リポ追跡スタンプ（本体は gitignore） | `data/constitution-mdc-freshness-stamp.json` |
| pre-commit | staged `constitution.mdc` 時に鮮度ゲート |

**§50-3-8 突合3行（Phase 2-C）**:
1. パースは索引専用 — **AGENTS 解釈は変わらない**（矛盾時 AGENTS 正）。
2. `constitution.mdc` は **4.8MB ミラー** — 編集は元ファイル + 再生成のみ。
3. 自動節は **マーカー間のみ**上書き（手編集はマーカー外）。

## Phase 2-D（提案中 — 2026-06-10）

> **チーム合意提案**: `docs/plans/2026-06-10-constitution-phase2d-team-proposal.md`  
> **状態**: 索引 hygiene（manifest + topic-index）のみ実装済。**§↔ジャンル機械リンク本体は浜田 GO 待ち**。

| 成果（予定） | コマンド |
|------|----------|
| §↔ジャンル読本 機械リンク | `rules:sync-section-genre`（未実装） |
| GENRES 単一正本 | `data/constitution-genre-catalog.json`（未実装） |

## Phase 2-D（旧メモ・将来）

- AGENTS § 見出しとジャンル読本の **機械リンク**（extract-constitution 連動）

---

## §50-3-8 突合3行（2026-05-21 DeepSeek → CIO）

1. **固定化リスク** → 本表はショートカット。矛盾時は **AGENTS / 00-rule-hierarchy** が勝つ（README に明記）。
2. **CIO 不在デッドロック** → 5038 skip は **具体理由必須**。ブロック時は **§41 一問**で浜田分岐（憲法既存）。
3. **索引ずれ** → 変更後は **`verify:cio-four-ai-governance`** + `RULES-INDEX` 同時更新。

**暗黙弱体化**: §35-1・§56-1a・§41・§51 は **追記のみ**（Phase 2-A は AGENTS 本文未変更）。

---

## 関連

- Phase 1: `00-rule-hierarchy.md`・`17-four-ai-mode-b.md`
- 検証: `docs/runbooks/cio-four-ai-governance.md`
- エッセンス保全: `phase1-essence-preservation-checklist.md`
