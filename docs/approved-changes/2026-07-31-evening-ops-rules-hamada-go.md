# 2026-07-31 夕 — 運用・体制・ルール改善（浜田全件承認）

**承認**: 浜田「すべて承認するので対応を進めてOK」（同日チャット）  
**背景**: App756 原価表セッション反省（4h超継続・Violation・push ゲート後発覚）

## 反映したもの

| ID | 内容 | 置き場 |
|----|------|--------|
| #R-SESSION-4H-DEPLOY | 4h超 deploy 硬拒否 | `scripts/cio-deploy-preflight-guard.mjs` + SESSION-SPLIT 硬拒否句 |
| #R-UI chrome on deploy | App756 deploy 前に `verify:jikkou-v2-chrome-css` | 同上 |
| #R-PERF-01 | 構造変更の再描画予算（500ms） | `docs/constitution/jikkou-yosan-v2-ui-chrome-invariants.md` |
| #R-EXCEL-UI-01 | Excel列＋UI専用列の許可条件 | 同上 |
| #R-VIOLATION-01 | Chrome Violation 閾値・説明 | 同上 |
| 要約再開 E1 | mandatory_reads 免除禁止 | `.cursor/rules/session-handoff.mdc` |
| 運用予算ルール | globs 付き mdc | `.cursor/rules/jikkou-yosan-v2-ops-budget.mdc` |
| 日終わり反省 | handoff に改善1〜3件 | SESSION-SPLIT-REMINDER |

## 明日の実装（別チャット）

- 756 操作＋／－の **ブロック単位再描画**（`…excel-struct-raf` の本直し）
