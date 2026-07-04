# 第18読本 — AI 役割別ナビ（4AI コア + 6役追補）

**制定**: 2026-05-21（Phase 2・細分化）／**6役追補**: 2026-07-04（§1-2-3-6）  
**正本**: `AGENTS.md` §1-2-3-4・**§1-2-3-6**・§50-3-11 ／ 6役散文: `docs/plans/2026-07-04-ai-team-six-roles-spec.md` ／ 用語・マトリクス: **`mode-b-canonical.mdc`**  
**機械検証**: `npm run verify:cio-four-ai-governance`  
**迷ったら**: [`00-rule-hierarchy.md`](00-rule-hierarchy.md) → `AGENTS.md` 該当 §（本表はショートカットであり正本の置換ではない）

> **1人作業禁止**: 本表の更新・憲法意味の変更は **DeepSeek 1問 → CIO 突合3行 → `cio:guard:5038`** のあと PR/commit。

---

## ① CIO（Claude Opus 4.8 デフォルト / 軽量時 4.7）

| 段階 | 読むもの |
|------|----------|
| **毎ターン最初** | `mode-b-canonical.mdc`（四行テンプレ）→ `every-turn-rules-confirm.mdc` §1 |
| **新セッション** | `part-A-constitution-kernel.md` 🎖️ → `00-rule-hierarchy.md` → `RULES-INDEX.md` |
| **6役判断** | `docs/plans/2026-07-04-ai-team-six-roles-spec.md` §2・§4（Architect / Visual 起動条件） |
| **タスク着手** | `RULES-INDEX` で § 特定 → `docs/constitution/<ジャンル>.md` **1〜2本** → 必要時のみ `AGENTS.md` |
| **customize/deploy** | `17-four-ai-mode-b.md` + `docs/runbooks/deepseek-pre-edit-gate.md` + **`cio:guard:5038`** |
| **MCP** | `docs/mcp-status.md` §4AI / `mcp-server-use-triggers.mdc` §4AI |
| **図解依頼時** | `docs/runbooks/cio-visual-diagram-openrouter.md`（⑥ へ委譲・本体は diff しない） |
| **重 spec 時** | `docs/runbooks/cio-architect-mode.md`（② へ 1-shot 委譲） |

**禁止**: 四行テンプレの他 `.mdc` へのコピー／Composer 単独 GO なし save・deploy／画像生成 MCP 追加。

---

## ②-A Architect（Opus 4.8 Subagent — **6役追補・稀**）

| 段階 | 読むもの |
|------|----------|
| **起動時** | CIO から渡された **SPEC 抜粋のみ** + `docs/runbooks/cio-architect-mode.md` |
| **出力** | 横断設計・spec 1-shot（**deploy / diff 禁止**） |
| **完了** | CIO へ設計メモ → **DeepSeek §50-3-8 の後・Composer の前** |

**禁止**: 常時起動・kintone save/deploy・憲法条文の改変宣言。

---

## ② Composer 2.5（Subagent・コード — 6役マトリクス **③**）

| 段階 | 読むもの |
|------|----------|
| **起動時** | `mode-b-canonical.mdc`（役割=diff のみ） |
| **実装** | 対象 `customize/**` の SPEC + `constitutional-focus-kintone-customize.mdc` |
| **完了報告** | CIO チャットへ diff 要約のみ（憲法解釈・GO 判断は書かない） |

**禁止**: 単独 commit/deploy／§41 浜田への GO 仰ぎ／`AGENTS.md` 正本の改変。

---

## ③ Kimi（長文・レビュー — 6役マトリクス **④**）

| 段階 | 読むもの |
|------|----------|
| **依頼時** | CIO から渡された **ファイルパス一覧** + `kimi_review` 観点（矛盾・未定義・質問票） |
| **参照可** | `docs/constitution/08-deliverables-architecture.md`・対象 SPEC・`RULES-INDEX` 該当行 |

**禁止**: コード diff の主担当／Tier B 実行判断／秘密の外部持ち出し。

---

## ④ DeepSeek（§50-3-8・知恵袋 — 6役マトリクス **⑤**）

| 段階 | 読むもの |
|------|----------|
| **着手前** | `deepseek-cursor-spec-division.mdc` + 対象 SPEC 抜粋 |
| **出力** | 盲点3点・反例・仕様乖離（各1行以上）→ CIO が **突合3行** |

**禁止**: 正本 § の上書き宣言／単独 GO／Composer 代替の「コード主担当」化。

---

## ⑥ Visual（OpenRouter — **6役追補・図解専用**）

| 段階 | 読むもの |
|------|----------|
| **起動時** | `docs/runbooks/cio-visual-diagram-openrouter.md` + CIO からの **サニタイズ済み spec 抜粋** |
| **出力** | Mermaid / SVG / HTML 図（**コード diff 禁止**） |
| **検証** | CIO が構文・ラベル英語固定・秘密なしを確認 |

**禁止**: customize 編集・憲法編集・Kimi/Composer と並列起動。

---

## ジャンル読本への最短ルート

| タスク種別 | 読本（1〜2本） | 主担当 |
|------------|----------------|--------|
| kintone 実装 | `02-kintone-development.md` + `17-four-ai-mode-b.md` | CIO→Composer |
| MCP | `12-mcp-usage.md` + `docs/mcp-status.md` | CIO |
| セッション切替 | `10-session-operations.md` + `20-cost-token-defense-kernel.md`（長時間時） | CIO |
| 報告・§41 | `09-human-autonomy-reporting.md` + `19-governance-four-ai-kernel.md` | CIO |
| Tier / RACI | `15-raci-responsibility.md` | CIO |
| verify 連続失敗 | `22-error-handling-kernel.md` | CIO |
| 土日・週明け | `21-autonomous-patrol-kernel.md` | CIO |
| 長セッション・引っ越し | `20-cost-token-defense-kernel.md` | CIO |

**Desktop 控え（オフライン早見）**: `28-CONSTITUTION-GENRE-MAP.txt`（`npm run constitution:sync-genre-desktop-map` で再生成）

---

## § → ジャンル（機械索引・Phase 2-D）

| 用途 | 参照先 |
|------|--------|
| **§ から読本を引く** | `RULES-INDEX.md` の `<!-- RULES-INDEX:SECTION-GENRE-AUTO -->` 節（`npm run rules:sync-section-genre`） |
| **JSON 正本** | `data/constitution-section-genre-map.json` |
| **GENRES カタログ** | `data/constitution-genre-catalog.json` |

> 本節・上表・早見表は **索引ショートカット** です。**条文解釈の正本は常に `AGENTS.md` の同一 §** です。矛盾時は AGENTS を優先し、索引は `rules:sync-section-genre` で再生成してください。

全一覧: [`README.md`](README.md)
