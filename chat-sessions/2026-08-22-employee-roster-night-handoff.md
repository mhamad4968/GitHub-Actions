# 夜セッション必読 — 社員名簿レーン（2026-08-22 昼締め＋夜作業順）

> **昼セッション**: 06:35〜11:26 JST。夜はここから再開。  
> 正本ミラー: `chat-sessions/checkpoint-latest.md` / `chat-sessions/handoff-log.md`  
> SPEC: `docs/plans/2026-08-21-employee-roster-kintone-spec.md`  
> **改善候補（未実装）**: `chat-sessions/2026-08-22-employee-roster-improvement-backlog.md`

## 次の1手（2026-08-22 18:47 JST — 改善レーン浜田すべてOK）

1. **改善GOクローズ**（E1・P0/P1・関越施工部順・595同期高速化まで目視OK。E2/E5ほか見送り）  
2. 日終わりなら session close-git  
3. **S7** Excel削除は最終 GO まで残置  

### 夜セッション進捗（最終）— データ①〜④＋UI＋改善 **完了（浜田OK）**

| # | 内容 | 状態 |
|---|------|------|
| ① | Excel兼務→595 ST＋776 | **済**（兼務19一致・余剰削除3・ST追記/訂正） |
| ② | `list_sort`＝Excel行順 | **済**（276一致・更新258） |
| ③ | `section_name` Excel登録 | **済**（選択肢追加・更新・並び不変） |
| ④ | 漏れ点検＋本務dept/title突合 | **済**（leak 0） |
| UI | 集計表（本務／兼務／合計）・鉄構二重解消・部／室から鉄構支店削除・キーワード GAIA_IL08（and欠落）修正・部追加目視 | **済（浜田OK）** |
| 改善 | P0枠／役職色／E1役職フィルタ／関越施工部を工事部下／595保存→776同期高速化 | **済（浜田すべてOK）** |
| 見送り | E2 キーワード部／室・E3印刷太字・E5兼バッジほか | **今回見送り** |

- **正本Excel**: `C:\tmp\社員名簿（正社員・準社員）\社員一覧表更新.xlsx`（部／室列あり）  
- **live 776**: BUILD `2026-08-22-776-agg-kanetsu-seko-under-koji` rev **73**  
- **live 595**: BUILD `2026-08-22-595-roster-sync-fast` rev **151**  
- スクリプト: `employee-roster-apply-kenmu-from-excel.mjs` ほか夜一式  

## live BUILD（改善クローズ時点）

| App | BUILD | rev | 備考 |
|-----|-------|-----|------|
| **776** | `2026-08-22-776-agg-kanetsu-seko-under-koji` | **73** | E1・関越施工部順含む |
| **595** | `2026-08-22-595-roster-sync-fast` | **151** | 保存時フルrenumber廃止 |

## 本日（昼）完了 — 再開しない／壊さない

兼務色・部署末尾ボタン・スクロール・ページ送り目視OK／部／室フィールド＋部追加UI＋保存時並び（衝突修正済）／595 所属→グループ自動

## 設計合意（変更しない）

| 項目 | 決定 |
|------|------|
| 部／室 | 776のみ・DROP_DOWN・本務兼務両方可。**「鉄構支店」は部／室選択肢に入れない**（部署名側） |
| 一括「部追加」 | 並びは聞かない |
| 個別保存 | 部署／部／室変更時に前／後ろ |
| 595新規兼務 | 部署末尾（再確認は改善バックログ #6） |
| Excel削除 | 移行最終 S7 GO まで残置 |
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
