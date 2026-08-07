# 674／SKYSEA 運用改善（2026-08-07 浜田全承認）

## 背景（本日の反省）

- 「すべて表示」≠全ステータス
- 「表」＝台帳内 UI なのに Canvas を先出し
- 集計 table 追加で `querySelector('tbody')` がリストを破壊
- 編集不可でも入力支援 confirm

## 確定運用（SKYSEA）

| 項目 | 内容 |
|------|------|
| インストール | **手動**（人が実施） |
| 台帳 | 674 `skysea_manual_*` |
| AI の仕事 | 浜田から **登録依頼（xlsx等）** が来たときだけ完了 PUT |
| しない | リモート配信・GPO・SG 一括追加 |

## ゲート

| ID | 内容 |
|----|------|
| S-UI-WHERE-01 | 配置先1行 |
| S-DOM-SCOPE-01 | 複数 table 時の裸 tbody 禁止 |
| S-ASSIST-EDITABLE-01 | 編集可のみ入力支援 |
| 曖昧語 | 2解釈出してから着手 |

## コマンド

```bash
npm run cio:deploy-ready:674
npm run cio:eod:github
```

## 関連

- `.cursor/rules/cio-ops-2026-08-07-evening-improvements.mdc`
- `docs/runbooks/674-term-dictionary.md`
- `docs/runbooks/skysea-2026-schedule.md`
