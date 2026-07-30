# 運用改善正本 — 難要望／日程／git ahead／確認切替（2026-07-29）

> **浜田 GO**: すべて承認（2026-07-29）  
> **Cursor 規則**: `.cursor/rules/cio-ops-hard-request-clarity.mdc`（`alwaysApply: false` + globs）  
> **Ver.02 追加**: `.cursor/rules/jikkou-yosan-v2-ui-chrome.mdc` 内「デプロイ品質」  
> **憲法**: 当面 **本文変更なし**（F3・2週間運用後に効けば憲法候補へ）

## ID 対照

| ID | 内容 | 置き場 |
|----|------|--------|
| A1 | 親／子／入力単位／合計の正を4行合意・合意前コード禁止 | ops mdc |
| A2 | 「いまの理解（1文）」＋はい／いいえ | ops mdc |
| B1 | 明日単独禁止→実装日／確認日／RB日 | ops mdc |
| B2 | 大型変更前 git tag バックアップ | ops mdc + Ver.02 |
| C1 | 集計ロジックはテスト緑＋P1指摘0まで LIVE 禁止 | Ver.02 mdc |
| C2 | UIスモーク LIVE と 永続化 LIVE の2段可 | Ver.02 mdc |
| D1 | ahead≥1 で push 要否を1問 | ops mdc + 締め |
| D2 | 未push件数をターン末に可視化 | ops mdc |
| E1 | HOLD／一旦このまま／次は要望実装 | ops mdc + requester runbook |
| E2 | GO前仮置き最大3箇条 | ops mdc + requester runbook |
| F1 | 運用ルールへ A1/B1/D1 | 本ファイル + mdc |
| F2 | Ver.02 メモへ C1/C2/B2 | jikkou mdc |
| F3 | 憲法は触らず2週間試し | 本節 |

## 振り返りトリガー

夕反省・締め時に「A1〜E2 を破っていないか」を1行で自己点検してよい。
