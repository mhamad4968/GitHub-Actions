# 夜セッション必読 — 社員名簿レーン（2026-08-22 昼締め＋夜作業順）

> **昼セッション**: 06:35〜11:26 JST。夜はここから再開。  
> 正本ミラー: `chat-sessions/checkpoint-latest.md` / `chat-sessions/handoff-log.md`  
> SPEC: `docs/plans/2026-08-21-employee-roster-kintone-spec.md`

## 次の1手（迷ったらこれだけ・浜田指示 2026-08-22 11:26）

**作業順は固定。飛ばさない。**

1. `npm run cio:session:cold-start` → bootstrap OK → `session:clock:set`  
2. **Excel正本を突合・反映**（兼務抜けを直した最新版）  
   - パス: `C:\tmp\社員名簿（正社員・準社員）\社員一覧表.xlsx`（更新: **2026-08-22 11:13**）  
   - シート: `社員一覧`（273行・役職に「兼務」**19**）／`集計表`  
   - 列: 事業所／部署名／役職／社員番号／社員名／メールアドレス  
   - → **595 兼務ST＋776 行**をこのExcelに合わせる（抜け兼務を埋める）。`emp_id` は触らない  
3. **並び（`list_sort`）をExcelの行順＝当社の現行役職順に合わせる**  
   - Excel上の並びが正。kintone側をそれに揃える（部署内・全体の方針は実装時に確認し、曖昧なら浜田1問）  
4. **課／室（`section_name`）をExcelデータをもとに登録**  
   - 注: 現状Excelに独立「部／室」列は見当たらない。`部署名`（管理部・工事部・役員室等）や拠点表記からどうマッピングするか **突合設計→必要なら浜田確認→一括登録**  
   - 776のみ。一括時は並びを変えない（合意済み）  
5. 上記完了後: **漏れ点検**＋機能／レイアウト／集計の整え（ページ送り・部追加・保存並び・集計表など）

**保存衝突修正の目視**は手順2の前でも可（BUILD `2026-08-22-776-sort-after-save` rev**49**）。ブロッカーなら先に確認。

## live BUILD（昼締め時点）

| App | BUILD | rev | 備考 |
|-----|-------|-----|------|
| **776** | `2026-08-22-776-sort-after-save` | **49** | 並びは submit.success 後適用 |
| **595** | `2026-08-22-595-kenmu-list-sort-dept-end` | **149** | 新規兼務→部署末尾。既存並び・section維持 |

## 本日（昼）完了 — 再開しない／壊さない

兼務色・部署末尾ボタン・スクロール・ページ送り（`$id`分割）目視OK／部／室フィールド＋部追加UI＋保存時並び（衝突修正済）／595 所属→グループ自動

## 設計合意（変更しない）

| 項目 | 決定 |
|------|------|
| 部／室 | 776のみ・DROP_DOWN・本務兼務両方可 |
| 一括「部追加」 | 並びは聞かない |
| 個別保存 | 部署／部／室変更時に前／後ろ |
| 595新規兼務 | 部署末尾（Excel全件並び直し後も、その後の新規は末尾ルール維持でよいか夜で再確認可） |
| Excel削除 | 移行最終 S7 GO まで残置 |

## 触らない

`emp_id`／閉済UX／688・677–679・736・712／SKYSEA remote／closures JSON へのUX追記

## 主要コード

- `customize/776/desktop.js` / `customize/595/desktop.js`  
- フィールド: `section_name`（部／室）

## 夜セッション開始

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run cio:session:cold-start
npm run session:clock:set
npm run session:clock:watch
```
