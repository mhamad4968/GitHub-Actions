# PC 台帳 Day 4 — 新・PC台帳ver.1 (本体) 作成 + customize 雛形（P2）

**作成**: 2026-04-26 (Sun) 09:00 JST  
**実施予定**: **2026-04-26 (Sun) 20:00 〜** (浜田立会い)  
**前提**: Day 1 (670 環境設定) ・ Day 2 (671 M365) ・ Day 3 (672 jbm 採番 / 673 sjbm 採番) 完了済  
**正本仕様**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v2.1 §4（新・PC台帳ver.1 詳細仕様）  
**遵守**: §51（直列）/ §52-3（Q1–Q6）/ §52-8（高リスク shell）/ §52-8-1（hook 物理 block）/ §55（異常時は縮小）/ kintone 書込は **浜田 GO 毎ステップ**

---

## AI 引継ぎ: `kintone-add-app` 直後に「674 がない／一覧に出ない」と言われたら（浜田確認を挟まずに読む）

以下は **Day4 Step1（2026-04-26）で API 実測**した事実。以降の同系作業でも先に本条を読むこと。

1. **MCP `kintone-add-app` のスキーマ**（Cursor の **user-kintone** サーバのツール定義 `kintone-add-app.json` 正本）  
   - 渡せるのは **`name`（必須）** と **`space`（number）** のみ。  
   - **`thread`（defaultThread 23 等）は指定不可**（`additionalProperties: false`）。スレッド上の掲示は **kintone 管理画面の手操作**が必要な場合がある。

2. **作成直後はプレビュー（未デプロイ）**  
   - ツール説明どおり **pre-live**。**`kintone-deploy-app`（Step3）までライブに載らない**ことがある。  
   - **ライブ REST** の `GET /k/v1/app.json?id=<新ID>` / `GET /k/v1/app/settings.json?app=<新ID>` / `GET /k/v1/app/form/fields.json?app=<新ID>` は **404（GAIA_AP01）になりうる**。それ自体は異常ではない。  
   - **正**: `GET /k/v1/preview/app/settings.json?app=<id>` が **200** なら、その JSON の **`name`** が編集中アプリ名（MCP 戻り値の `app` と組み合わせて照合）。

3. **ブラウザで「見つからない」典型**  
   - **`https://<ドメイン>/k/<appId>/`** は **初回デプロイ前**、開けない／存在しないように見えることがある。  
   - **`#/space/<id>` の右サイド「アプリ」一覧**にも、**未デプロイかつスペース未掲示**だと出ないことがある。  
   - **アプリの管理**の一覧は出ることがあるが、**表の ID 列とアプリ名列の対応取り違え**に注意（別行の名前を 674 に結び付けない）。

4. **`revision-snapshot.mjs`**  
   - ライブ 404 の ID では **プレビュー API にフォールバック**して保存する（出力 JSON に `preview_environment_only: true`）。旧版スクリプトで 404 連発する場合は本条実装後の版を使う。

5. **浜田へ聞くのはこのあと**  
   - **スレッド 23 固定**が必須なら、**デプロイ後**にスペース設定で掲示・所属を確認する（MCP では指定できなかったため）。

---

## ゴール

新・PC台帳ver.1 = **PC + アカウント情報を統合した運用本体**を構築し、最低限の動作確認まで実施する。

| 要素 | 範囲 |
|---|---|
| アプリ作成 | 1 アプリ（新・PC台帳ver.1 / 想定 App ID = **674**） |
| フィールド | 約 35 個（§4.2.1 + §4.2.2 + §4.2.3 + §4.2.4） |
| 配置 | スペース 21 (システム管理) / defaultThread 23 |
| customize 雛形 | 雛形のみ（種別判定 + 5 台警告 のスケルトン）/ 仕上げは 4/27 |
| 採番マスタ参照 | 672 (jbm) / 673 (sjbm) （read のみ） |
| 既存アプリ操作 | **絶対しない**（594 / 627 / 626 / 667 への write 厳禁） |
| 浜田負担 | 約 2 時間想定（20:00 〜 22:00） |

---

## §1. ミス防止三層チェック

### Layer A: 事前準備で 80% 排除（20:00 までに完了 / 本ファイル §3 で詳述）

- [x] kintone:test 拡張（8 apps 全件疎通 OK 確認 / 20:00 直前にも再実行）
- [ ] field-spec-diff.mjs で「仕様書 vs add-form-fields 引数」を機械照合
- [ ] customize 雛形 JS (lint:customize pass 済) を事前作成
- [ ] revision-snapshot.mjs で deploy 直後の自動 backup 仕組み準備
- [ ] このアクション plan 書を浜田が一読（20:00 開始時）

### Layer B: ステップ実行時のチェック（§4 Step 1-7 で詳述）

- [ ] **MCP write 直前**: 引数を chat に丸ごと dump → 浜田明示 GO 取得
- [ ] **app: 値が 594/595/626/627/670/671/672/673 ではない**ことを AI が verbalize
- [ ] **MCP write 直後**: revision-snapshot.mjs 自動実行（rollback 用）
- [ ] **deploy 直後**: get-form-fields → field-spec-diff.mjs で 100% 一致確認

### Layer C: 事後検証（§5 で詳述）

- [ ] kintone-apps.md に 674 行追記
- [ ] autonomy-decisions ログ作成
- [ ] checkpoint-latest.md / chat-sessions/2026-04-26.md 更新
- [ ] commit (`-F file` 経由 / hook 誤検知回避) → push → lock release

---

## §2. フィールド一覧（仕様書 §4.2 完全版 / 35 フィールド）

### 2.1 PC 基本情報（全種別共通 / 12 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 1 | `pc_name` | SINGLE_LINE_TEXT | true | false | 個人=JBIS****-YYYYMM / 共有=S-JBIS****-YYYYMM / JR=手入力 |
| 2 | `pc_serial_no` | NUMBER | false | false | 種別別自動採番（新規発番分のみ） |
| 3 | `serial` | SINGLE_LINE_TEXT | false | false | PC シリアル番号 |
| 4 | `account_type` | DROP_DOWN | true | - | options: [個人, 共有, JR端末, サーバーNAS, その他] / default=個人 |
| 5 | `pc_status` | DROP_DOWN | true | - | options: [利用中, 保管, 廃棄] / default=利用中 |
| 6 | `user_name` | SINGLE_LINE_TEXT | false | false | 利用者名（595 ルックアップ）|
| 7 | `dept_name` | SINGLE_LINE_TEXT | false | false | 所属名（595 から自動引用） |
| 8 | `group_name` | SINGLE_LINE_TEXT | false | false | 所属グループ（595 から自動引用） |
| 9 | `shared_terminal_name` | SINGLE_LINE_TEXT | false | false | 共有端末名（共有/JR で必須・customize で動的検証） |
| 10 | `purchase_date` | DATE | false | false | 購入日 |
| 11 | `latest_inventory_date` | DATE | false | false | 最新棚卸日 |
| 12 | `note` | MULTI_LINE_TEXT | false | false | 備考 |

### 2.2 アカウント情報（個人/共有 自動生成・JR 手入力 / 14 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 13 | `logon_name` | SINGLE_LINE_TEXT | false | false | jbm**** (個人) / sjbm**** (共有) / 手入力 (JR) |
| 14 | `logon_pw` | SINGLE_LINE_TEXT | false | false | =logon_name |
| 15 | `windows_name` | SINGLE_LINE_TEXT | false | false | logon_name (個人/共有) / 手入力 (JR) |
| 16 | `mail` | SINGLE_LINE_TEXT | false | false | 595 から（個人のみ） |
| 17 | `mail_acct` | SINGLE_LINE_TEXT | false | false | mail の @ 前 |
| 18 | `mail_pw` | SINGLE_LINE_TEXT | false | false | jb+ランダム4桁数字+K# |
| 19 | `m365_id` | SINGLE_LINE_TEXT | false | false | mail_acct + 環境設定マスタの M365_DOMAIN（個人）/ M365管理マスタから（共有/JR） |
| 20 | `m365_pw` | SINGLE_LINE_TEXT | false | false | logon_name + K#（個人）/ kent2511K#（共有/JR） |
| 21 | `gb_id` | SINGLE_LINE_TEXT | false | false | =mail_acct（個人のみ） |
| 22 | `gb_pw` | SINGLE_LINE_TEXT | false | false | =logon_name（個人のみ） |
| 23 | `sb_id` | SINGLE_LINE_TEXT | false | false | =mail_acct（個人のみ） |
| 24 | `sb_pw` | SINGLE_LINE_TEXT | false | false | =logon_name（個人のみ） |
| 25 | `vpn_id` | SINGLE_LINE_TEXT | false | false | 手入力 |
| 26 | `vpn_pw` | SINGLE_LINE_TEXT | false | false | 手入力 |

### 2.3 SKYSEA 関連（4 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 27 | `skysea_status` | DROP_DOWN | false | - | options: [未確認, インストール済, 未インストール, インストール対象外] / default=未確認 |
| 28 | `skysea_checked_at` | DATETIME | false | false | SKYSEA 最終確認日時 |
| 29 | `skysea_install_log` | MULTI_LINE_TEXT | false | false | SKYSEA インストール履歴 |
| 30 | `skysea_target_flag` | CHECK_BOX | false | - | options: [配信対象] |

### 2.4 M365 リンク参照（1 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 31 | `m365_master_record_id` | NUMBER | false | false | 紐付き M365管理マスタ レコード番号（共有/JR のみ） |

### 2.5 移行用 hidden（v2.1 §4.7.2 / 4 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 32 | `import_source` | SINGLE_LINE_TEXT | false | false | "csv" or "" / バリデーション 2 系統判別用 |
| 33 | `legacy_pc_name_594` | SINGLE_LINE_TEXT | false | false | 旧 594 の PC 名（移行追跡用） |
| 34 | `legacy_record_id_594` | NUMBER | false | false | 旧 594 のレコード ID（移行追跡用） |
| 35 | `created_at_jst` | DATETIME | false | false | レコード作成 JST timestamp（後付け検索用） |

**合計**: 35 フィールド（仕様書 §4.2 想定数と一致）

---

## §3. 事前準備チェックリスト（20:00 までに AI 完了）

| # | 項目 | 完了印 | 備考 |
|---|---|---|---|
| A0 | session-lock 取得 (holder=PC-ledger-day4-prep-2026-04-26) | ☑ 済 | 09:00 取得 |
| A1 | 本ファイル作成 | ☑ 済 | 本ファイル |
| A2 | kintone:test 拡張 (594-627 + 670-673 = 8 apps) + 全件 OK 確認 | ☑ 済 | 09:00 確認 |
| A3 | scripts/field-spec-diff.mjs 新規 | ☐ | 仕様書 §4.2 vs add-form-fields 引数 機械照合 |
| A6 | scripts/revision-snapshot.mjs 新規 | ☐ | deploy 直後の自動 backup |
| A4 | customize 雛形 JS 骨組み + lint:customize pass | ☐ | customize/674/desktop.js |
| A5 | chat-sessions/2026-04-26-pc-ledger-day4.md 雛形 | ☐ | 当日ログ用 |
| B1 | 20:00 直前: session-lock 切替（holder=PC-ledger-day4-2026-04-26） | ☐ | 旧 lock release → 新 lock acquire |
| B2 | 20:00 直前: `npm run audit:parallel` = 0 点 | ☐ | 3 点以上で着手中止 |
| B3 | 20:00 直前: `npm run smoke` = 8/8 ✅ | ☐ | NG なら着手中止 |
| B4 | 20:00 直前: `npm run kintone:test` = 8/8 ✅ | ☐ | 採番マスタ落ちてないか最終確認 |
| B5 | 浜田に「準備 100% / 着手可」報告 → **GO 待ち** | ☐ | GO もらってから §4 に進む |

---

## §4. 当日 7 ステップ手順（Day 3 と同型 + 強化）

### Step 1: kintone-add-app（アプリ枠だけ作成）

#### 引数テンプレ

```json
{
  "name": "新・PC台帳ver.1",
  "space": 21,
  "thread": 23
}
```

- **AI 行動**: 上記引数を chat に dump → 「これで kintone-add-app を呼んで良いですか？」浜田 GO 待ち
- **GO 後**: MCP `kintone-add-app` 実行 → app ID（想定 674）取得 → revision=1 確定
- **直後**: `node scripts/revision-snapshot.mjs <app_id> 1 step1-add-app` で snapshot 保存

### Step 2: kintone-add-form-fields（35 フィールド一括追加）

#### 引数テンプレ（縮小版・実引数は §2 を JSON 化したもの）

```json
{
  "app": <674>,
  "properties": {
    "pc_name": { "type": "SINGLE_LINE_TEXT", "code": "pc_name", "label": "PC名", "required": true },
    "pc_serial_no": { "type": "NUMBER", "code": "pc_serial_no", "label": "PC連番", "required": false },
    ... (§2 の全 35 フィールド分 / 別途 scripts/field-spec-diff.mjs で完全版を生成可) ...
  },
  "revision": 1
}
```

- **AI 行動**:
  1. §2 から 35 フィールドの完全 JSON を生成（field-spec-diff.mjs に generate モード追加検討）
  2. chat に dump（フィールド数を 35 と verbalize）
  3. 「app: 674 (新・PC台帳ver.1) で間違いないですか？」浜田 GO 待ち
- **GO 後**: MCP `kintone-add-form-fields` 実行 → revision=2
- **直後**: `node scripts/revision-snapshot.mjs 674 2 step2-add-form-fields`

### Step 3: kintone-deploy-app（本番反映）

#### 引数テンプレ

```json
{
  "apps": [
    { "app": 674, "revision": 2 }
  ]
}
```

- **AI 行動**: 引数 dump → 浜田 GO 待ち
- **GO 後**: `kintone-deploy-app` 実行
- **直後**: `kintone-get-app-deploy-status` で SUCCESS 確認（PROCESSING の場合は 5 秒間隔で 3 回まで polling）

### Step 4: kintone-get-form-fields（現状取得）+ field-spec-diff（仕様 vs 実装 機械検証）

- **AI 行動**:
  1. `kintone-get-form-fields` (app=674) → 全フィールド定義取得
  2. `node scripts/field-spec-diff.mjs --app=674 --spec=docs/plans/2026-04-26-pc-ledger-day4-action.md`
  3. **diff 0 件**なら次へ。1 件以上あれば調査 → 浜田に修正 GO を仰ぐ

### Step 5: customize JS upload（雛形のみ / lint pass 済）

#### 雛形の範囲（4/26 = Day 4 / 雛形のみ）

- [x] 種別判定（account_type 変更時の visibility 切替 = アカウント情報セクションの show/hide）
- [x] 5 台ライセンス警告（赤バナー雛形 / 実装は 4/27）
- [x] 自動生成ボタン（クリックで alert "Day 5 で実装" / 雛形）
- [ ] 印刷ボタン（4/27 で本実装）
- [ ] 既存 627 印刷レイアウト移植（4/27）

#### 引数テンプレ（kintone REST upload-customize 経由）

```bash
npm run customize:upload -- --app 674 --file customize/674/desktop.js
```

- **AI 行動**: 引数 dump → 浜田 GO 待ち
- **GO 後**: upload 実行 → `kintone-get-app-customize` で反映確認

### Step 6: テスト 1 件登録（read 専用 → 浜田が手動で 1 件作る）

- **浜田アクション**: ブラウザで新・PC台帳ver.1 (App 674) を開く → テスト 1 件登録
  - account_type = 個人
  - pc_name = `JBIS9999-202604`（テスト用予約番）
  - user_name = 浜田の名前（テスト用）
  - その他は空欄でも保存可
- **AI 行動**: `kintone-get-records` (app=674, query="pc_name=JBIS9999-202604") で取得 → 値確認

### Step 7: 完了報告 + 後始末（§5 へ）

---

## §5. 事後検証チェックリスト（浜田解散後 / AI 自律）

| # | 項目 | 完了印 |
|---|---|---|
| C1 | kintone-apps.md に 674 行追記 | ☐ |
| C2 | logs/autonomy-decisions/PC-ledger-day4-2026-04-26.md 詳細ログ作成 | ☐ |
| C3 | checkpoint-latest.md 更新（最新更新欄に Day 4 完遂を追記） | ☐ |
| C4 | chat-sessions/2026-04-26.md / chat-sessions/2026-04-26-pc-ledger-day4.md 仕上げ | ☐ |
| C5 | data/snapshots/674-deploy-final-2026-04-26.json (revision-snapshot.mjs 出力) git add | ☐ |
| C6 | smoke-test 8/8 ✅ 再確認 | ☐ |
| C7 | commit (`-F file` 経由) → push → session-lock release | ☐ |

---

## §6. リスク対策・rollback 手順

### R1: 誤って app=594 / 627 等の旧アプリに write しようとした場合

- **検知**: AI が引数 dump 時に「app: <ID>」を必ず verbalize
- **物理 block**: §52-8-1 hook は app 番号までは見ないため、**AI 自己制約に依存**
- **fail safe**: §52-8 = AI が app 番号確認漏れを発見したら即停止 → 浜田報告

### R2: deploy 失敗（revision conflict / フィールド型エラー）

- **rollback**: 直前の revision-snapshot から差分復元
  - `cat data/snapshots/674-step<N>-<timestamp>.json | jq` で内容確認
  - 必要なら `kintone-update-app` (revision=N) で巻き戻し（要 浜田 GO）

### R3: customize JS の構文エラーで本番が動かなくなる

- **事前**: `npm run lint:customize` で deploy 前 100% pass 確認
- **fail safe**: 直前の customize ファイルを git 履歴から復元 → 再 upload（要 浜田 GO）

### R4: 採番マスタ 672/673 が応答しない

- **事前**: `npm run kintone:test` 8/8 で確認
- **fail safe**: Day 4 customize 雛形では採番マスタ呼出は alert スタブのみ → 影響なし。本実装は 4/27

### R5: §52-8-1 hook 誤検知で実行できないコマンドがある

- **対処**: §52-8-1 §11 で確立したパターン
  1. 浜田に「§52-8 例外 GO」を提示
  2. 必要なら hook regex を厳密化（要 浜田 GO）
- **回避**: コミット時は `git commit -F /tmp/<msg>.txt` 経由（heredoc 内 literal の誤検知回避）

### R6: 並列セッション疑い

- **事前**: B2 で `audit:parallel` = 0 点確認
- **当日**: 浜田が別 Cursor を起動しないこと（§51-3 セッションロックで物理保護）

---

## §7. 仕様書との突合ポイント

- ✅ §4.2.1 PC 基本情報 12 フィールド: 完全一致
- ✅ §4.2.2 アカウント情報 14 フィールド: 完全一致
- ✅ §4.2.3 SKYSEA 関連 4 フィールド: 完全一致
- ✅ §4.2.4 M365 リンク参照 1 フィールド: 完全一致
- ➕ 移行用 hidden 4 フィールド: 仕様書本体には記載されていないが §4.7.2 / §10.3 から導出
- ✅ 採番マスタ依存（672/673）: read のみ / customize 雛形では alert スタブで実装先送り
- ✅ M365管理マスタ依存（671）: customize 雛形では未参照（本実装は 4/27）

---

## §8. Day 4 完了条件

- [ ] App 674 が本番に存在し、35 フィールドすべて仕様書 §4.2 と一致（field-spec-diff.mjs で機械検証）
- [ ] customize/674/desktop.js が本番反映され、種別変更時のセクション切替が動く
- [ ] kintone-apps.md に 674 行が追加される
- [ ] logs/autonomy-decisions/PC-ledger-day4-2026-04-26.md が残る
- [ ] git に 1 commit + push（hash 記録 / -F file 経由）
- [ ] session-lock release

---

## §9. Day 5 (4/27) への申し送り

- [ ] customize 仕上げ:
  - 自動生成ボタン本実装（672/673 / 671 から払い出し）
  - 印刷ボタン本実装（627 のレイアウト移植）
  - 5 台ライセンス警告ロジック本実装（671 と連動）
  - 検索バー強化（オートコンプリート + 種別チップ）
- [ ] テンプレ CSV 配布（B-1 移行用）
- [ ] 動作確認チェックリスト（仕様書 §10.1 / 17 項目）

---

## §10. Tier 判断ログ（§52）

- **Tier B**（kintone API write）: 各 Step 1/2/3/5 ごとに浜田明示 GO 必須
- **Tier A**（read / 内部ファイル作成）: A0-A6 + B1-B4 + C1-C7 は AI 自律
- **§51 並列禁止**: MCP 呼出は 1 件ずつ順次実行（応答受領後に次へ）
- **§55 セーフモード**: 異常時は即停止 → 浜田報告（縮小自律はしない）
- **§52-8 高リスク shell**: 浜田 GO 必須コマンドは本 Day 4 で発生しない想定（kintone API のみ）

---

## §11. 参照ファイル

- 仕様書本体: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v2.1
- Day 3 plan: `docs/plans/2026-04-25-pc-ledger-day3-action.md`（同型構造の参照元）
- Day 1+2 plan: `docs/plans/_archive/2026-04-24-pc-ledger-day1-day2-action.md`
- アプリ ID 一覧: `kintone-apps.md`
- field-spec-diff: `scripts/field-spec-diff.mjs`（A3 で新規）
- revision-snapshot: `scripts/revision-snapshot.mjs`（A6 で新規）
- customize 雛形: `customize/674/desktop.js`（A4 で新規）
- 当日ログ: `chat-sessions/2026-04-26-pc-ledger-day4.md`（A5 で新規）
