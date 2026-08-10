# 2026-08-10 夕反省改善パッケージ仕様（浜田全対応）

**Status**: GO（浜田 2026-08-10「すべて安全に確実に対応をして」）  
**種別**: 体制／運用／ルール／憲法（ポインタのみ）／MCP（定型のみ）／ミス削減  
**制約**: 新 MCP サーバー作成なし。**AGENTS.md 大改訂なし（CON-1 見送り）**。08-09 ops は上書きしない（日付別新設）。

---

## 0. 本日の反省（背景）

1. §41 違反（意見交換初回で一気に比較表まで書いた）
2. 既知システムの再説明で「701 の使い方」に寄れなかった
3. ネタ Word の `…` 省略 → 全文作り直し
4. cold-start D-CHKPT-02（heal 前 early wake-commit）— 別コミットで恒久化済
5. □A1 要約語彙不足で report-verify 初回 NG
6. ネタレーンと経営会議レポートレーンの混線リスク

---

## 1. 承認マトリクス

| ID | 扱い |
|----|------|
| T1〜T3 / T5 / T6 | **実施** |
| T4 | **反映済**（変更なし・維持） |
| R1〜R4 | **実施** |
| ORG-1〜3 | **実施** |
| OPS-1〜3 | **実施** |
| OPS-4 | **継続**（08-09） |
| MCP-1 / MCP-2 | **実施** |
| MCP-3 | **見送り** |
| RULE-1 | **実施** |
| RULE-2 | **継続**（08-09） |
| CON-1 | **見送り** |
| CON-2 / CON-3 | **実施** |

---

## 2. DoD

- [x] runbook・mdc・GO・本仕様が tip に載る
- [x] neta runbook に省略禁止・701/631・納品前チェック
- [x] `cio-report-draft.mjs` に □A1 許容語彙サンプル
- [x] brief-card／deepseek／checklist に該当節
- [x] 夕反省ステータスが **反映済**
- [x] Desktop 26 同期
- [x] `node scripts/test-evening-improvements-2026-08-10.mjs` OK
- [x] `npm run verify:evening-reflection-scope` OK（該当時）
- [x] `npm run cio:report-verify-response` で完了報告 OK

---

## 3. 正本パス

- `docs/runbooks/cio-ops-2026-08-10-evening-improvements.md`
- `.cursor/rules/cio-ops-2026-08-10-evening-improvements.mdc`
- `docs/approved-changes/2026-08-10-evening-reflection-hamada-go.md`
- 上位（衝突回避）: `docs/runbooks/cio-ops-2026-08-09-evening-improvements.md`（維持）
