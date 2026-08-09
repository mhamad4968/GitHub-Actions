# 2026-08-09 夕反省改善パッケージ仕様（浜田全承認）

**Status**: GO（浜田 2026-08-09「すべて承認します」）  
**種別**: 体制／運用／ルール／憲法（ポインタのみ）／MCP（定型のみ）  
**制約**: 新 MCP サーバー作成なし。**AGENTS.md 大改訂なし（CON-1 見送り）**。O-WAKE 下位のみ。

---

## 0. 本日の反省（背景）

1. cold-start の Self-Heal／#D-CLOSE-02／Desktop WARN を「毎日人手是正が要る欠陥」と錯覚しうる
2. lock heal 初案で re-export 欠落 → bridge grandparent 悪化経路
3. Composer 実装後の順序バグを本体 CIO 再読で発見（順序契約が受入に無かった）
4. 報告下書きの □A1／🎖️ 不一致で verify 初回 NG
5. 「他にない？」磨きで Done 宣言が実装完了とゲート固定に割れた

---

## 1. 承認マトリクス

| ID | 扱い |
|----|------|
| T1 | **実施**（表記辞書＋成功経路 INFO／healed 維持） |
| T2 | **反映済**（変更なし） |
| T3 | **実施**（Composer 受入＝順序契約 1 行） |
| T4 | **反映済** |
| T5 | **実施**（report-draft／medal／□A1 から開始） |
| R1 | **実施**（tip 変更時 re-export or wake-fold 宣言） |
| R2 | **実施**（実装完了 ≠ ゲート固定完了） |
| R3 | **実施**（偽陽性文言辞書） |
| ORG-1 | **実施**（差分要約＋順序／副作用契約） |
| ORG-2 | **実施**（希望対応スコープ上限 1 本） |
| OPS-1 | **実施**（cold-start 報告 3 行分類） |
| OPS-2 | **実施**（tip 後 export or :wake） |
| MCP-1 | **実施**（§50-3-8 定型 1 語追加） |
| MCP-2 | **実施**（Kimi 生出力を正本にしない） |
| RULE-1 | **実施**（薄い globs mdc） |
| RULE-2 | **実施**（verify 初回 NG→同ターン再 verify） |
| CON-1 | **見送り** |
| CON-2 | **実施**（brief-card／cold-start 1〜2 行） |

---

## 2. DoD

- [x] runbook・mdc・GO・本仕様が tip に載る
- [x] brief-card／cold-start／deepseek／checklist に該当節がある
- [x] 夕反省ステータスが **反映済**
- [x] Desktop 26／AI緊急用同期（該当時）
- [x] `npm run cio:report-verify-response` で完了報告 OK
- [x] `node scripts/test-evening-improvements-2026-08-09.mjs` OK

---

## 3. 正本パス

- `docs/runbooks/cio-ops-2026-08-09-evening-improvements.md`
- `.cursor/rules/cio-ops-2026-08-09-evening-improvements.mdc`
- `docs/approved-changes/2026-08-09-evening-reflection-hamada-go.md`
