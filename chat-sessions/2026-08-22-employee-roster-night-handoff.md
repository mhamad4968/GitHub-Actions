# 夜セッション必読 — 社員名簿レーン（2026-08-22 昼締め＋夜作業順）

> **昼セッション**: 06:35〜11:26 JST。夜はここから再開。  
> 正本ミラー: `chat-sessions/checkpoint-latest.md` / `chat-sessions/handoff-log.md`  
> SPEC: `docs/plans/2026-08-21-employee-roster-kintone-spec.md`  
> **改善候補（未実装）**: `chat-sessions/2026-08-22-employee-roster-improvement-backlog.md`

## 次の1手（2026-08-22 19:11 JST — **S7 Excel削除 確認済**）

1. 名簿レーン必須残なし（改善GOクローズ＋S7済）  
2. 正本は **kintone 595/776**（Excel 不在）  
3. 次回は新規レーンのみ  

### 夜セッション進捗（最終）— データ①〜④＋UI＋改善＋**S7** **完了**

| # | 内容 | 状態 |
|---|------|------|
| ① | Excel兼務→595 ST＋776 | **済**（兼務19一致・余剰削除3・ST追記/訂正） |
| ② | `list_sort`＝Excel行順 | **済**（276一致・更新258） |
| ③ | `section_name` Excel登録 | **済**（選択肢追加・更新・並び不変） |
| ④ | 漏れ点検＋本務dept/title突合 | **済**（leak 0） |
| UI | 集計表（本務／兼務／合計）・鉄構二重解消・部／室から鉄構支店削除・キーワード GAIA_IL08（and欠落）修正・部追加目視 | **済（浜田OK）** |
| 改善 | P0枠／役職色／E1役職フィルタ／関越施工部を工事部下／595保存→776同期高速化／本務並び維持／並び替え高速化 | **済（浜田すべてOK）** |
| 見送り | E2 キーワード部／室・E3印刷太字・E5兼バッジほか | **今回見送り** |
| **S7** | Excel削除 | **済（2026-08-22）** — `社員一覧表更新.xlsx` 不在・`C:\tmp\社員名簿（正社員・準社員）` 空フォルダも削除 |

- **正本Excel**: **削除済**（旧パス `C:\tmp\社員名簿（正社員・準社員）\社員一覧表更新.xlsx`）  
- **live 776**: BUILD `2026-08-22-776-reorder-range-put` rev **75**  
- **live 595**: BUILD `2026-08-22-595-preserve-primary-list-sort` rev **152**  
- スクリプト: `employee-roster-apply-kenmu-from-excel.mjs` ほか夜一式（再実行には Excel 再配置が必要）  

## live BUILD（S7 完了時点）

| App | BUILD | rev | 備考 |
|-----|-------|-----|------|
| **776** | `2026-08-22-776-reorder-range-put` | **75** | 並び替え範囲 PUT・E1 含む |
| **595** | `2026-08-22-595-preserve-primary-list-sort` | **152** | 兼務追加で本務並び維持 |

## 本日（昼）完了 — 再開しない／壊さない

兼務色・部署末尾ボタン・スクロール・ページ送り目視OK／部／室フィールド＋部追加UI＋保存時並び（衝突修正済）／595 所属→グループ自動

## 設計合意（変更しない）

| 項目 | 決定 |
|------|------|
| 部／室 | 776のみ・DROP_DOWN・本務兼務両方可。**「鉄構支店」は部／室選択肢に入れない**（部署名側） |
| 一括「部追加」 | 並びは聞かない |
| 個別保存 | 部署／部／室変更時に前／後ろ |
| 595新規兼務 | 部署末尾（再確認は改善バックログ #6） |
| Excel削除 | **S7 済（2026-08-22）** — tmp Excel／フォルダ削除確認 |
| 集計表 | 本務／兼務／合計（合計＝本務＋兼務の延べ） |

## 触らない

`emp_id`／閉済UX／688・677–679・736・712／SKYSEA remote／closures JSON へのUX追記

## 主要コード

- `customize/776/desktop.js` / `customize/595/desktop.js`  
- フィールド: `section_name`（部／室）

## 夜セッション開始（参考）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run cio:session:cold-start
npm run session:clock:set
npm run session:clock:watch
```
