# 夜セッション必読 — 社員名簿レーン（2026-08-22 昼締め）

> **昼セッション**: 06:35〜〜11:12 JST（4h超・緊急 deploy あり）。夜はここから再開。  
> 正本ミラー: `chat-sessions/checkpoint-latest.md` / `chat-sessions/handoff-log.md`  
> SPEC: `docs/plans/2026-08-21-employee-roster-kintone-spec.md`

## 次の1手（迷ったらこれだけ）

1. `npm run cio:session:cold-start` → bootstrap OK  
2. 本ファイル＋checkpoint「2026-08-22 昼」を読む  
3. **浜田に確認**: 776 保存 revision 衝突が直ったか（BUILD `2026-08-22-776-sort-after-save`）  
4. OKなら: 部追加／部／室／兼務末尾の**目視残り**を片付ける  
5. 未了なら: 一覧ビューに `section_name` 列追加・文言調整など浜田指示のみ  

## live BUILD（昼締め時点・要照合）

| App | BUILD | rev（customize） | 備考 |
|-----|-------|------------------|------|
| **776** | `2026-08-22-776-sort-after-save` | **49** | 並びを **submit.success 後**に適用（revision 衝突修正） |
| **595** | `2026-08-22-595-kenmu-list-sort-dept-end` | **149** | 新規兼務→776 部署末尾。既存兼務の並び・`section_name` 維持 |

フォーム: 776 に **`section_name`（部／室）** DROP_DOWN 追加済（管理部〜工事支援部 8択）。レイアウトは部署名行に配置。

## 本日完了（再開しない／壊さない）

| 項目 | 状態 |
|------|------|
| 兼務行色（統一色＋左帯1px） | 目視 OK |
| 並び替え後リロード＋スクロール | OK |
| 「基準の部署の末尾へ」 | OK |
| ページ送り（`$id` 分割方式） | 目視 OK |
| 595 所属名→所属グループ自動／680順 | deploy 済 |
| 595 新規兼務 list_sort＝776部署末尾 | deploy 済 |
| 776 部／室フィールド | フォーム＋customize 済 |
| 一覧「部追加」モーダル（複数選択・並び聞かない） | deploy 済 |
| 個別編集で部署／部／室変更時の並びダイアログ | deploy 済 → **衝突バグ修正済**（要再目視） |

## バグ経緯（夜AI必読）

- **症状**: 「レコードが更新されたため保存できません」／最新を開いても保存不可  
- **原因**: `edit.submit` 中に `applyChosenSort776` が同一レコードを REST PUT → revision ずれ  
- **修正**: 選択だけ `submit` で保持 → `create/edit.submit.success` で並び適用  
- **緊急証跡**: `SKIP_CIO_SESSION_CLOCK_DEPLOY=1`（§51-6-2 4h超）＋浜田「デプロイまで済ませて」GO  

## 設計合意（部／室・並び）— 変更しない

| 項目 | 決定 |
|------|------|
| 対象アプリ | **776のみ**（595に部／室は置かない） |
| 型 | DROP_DOWN 固定マスタ（追加は浜田依頼時） |
| 一括UI | 一覧 **「部追加」** → 所属グループ名簿から複数選択 |
| 一括時の並び | **聞かない**（後で並び替えUI） |
| 個別編集保存 | 部署 or 部／室変更時に「誰の前／後ろ」 |
| 本務・兼務 | どちらも部／室あり得る |
| 595→776 新規兼務 | `list_sort`＝**その部署の末尾** |
| 既存兼務再同期 | list_sort と section_name を **維持** |

## 触らない

- `emp_id` 上書き／採番ロジック変更  
- 閉済UX（747/746§19, 694, 696, 715, 734, 751）再開  
- 688 heat外／677–679／736／712 deploy／SKYSEA remote  
- Excel削除（移行最終 S7 GO まで残置）  
- closures JSON への UX 追記  

## 主要コード

- `customize/776/desktop.js` — BUILD `…776-sort-after-save`  
- `customize/595/desktop.js` — BUILD `…595-kenmu-list-sort-dept-end`  
- フィールドコード: `section_name`  

## 夜セッション開始コマンド

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run cio:session:cold-start
# OK 後
npm run session:clock:set
npm run session:clock:watch
```
