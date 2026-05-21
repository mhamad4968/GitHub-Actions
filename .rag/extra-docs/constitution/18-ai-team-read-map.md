# 第18読本 — 4AI 役割別ナビ（誰が何を読むか）

**制定**: 2026-05-21（Phase 2・細分化）  
**正本**: `AGENTS.md` §1-2-3-4・§50-3-11 ／ 用語は **`mode-b-canonical.mdc`** のみ  
**機械検証**: `npm run verify:cio-four-ai-governance`  
**迷ったら**: [`00-rule-hierarchy.md`](00-rule-hierarchy.md) → `AGENTS.md` 該当 §（本表はショートカットであり正本の置換ではない）

> **1人作業禁止**: 本表の更新・憲法意味の変更は **DeepSeek 1問 → CIO 突合3行 → `cio:guard:5038`** のあと PR/commit。

---

## ① CIO（Claude Opus 4.7 本体）

| 段階 | 読むもの |
|------|----------|
| **毎ターン最初** | `mode-b-canonical.mdc`（四行テンプレ）→ `every-turn-rules-confirm.mdc` §1 |
| **新セッション** | `part-A-constitution-kernel.md` 🎖️ → `00-rule-hierarchy.md` → `RULES-INDEX.md` |
| **タスク着手** | `RULES-INDEX` で § 特定 → `docs/constitution/<ジャンル>.md` **1〜2本** → 必要時のみ `AGENTS.md` |
| **customize/deploy** | `17-four-ai-mode-b.md` + `docs/runbooks/deepseek-pre-edit-gate.md` + **`cio:guard:5038`** |
| **MCP** | `docs/mcp-status.md` §4AI / `mcp-server-use-triggers.mdc` §4AI |

**禁止**: 四行テンプレの他 `.mdc` へのコピー／Composer 単独 GO なし save・deploy／画像生成 MCP 追加。

---

## ② Composer 2.5（Subagent・コード）

| 段階 | 読むもの |
|------|----------|
| **起動時** | `mode-b-canonical.mdc`（役割=diff のみ） |
| **実装** | 対象 `customize/**` の SPEC + `constitutional-focus-kintone-customize.mdc` |
| **完了報告** | CIO チャットへ diff 要約のみ（憲法解釈・GO 判断は書かない） |

**禁止**: 単独 commit/deploy／§41 浜田への GO 仰ぎ／`AGENTS.md` 正本の改変。

---

## ③ Kimi（長文・レビュー）

| 段階 | 読むもの |
|------|----------|
| **依頼時** | CIO から渡された **ファイルパス一覧** + `kimi_review` 観点（矛盾・未定義・質問票） |
| **参照可** | `docs/constitution/08-deliverables-architecture.md`・対象 SPEC・`RULES-INDEX` 該当行 |

**禁止**: コード diff の主担当／Tier B 実行判断／秘密の外部持ち出し。

---

## ④ DeepSeek（§50-3-8・知恵袋）

| 段階 | 読むもの |
|------|----------|
| **着手前** | `deepseek-cursor-spec-division.mdc` + 対象 SPEC 抜粋 |
| **出力** | 盲点3点・反例・仕様乖離（各1行以上）→ CIO が **突合3行** |

**禁止**: 正本 § の上書き宣言／単独 GO／Composer 代替の「コード主担当」化。

---

## ジャンル読本への最短ルート

| タスク種別 | 読本（1〜2本） |
|------------|----------------|
| kintone 実装 | `02-kintone-development.md` |
| MCP | `12-mcp-usage.md` + `docs/mcp-status.md` |
| セッション切替 | `10-session-operations.md` |
| 報告・§41 | `09-human-autonomy-reporting.md` |
| Tier / RACI | `15-raci-responsibility.md` |

全一覧: [`README.md`](README.md)
