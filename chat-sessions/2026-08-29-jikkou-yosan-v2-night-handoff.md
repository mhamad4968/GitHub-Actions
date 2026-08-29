# 夜セッション必読 — 実行予算 Ver.02 マスタ／内訳・総括（2026-08-29 朝締め）

> 朝は **G0 合意のみ**（実装・deploy なし）。夜はコード表系＋項目名変更の整理。  
> G0 正本: `docs/plans/2026-08-29-jikkou-yosan-v2-master-g0-decisions.md`  
> ローカル作業メモ: `C:\tmp\実行予算ver2\_master-mapping-g0.md`  
> ミラー: `chat-sessions/checkpoint-latest.md` / `chat-sessions/handoff-log.md`

## 次の1手（迷ったらこれだけ）

1. cold-start / bootstrap OK  
2. 本ファイル ＋ G0 SPEC（朝確定は **変更しない**）を読む  
3. Excel `マスタ整理.xlsx` の **大項目／契約工種／費目／システム工種／工種番号／内訳／材料種類** と突合  
4. 浜田持込の **内訳・総括表の項目名追加・変更** を差分リスト化  
5. G0 合意ログ追記 → **実装は明示 GO までしない**

## 朝に確定済み（再開でひっくり返さない）

| ブロック | 決定 |
|----------|------|
| ヘッダ①〜④ | 新 DD 配置・連動（単独→JV非表示／民間→官民2非表示） |
| 組織行 | 発注者 E2／担当支社 P1／担当事務所 新／担当部門 P1 |
| 休日 | 休日設定タブ・1日/期間・祝日自動・土日は手動のみ・重複除外 |
| V1 | 協力会社∪取引先＝会社名1本 |
| S1 | 支店社員＝統括表・給与手当の氏名候補 |
| U1 | 単位＝マスタ正規化＋`－`残す |

## 夜の対象

| 対象 | メモ |
|------|------|
| 大項目 | 施工／保安 → `contract_section` 対応確認 |
| 契約工種 | Excel 12件 → 請負 `contract_work_name` 候補化？ |
| 費目名称 | 7件 → コード表／内訳費目 |
| システム工種・工種番号・内訳・材料 | コード表／735／`JY2_NAME_HIERARCHY` |
| 内訳・総括の項目名 | 浜田持込（追加・改名・廃止） |

**既存正本**:
- `C:/tmp/実行予算ver2/内訳で使うコード表.xlsx` → `JY2_NAME_HIERARCHY`
- ベンダー: `scripts/jikkou-yosan-v2-sync-vendor-list.mjs`（正本パス更新が要る可能性）

## 朝に完了済み（別レーン・再開しない）

- **749 UX** 1–8＋一覧 ID/PW コピー → 目視 OK → UX レーンクローズ  
  - live BUILD=`2026-08-29-749-ux-toolbar-copy-pill-print` rev **18**  
  - `closures.json` 不触（closed-v1 維持）

## 触らない

- **736**／688（WBGT以外）／677–679／閉済 UX の再開（明示 GO まで）  
- 756 実装・deploy（夜も **G0 のみ**が既定。実装は別途 GO）

## 成果物パス

| 種別 | パス |
|------|------|
| G0 SPEC | `docs/plans/2026-08-29-jikkou-yosan-v2-master-g0-decisions.md` |
| Excel | `C:\tmp\実行予算ver2\マスタ整理.xlsx` |
| コード表 | `C:\tmp\実行予算ver2\内訳で使うコード表.xlsx` |
