# 2026-08-08 夕反省改善パッケージ仕様（浜田全承認）

**Status**: GO（浜田 2026-08-08「全て承認」）  
**種別**: 体制／運用／ルール／憲法（極小）／MCP（定型のみ）  
**制約**: 新 MCP サーバー作成なし。670と年次期間の完全統合なし。憲法の大改訂なし。

---

## 0. 本日の反省（背景）

1. 棚卸状況一覧の手戻り（列・マスタ・マッチを一括で固めなかった）
2. `addEventListener('click', fn)` 直渡しで MouseEvent を所属フィルタと誤認（未棚卸1件）
3. 未分類は live 突合が遅れた
4. 670キャンペーン期間と年次 5/1〜翌4/30 の二系統が画面上で説明不足
5. 買替は代表パス未通のまま受け入れ

---

## 1. 承認マトリクス

| ID | 内容 | 本パッケージでの扱い |
|----|------|----------------------|
| T1 | 集計UIは列定義＋マスタ＋liveサンプル突合を実装前チェック | **実施**（ルール／runbook） |
| T2 | 一覧ボタン系は DeepSeek に Event 直渡し1問 | **実施**（§50-3-8定型／mdc） |
| T3 | 破壊的フローは代表1パス証跡 | **実施**（runbook DoD） |
| O1 | deploy前 REST で未一致／済未了件数 | **実施**（`npm run cio:674:inventory-hub-diag`） |
| O2 | 期間二系統を画面ラベルで明示 | **実施**（674 customize） |
| O3 | 670と年次の完全統合 | **見送り維持**（承認＝統合しない） |
| R1 | Eventを業務フィルタにしない | **実施**（mdc） |
| R2 | マスタ外0または集計外注記 | **実施**（mdc／diag） |
| R3 | 完了定義カード | **実施**（runbook） |
| C1 | 憲法大改訂しない | **見送り維持** |
| C2 | brief-card 1行 | **実施** |
| M1 | 新MCP作らない | **見送り維持** |
| M2 | §50-3-8定型に Event／期間二重 | **実施** |

---

## 2. 成果物パス

| 成果物 | パス |
|--------|------|
| 本仕様 | `docs/plans/2026-08-08-evening-improvements-spec.md` |
| 承認記録 | `docs/approved-changes/2026-08-08-evening-reflection-hamada-go.md` |
| 反省レポート | `docs/reports/2026-08-08-evening-reflection.md` |
| 運用正本 | `docs/runbooks/cio-ops-2026-08-08-evening-improvements.md` |
| Cursor rule | `.cursor/rules/cio-ops-2026-08-08-evening-improvements.mdc` |
| 用語 | `docs/runbooks/674-term-dictionary.md`（追記） |
| 診断 | `scripts/cio-674-inventory-hub-diag.mjs` |
| UI | `customize/new-pc-ledger-v1/desktop.js`（期間ラベル） |

---

## 3. 受け入れ

- [ ] 仕様・approved-changes・runbook・mdc・用語がリポにある
- [ ] `npm run cio:674:inventory-hub-diag` が件数を出す
- [ ] 674 棚卸状況一覧メタにキャンペーン／年次の二系統表示
- [ ] commit + push + GHA 緑

---

## 4. 改訂履歴

| 日付 | 内容 |
|------|------|
| 2026-08-08 | 初版・浜田全承認に基づき作成 |
