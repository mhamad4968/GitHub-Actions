# 資産管理アプリ連動ロジック

## 概要

PC管理台帳(594)の詳細画面から、3つのアプリを自動的に紐付ける「アカウント自動登録」機能。

## Phase B（2026-04-16）— EMP-ID デュアルラン

- `customize/594/desktop.js` に **`emp_id`**（フィールドコード共通）を前提とした **595 / 627 突合**を追加。
- **`JBIS594_EMP_ID_QUERY_PRIMARY`**: `true` で **EMP-ID 優先 → mail フォールバック**（§36）。本番で問題時は **`false` にしてデプロイ**すれば mail のみに戻る。
- **626（採番）**: 既存どおり **mail** でプール行を確保（共有 js は App 667 側マスタ）。

## 対象アプリ

| App ID | 名前 | 役割 |
|--------|------|------|
| 594 | PC管理台帳 | トリガー元。ボタン設置先 |
| 595 | 社員情報マスタ | PC番号・アカウント番号をサブテーブルに保持 |
| 596 | PC管理番号TOPマスタ | 採番マスタ（本機能では未使用） |
| 626 | アカウント採番アプリ | 未使用のADログオン名を払い出す |
| 627 | アカウント管理台帳 | アカウント情報の本体。自動生成先 |
| 656 | エラーログ | 障害時の記録先 |

## 処理フロー

```
PC台帳(594) 詳細画面
  └─ [アカウント自動登録] ボタン押下
      │
      ├─ 1. 種別チェック: type === "個人" ？
      │     └─ "個人" 以外 → alert → 中断
      │
      ├─ 2. 二重実行防止: ledger_record_id が空か確認
      │     └─ 既にあり → alert → 中断
      │
      ├─ 3. 利用者名チェック: user_name が入力済みか
      │     └─ 未入力 → alert → 中断
      │
      ├─ 4. 626(アカウント採番) から未使用ログオン名を取得
      │     └─ used_count = "" の先頭1件
      │     └─ なし → alert → 中断
      │
      ├─ 5. 627(アカウント台帳) に新規レコード作成
      │     └─ user_name, group_name, dept_name, mail, PC_name を 594 から転記
      │     └─ logon_name, windows_name を 626 から転記
      │     └─ account_type = "個人アカウント", account_state = "有効"
      │
      ├─ 6. 594(PC管理台帳) の ledger_record_id を更新
      │     └─ 627 の新レコード番号を記録
      │
      ├─ 7. 626(アカウント採番) の used_count を "〇" に更新
      │
      └─ 8. 595(社員マスタ) を user_name で検索して更新
            └─ pc_ledger_list サブテーブルに 594 の $id を追加
            └─ ledger_link_list サブテーブルに 627 の新レコード番号を追加
```

## フィールドマッピング

### 594 → 627 への転記

| 594 フィールド | 627 フィールド |
|---------------|---------------|
| user_name | user_name |
| group_name | group_name |
| dept_name | dept_name |
| mail | mail |
| PC_name | PC_name |
| $id | pc_594_record_id |

### 626 → 627 への転記

| 626 フィールド | 627 フィールド |
|---------------|---------------|
| logon_name | logon_name |
| logon_pw | logon_pw |
| mail_pw | mail_pw |
| gb_pw | gb_pw |
| sb_pw | sb_pw |
| M365_pw | m365_pw |

### 自動生成値

| 627 フィールド | 生成ルール |
|---------------|-----------|
| windows_name | `logon_name` + `"["` + `mail@前` + `"]"`（674・仕様 §4.2.2【正本】。`logon_name` と `[` の間に **`+` は付けない**）。例: `jbm0009[m-kondo]` |
| m365_id | `mail@前 + "@kensetsutoso01.onmicrosoft.com"` 例: `m-kondo@kensetsutoso01.onmicrosoft.com` |
| account_type | 固定: "個人アカウント" |
| account_state | 固定: "有効" |
| employment_status | 固定: "在籍" |

## アトミック性の担保（v2 改訂）

### 戦略: POST → bulkRequest PUT → rollback

kintone の bulkRequest は「途中失敗で先行分がコミットされる」仕様のため、完全なアトミック性は得られない。
そこで以下の設計で**実質的なアトミック性**を確保する:

1. **STEP 3**: 627(アカウント台帳)に POST で新規作成 → `createdAcctId` を取得
2. **STEP 4**: bulkRequest で 594・626・595 の 3 PUT を一括送信
3. **失敗時**: 627 の `createdAcctId` を DELETE してロールバック

```
成功時:  POST 627 ✓ → bulkRequest(PUT 594 + PUT 626 + PUT 595) ✓ → 完了
失敗時:  POST 627 ✓ → bulkRequest 失敗 → DELETE 627 → ロールバック完了
```

### 二重チェック

ボタン押下直後に `kintone.api(GET)` で最新レコードを再取得し、種別が「個人」であることを再確認する。
ボタン表示時ではなく**実行直前**の最新データで判定することで、他ユーザーによる変更も検出する。

## エラーハンドリング

- 全ステップを try/catch で囲み、失敗時は 656(エラーログ) に記録
- bulkRequest 失敗時は自動ロールバック（627 削除）
- ユーザーには「どのステップで失敗したか」を alert で明示
- 処理中は画面全体にオーバーレイを表示し、誤操作を防止

## 制約・前提

- 種別「個人」のレコードのみ自動登録可能
- 「共有」「JR端末」「サーバーNAS」「その他」は手動紐付け
- 595 の user_name は unique 制約あり（同姓同名の衝突なし）
- 626 に未使用のアカウントがなければ処理不可
- 594 に対して1回だけ実行可能（二重実行防止）

## デプロイ

```bash
# kintone-ai-lab から
npm run upload  # customize-uploader で 594 にデプロイ
```

ソースパス: `customize/594/desktop.js`

## 関連 TSB

- TSB-001: fileKey 問題とは無関係
- 本機能固有の障害が発生した場合は TSB-005 として追記する
