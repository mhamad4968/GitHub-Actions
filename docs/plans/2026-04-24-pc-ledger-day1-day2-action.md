# 🚀 PC 台帳 Day 1+2 アクションプラン (2026-04-24 19:00 着手用)

**作成日時**: 2026-04-24 (Fri) 18:15 JST  
**作成経緯**: 浜田 17:43 帰宅 → 18:08 「昨日 Day 1 + 今日 Day 2 = 最低限済まそう / 安全第一」指示  
**着手予定**: 2026-04-24 (Fri) 19:00-  
**目標**: 環境設定マスタ (Day 1) + M365管理マスタ (Day 2) を **2 アプリ作成 + 初期データ投入** 完了  
**主担当**: 浜田 (kintone API 書込実行) / AI (引数テンプレ提示 + 検証 + 記録支援)  
**安全原則**: §47-9 / §47-8 厳守 (kintone API 書込操作は浜田立ち会い必須 / AI 自律実行 禁止)

---

## 🎯 全体フロー (1 アプリあたり 30-45 分目安)

```
[Step 1] AI が kintone-add-app MCP 引数を提示
    ↓ 浜田レビュー (5 分)
[Step 2] 浜田「GO」 → AI が公式 kintone MCP で API 呼出 (1 分)
    ↓ 浜田が kintone 画面で結果確認 (3 分)
[Step 3] AI が kintone-deploy-app で本番反映 (1 分)
    ↓ 浜田 GO
[Step 4] 浜田が kintone CSV インポート画面で初期データ取込 (5-10 分)
    ↓
[Step 5] AI が kintone-get-records でレコード件数確認 (1 分)
    ↓
[Step 6] AI が kintone-apps.md + memory + checkpoint 記録 + commit (5 分)
```

---

# 📦 Day 1: 環境設定マスタ (推定 30-40 分)

## アプリ仕様 (仕様書 §6 より)

- **アプリ名**: `環境設定マスタ`
- **配置スペース**: 21 (システム管理) / defaultThread 23
- **アクセス権限**: 浜田 + 担当者 2 名のみ (既存 627 と同じ運用継承)
- **目的**: M365 ドメイン・固定文字列・上限値などを 1 か所で管理 / カスタマイズ JS のハードコード回避

## フィールド設計 (5 個)

| code | type | UNIQUE | required | options |
|---|---|---|---|---|
| `setting_key` | SINGLE_LINE_TEXT | ✅ | ✅ | - |
| `setting_value` | SINGLE_LINE_TEXT | - | ✅ | - |
| `description` | SINGLE_LINE_TEXT | - | - | - |
| `category` | DROP_DOWN | - | ✅ | M365 / Windows / Mail / 上限値 / その他 |
| `note` | MULTI_LINE_TEXT | - | - | - |

## kintone-add-app MCP 引数 (Step 1 用テンプレ)

```json
{
  "name": "環境設定マスタ",
  "space": 21,
  "thread": 23
}
```

## kintone-add-form-fields MCP 引数 (Step 1 続き)

```json
{
  "app": "<add-app で取得した app ID>",
  "properties": {
    "setting_key": {
      "type": "SINGLE_LINE_TEXT",
      "code": "setting_key",
      "label": "設定キー",
      "required": true,
      "unique": true,
      "noLabel": false
    },
    "setting_value": {
      "type": "SINGLE_LINE_TEXT",
      "code": "setting_value",
      "label": "設定値",
      "required": true,
      "noLabel": false
    },
    "description": {
      "type": "SINGLE_LINE_TEXT",
      "code": "description",
      "label": "説明",
      "noLabel": false
    },
    "category": {
      "type": "DROP_DOWN",
      "code": "category",
      "label": "カテゴリ",
      "required": true,
      "options": {
        "M365":   { "label": "M365",   "index": "0" },
        "Windows":{ "label": "Windows","index": "1" },
        "Mail":   { "label": "Mail",   "index": "2" },
        "上限値": { "label": "上限値", "index": "3" },
        "その他": { "label": "その他", "index": "4" }
      },
      "noLabel": false
    },
    "note": {
      "type": "MULTI_LINE_TEXT",
      "code": "note",
      "label": "備考",
      "noLabel": false
    }
  }
}
```

## 初期データ CSV

- **配置先**: `C:\tmp\new-pc-ledger\env-master-init.csv` (= WSL `/mnt/c/tmp/new-pc-ledger/env-master-init.csv`)
- **件数**: 12 レコード (4/23 23:22 配置済 / 849 bytes)
- **内容確認済 ✅**: 仕様書 §6.3 の全 12 キー完全一致

## 検証チェックリスト (Step 5)

- [ ] kintone-get-app で APP_ID + name + space 確認
- [ ] kintone-get-records で 12 件全件取得 → CSV と差異ゼロ確認
- [ ] `M365_DOMAIN` の値が `@kensetsutoso01.onmicrosoft.com` (先頭 @ あり) であること
- [ ] `M365_LICENSE_LIMIT` の値が `5` であること (整数文字列)
- [ ] `category` がすべて DROPDOWN の 5 選択肢のいずれか (誤字なし)

## 記録 (Step 6)

- `kintone-apps.md` 末尾に追加: `| <APP_ID> | 環境設定マスタ | Space 21 | Day 1 (4/24) | M365 ドメイン等の設定マスタ |`
- memory entity `kintone-ai-lab_PC_Ledger_PJ` に observation 追加: `Day 1 (4/24) ✅ 完了 / app=<APP_ID> / 12 records 投入済`
- checkpoint-latest.md 更新

---

# 📦 Day 2: M365管理マスタ (推定 40-50 分)

## アプリ仕様 (仕様書 §5 より)

- **アプリ名**: `M365管理マスタ`
- **配置スペース**: 21 (システム管理) / defaultThread 23
- **アクセス権限**: 浜田 + 担当者 2 名のみ
- **目的**: 共有/JR 用 M365 ID の **5 台ライセンス厳守管理** / 払い出し・解放を新・PC台帳ver.1 から自動制御

## フィールド設計 (10 個)

| code | type | UNIQUE | required | options/制約 |
|---|---|---|---|---|
| `m365_id` | SINGLE_LINE_TEXT | ✅ | ✅ | - |
| `m365_pw` | SINGLE_LINE_TEXT | - | ✅ | - |
| `account_type` | DROP_DOWN | - | ✅ | 共有 / 個人 |
| `status` | DROP_DOWN | - | ✅ | 利用可 / 満杯 / 廃止 |
| `serial_no` | NUMBER | - | ✅ | 整数 |
| `usage_count` | NUMBER | - | ✅ | 0-5 / デフォルト 0 |
| `linked_pcs` | MULTI_LINE_TEXT | - | - | カンマ区切り |
| `created_at` | DATETIME | - | - | デフォルト=作成日時 |
| `disabled_at` | DATETIME | - | - | - |
| `note` | MULTI_LINE_TEXT | - | - | - |

## kintone-add-app MCP 引数

```json
{
  "name": "M365管理マスタ",
  "space": 21,
  "thread": 23
}
```

## kintone-add-form-fields MCP 引数 (主要部のみ)

```json
{
  "app": "<add-app で取得した app ID>",
  "properties": {
    "m365_id": {
      "type": "SINGLE_LINE_TEXT",
      "code": "m365_id",
      "label": "M365 ID",
      "required": true,
      "unique": true,
      "noLabel": false
    },
    "m365_pw": {
      "type": "SINGLE_LINE_TEXT",
      "code": "m365_pw",
      "label": "M365 パスワード",
      "required": true,
      "noLabel": false
    },
    "account_type": {
      "type": "DROP_DOWN",
      "code": "account_type",
      "label": "種別",
      "required": true,
      "defaultValue": "共有",
      "options": {
        "共有": { "label": "共有", "index": "0" },
        "個人": { "label": "個人", "index": "1" }
      },
      "noLabel": false
    },
    "status": {
      "type": "DROP_DOWN",
      "code": "status",
      "label": "ステータス",
      "required": true,
      "defaultValue": "利用可",
      "options": {
        "利用可": { "label": "利用可", "index": "0" },
        "満杯":   { "label": "満杯",   "index": "1" },
        "廃止":   { "label": "廃止",   "index": "2" }
      },
      "noLabel": false
    },
    "serial_no": {
      "type": "NUMBER",
      "code": "serial_no",
      "label": "連番",
      "required": true,
      "noLabel": false
    },
    "usage_count": {
      "type": "NUMBER",
      "code": "usage_count",
      "label": "使用ライセンス数",
      "required": true,
      "defaultValue": "0",
      "minValue": "0",
      "maxValue": "5",
      "noLabel": false
    },
    "linked_pcs": {
      "type": "MULTI_LINE_TEXT",
      "code": "linked_pcs",
      "label": "使用中 PC 名一覧",
      "noLabel": false
    },
    "created_at": {
      "type": "DATETIME",
      "code": "created_at",
      "label": "作成日時",
      "defaultNowValue": true,
      "noLabel": false
    },
    "disabled_at": {
      "type": "DATETIME",
      "code": "disabled_at",
      "label": "廃止日時",
      "noLabel": false
    },
    "note": {
      "type": "MULTI_LINE_TEXT",
      "code": "note",
      "label": "備考",
      "noLabel": false
    }
  }
}
```

## ビュー (Step 3 後 / 任意 / 後日でも可)

- **標準**: 全件・serial_no 昇順
- **⚠ 満杯一覧**: filterCond=`status in ("満杯")`
- **📊 使用率順**: ORDER BY usage_count DESC

## 初期データ CSV

- **配置先**: `C:\tmp\new-pc-ledger\m365-master-init.csv` (= `/mnt/c/tmp/new-pc-ledger/m365-master-init.csv`)
- **件数**: 10 レコード (`sjm-001` ~ `sjm-010` / 4/24 18:11 AI 作成 / 995 bytes)
- **5 台節約 X 案**: 共有 35 件 ÷ 5 = 7 必要 + バッファ 3 = 10 件
- **全件 status=利用可 / usage_count=0 / linked_pcs 空**: 浜田 B-2 登録時に新・PC台帳ver.1 customize で自動割当

## 検証チェックリスト (Step 5)

- [ ] kintone-get-app で APP_ID + name + space 確認
- [ ] kintone-get-records で 10 件全件取得 → CSV と差異ゼロ確認
- [ ] `m365_id` がすべて `sjm-NNN@kensetsutoso01.onmicrosoft.com` 形式 (3 桁ゼロ埋め)
- [ ] `serial_no` が 1-10 の連番
- [ ] `usage_count` がすべて 0 (整数)
- [ ] `m365_pw` がすべて `kent2511K#`
- [ ] `account_type` がすべて `共有`
- [ ] `status` がすべて `利用可`

## 記録 (Step 6)

- `kintone-apps.md` 末尾追加
- memory entity 追記
- checkpoint-latest.md 更新

---

## 🛡 安全原則 (作業中 厳守)

### §47-9 / §47-8 厳守 (kintone API 書込)
- **AI は引数の提示と検証のみ自律実行**
- **kintone API 実書込 (kintone-add-app / add-form-fields / deploy-app / add-records) は浜田立ち会いのみ**
- 浜田が「GO」「進めて」と明示してから API 呼出

### §51 1 タスク 1 操作
- 1 アプリの 6 ステップを順番に実行 (並列不可)
- Day 1 完全完了 (Step 6 commit) してから Day 2 着手
- 1 つの API call が完了してから次の call へ

### L1 保存前確定 (浜田強調事項)
- 環境設定マスタ自体は L1 該当外 (静的設定なので)
- Day 3 以降 (新・PC台帳ver.1) で重要

### L3 旧アプリ書込ロック (5/13 / Day 1+2 では関係なし)
- Day 1+2 の作業中は旧 594/627/626/667 に一切触らない
- 万一触る必要が出たら即停止 + 浜田確認

### TSB-006 ガード (5 ファイル制限)
- commit 1 件あたり 5 ファイル以下
- 新規 customize は別 commit に分離

### kintone-apps.md 同期
- アプリ作成のたびに kintone-apps.md に即記録 (4/19 教訓)
- App ID + name + space + 作成日 + 用途 を必須

---

## 📊 進捗トラッキング (浜田が ☑ チェック)

### Day 1: 環境設定マスタ
- [ ] Step 1: AI 引数提示 + 浜田レビュー
- [ ] Step 2: kintone-add-app + kintone-add-form-fields 実行 (浜田 GO)
- [ ] Step 3: kintone-deploy-app 実行 (浜田 GO)
- [ ] Step 4: 浜田が kintone CSV インポート画面で `env-master-init.csv` 取込
- [ ] Step 5: AI が 12 件レコード検証
- [ ] Step 6: kintone-apps.md + memory + checkpoint + commit

### Day 2: M365管理マスタ
- [ ] Step 1: AI 引数提示 + 浜田レビュー
- [ ] Step 2: kintone-add-app + kintone-add-form-fields 実行 (浜田 GO)
- [ ] Step 3: kintone-deploy-app 実行 (浜田 GO)
- [ ] Step 4: 浜田が kintone CSV インポート画面で `m365-master-init.csv` 取込
- [ ] Step 5: AI が 10 件レコード検証
- [ ] Step 6: kintone-apps.md + memory + checkpoint + commit

---

## 📅 想定タイムライン (19:00 着手 / 21:00-22:00 完了見込み)

| 時刻 | 内容 |
|---|---|
| 19:00-19:05 | 浜田着手宣言 + 本ファイル レビュー |
| 19:05-19:35 | **Day 1 完遂** (環境設定マスタ / 6 ステップ) |
| 19:35-19:40 | 休憩 / Day 1 commit 確認 |
| 19:40-20:25 | **Day 2 完遂** (M365管理マスタ / 6 ステップ) |
| 20:25-20:35 | 全体 commit 整理 + RAG ingest + memory + checkpoint + push |
| 20:35-21:00 | バッファ / 万一の修正余地 |

→ 21:00 までに完了見込み / 浜田が早めに切り上げたい場合は Day 1 のみ完了で Day 2 を翌日朝へ持ち越しも安全側選択肢。

---

## ⚠ 想定リスク + 対策 (§49 先回り)

| # | リスク | 対策 |
|---|---|---|
| R1 | kintone-add-app で UNIQUE 制約が ignored される (kintone API の既知挙動) | add-form-fields で `unique: true` 明示 + 後で kintone 画面で再確認 |
| R2 | DROPDOWN options の `index` が string 型必須 (number だとエラー) | テンプレで全て `"index": "0"` 等の string に統一済 ✅ |
| R3 | CSV インポート時の文字コード問題 (Shift-JIS vs UTF-8 BOM) | 浜田が kintone 画面で UTF-8 を選択 / エラー時は CSV を再エンコード |
| R4 | `m365-master-init.csv` の `linked_pcs` 空セルが NULL でなく空文字で取り込まれる | kintone 仕様通り = 問題なし (空文字 = 空) / 後の自動割当で append 動作 |
| R5 | DATETIME `created_at` の `defaultNowValue: true` が CSV 取込時に上書きされない | 取込後 AI が kintone-get-records で created_at がある程度の時刻範囲か確認 |
| R6 | アプリ作成 + フィールド追加後に deploy しないと反映されない | kintone-deploy-app を必ず Step 3 で実行 |
| R7 | 万一作成失敗 → リトライ時にアプリ重複作成 | 失敗したら kintone-get-apps で重複 (`name="環境設定マスタ"` 等) を確認 → あれば残す or 旧版削除 |
| R8 | DEPRECATED フィールド名 (`label` vs `name` 等の API 仕様変動) | エラー時に `kintone-dev` MCP の `search_api_specs` で再確認可能 |

---

## 🎯 完了判定 (Day 1+2 100% 達成)

- [ ] 2 アプリ kintone 上に作成済 (kintone-get-apps で `name="環境設定マスタ"` + `name="M365管理マスタ"` ヒット)
- [ ] 環境設定マスタ 12 レコード / M365管理マスタ 10 レコード = **計 22 レコード**投入済
- [ ] 全 22 レコードが仕様書 §5.7.2 / §6.3 と完全一致
- [ ] kintone-apps.md / memory entity / checkpoint-latest.md に App ID + 件数記録済
- [ ] 該当 commit が origin/main に push 済 (working tree clean)
- [ ] 異常 0 / npm run guard:check で全 21 ファイル ✅

---

**最終更新**: 2026-04-24 (Fri) 18:15 JST  
**正本**: kintone-ai-lab/docs/plans/2026-04-24-pc-ledger-day1-day2-action.md  
**関連仕様書**: docs/plans/2026-04-21-new-pc-ledger-spec.md (v2.1 / 770 行)  
