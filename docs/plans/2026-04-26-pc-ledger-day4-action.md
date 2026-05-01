# PC 台帳 Day 4 — 新・PC台帳ver.1 (本体) 作成 + customize 雛形（P2）

**作成**: 2026-04-26 (Sun) 09:00 JST  
**実施予定**: **2026-04-26 (Sun) 20:00 〜** (浜田立会い)  
**前提**: Day 1 (670 環境設定) ・ Day 2 (671 M365) ・ Day 3 (672 jbm 採番 / 673 sjbm 採番) 完了済  
**正本仕様**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v2.1 §4（新・PC台帳ver.1 詳細仕様）。**着手前**は **§4.2.0〜§4.4 を Read**（`chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1b** と同趣旨。本手順書だけで正本を読み替えない）。  
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

6. **憲法 §50-3-9（2026-04-30・kintone MCP 全般）**  
   - user-kintone 等の **kintone 系 MCP** が **構造エラー**（出力スキーマ不一致・戻り値検証エラー等）を返したら、**同一 MCP を再試行しない**。  
   - **`AGENTS.md` §50-3-9** に従い、**REST**（`scripts/` 内の検証済み Node パターン＝`preview/app.json` / `preview/app/form/fields.json` 等の改修利用、または **`scripts/tmp-kintone-*.mjs`**）へ移行して完遂する。通信エラーは **1 回のみ**再試行し、失敗なら即 REST。一時スクリプトは **削除または正規ファイル名へ昇格**（リポ整理）。  
   - **航海図**（§50-3-2）には **手段(第2)=REST** を **着手前に併記**する。

---

## ゴール

新・PC台帳ver.1 = **PC + アカウント情報を統合した運用本体**を構築し、最低限の動作確認まで実施する。

| 要素 | 範囲 |
|---|---|
| アプリ作成 | 1 アプリ（新・PC台帳ver.1 / 想定 App ID = **674**） |
| フィールド | 約 44 個（§4.2.1 + §4.2.2 + §4.2.3 + §4.2.4 + 移行用 + **GROUP 2**＝内部処理用 + SKYSEA処理用） |
| 配置 | スペース 21 (システム管理) / defaultThread 23 |
| customize 雛形 | 雛形のみ（種別判定 + 5 台警告 のスケルトン）/ 仕上げは 4/27 |
| 採番マスタ参照 | 672 (jbm) / 673 (sjbm) （read のみ） |
| 既存アプリ操作 | **絶対しない**（594 / 627 / 626 / 667 への write 厳禁） |
| 浜田負担 | 約 2 時間想定（20:00 〜 22:00） |

> **スペースの置き場所（浜田指定・2026-04-27）**  
> 新・PC台帳ver.1（674）は **スペース 21** に置く。**ブラウザで開く URL**: [https://jbis-kintone.cybozu.com/k/#/space/21](https://jbis-kintone.cybozu.com/k/#/space/21)。**浜田の所属部署が使うスペース**であり、**アクセス権限がある**（アプリ掲示・スレッド 23 への所属などは浜田側で調整可能）。

---

## §1. ミス防止三層チェック

### Layer A: 事前準備で 80% 排除（20:00 までに完了 / 本ファイル §3 で詳述）

- [x] kintone:test 拡張（**9 apps** ＝ 594/595/626/627/670/671/672/673/**674** 全件疎通 OK / `scripts/kintone-connection-test.js` に 674 追加済 / 20:00 直前にも再実行推奨）
- [x] field-spec-diff.mjs で「仕様書 vs add-form-fields 引数」を機械照合（2026-04-27: `--spec=本書` vs `--actual=data/snapshots/674-step3-after-deploy-20260426-174110.json` → **当時 35 fields all match** exit 0。**2026-04-28**: 正本 **42 件**（594 HW 7 項目）— 実 kintone は **add-form-fields 未反映の間は diff に warn が出る**のが正常）
- [x] customize 雛形 JS (lint:customize pass 済) を事前作成（`customize/new-pc-ledger-v1/desktop.js` / BUILD `2026-04-26-day4-skeleton-v0.2` / 2026-04-27 `npm run lint:customize` exit 0）
- [x] revision-snapshot.mjs で deploy 直後の自動 backup 仕組み準備（スクリプト既存 / 2026-04-27 実走 `674-order2-layer-a-readiness-*` 生成・live revision=9・43 fields 確認）
- [x] このアクション plan 書を浜田が一読（**2026-04-27**: 読み物 1/5〜5/5 で通読・Layer B の「引数」は平易説明済・§2 は他担当者向けにも重要と確認）

### Layer B: ステップ実行時のチェック（§4 Step 1-7 で詳述）

- [x] **MCP write 直前**: 引数を chat に丸ごと dump → 浜田明示 GO 取得（**2026-04-27 Tier B GO**「GOでお願いします。」）
- [x] **app: 値が 594/595/626/627/670/671/672/673 ではない**ことを AI が verbalize（**674 のみ**）
- [x] **MCP write 直後**: revision-snapshot.mjs 自動実行（rollback 用）（`go-post-apply-labels` / `go-post-deploy-674`）
- [x] **deploy 直後**: get-form-fields → field-spec-diff.mjs で 100% 一致確認（**2026-04-27 時点 35/35**。**2026-04-28** 正本 42 件化後は再 GO で **42/42** 目標）

### Layer C: 事後検証（§5 で詳述）

- [x] kintone-apps.md に 674 行追記（2026-04-27: **アプリ一覧表**＋保守メモ見出しに 674。詳細フィールド一覧は `npm run app:fields 674` で後追い可）
- [x] autonomy-decisions ログ作成（`logs/autonomy-decisions/PC-ledger-day4-2026-04-27-go.md`）
- [x] checkpoint-latest.md 更新（2026-04-27 GO 結果を **最終更新** に反映済）
- [ ] chat-sessions/2026-04-26.md 更新（任意・日次ログ）
- [x] commit（`-F file` / **`a2d4a0f`**）→ push → lock release（**push 済** `main`）

---

## §2. フィールド一覧（仕様書 §4.2 完全版 / 44 フィールド）

### 2.1 PC 基本情報（全種別共通 / 19 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 1 | `pc_name` | SINGLE_LINE_TEXT | true | false | 個人=JBIS****-YYYYMM / 共有=S-JBIS****-YYYYMM / JR=手入力 |
| 2 | `pc_serial_no` | NUMBER | false | false | PC 名の 4 桁採番用内部カウンタ（§4.3.1・594 の台帳連番とは別） |
| 3 | `serial` | SINGLE_LINE_TEXT | false | false | シリアルナンバー（594 相当） |
| 4 | `manufacturer` | SINGLE_LINE_TEXT | false | false | メーカー（594 相当） |
| 5 | `model_name` | SINGLE_LINE_TEXT | false | false | モデル名／型式（594 相当） |
| 6 | `manufacturing_no` | SINGLE_LINE_TEXT | false | false | 製造番号（594 相当・`serial` とは別） |
| 7 | `fixed_ip_1` | SINGLE_LINE_TEXT | false | false | 固定 IP アドレス 1（594 相当） |
| 8 | `fixed_ip_2` | SINGLE_LINE_TEXT | false | false | 固定 IP アドレス 2（594 相当） |
| 9 | `extra_info_1` | MULTI_LINE_TEXT | false | false | その他情報 1（594 相当） |
| 10 | `extra_info_2` | MULTI_LINE_TEXT | false | false | その他情報 2（594 相当） |
| 11 | `account_type` | DROP_DOWN | true | - | options: [個人, 共有, JR端末, サーバーNAS, その他] / default=個人 |
| 12 | `pc_status` | DROP_DOWN | true | - | options: [利用中, 保管, 廃棄] / default=利用中 |
| 13 | `user_name` | SINGLE_LINE_TEXT | false | false | 利用者名（595 ルックアップ）|
| 14 | `dept_name` | SINGLE_LINE_TEXT | false | false | 所属名（595 から自動引用） |
| 15 | `group_name` | SINGLE_LINE_TEXT | false | false | 所属グループ（595 から自動引用） |
| 16 | `shared_terminal_name` | SINGLE_LINE_TEXT | false | false | 共有端末名（共有/JR で必須・customize で動的検証） |
| 17 | `purchase_date` | DATE | false | false | 購入日 |
| 18 | `latest_inventory_date` | DATE | false | false | 最新棚卸日 |
| 19 | `note` | MULTI_LINE_TEXT | false | false | 備考 |

### 2.2 アカウント情報（個人/共有 自動生成・JR 手入力 / 14 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 20 | `logon_name` | SINGLE_LINE_TEXT | false | false | jbm**** (個人) / sjbm**** (共有) / 手入力 (JR) |
| 21 | `logon_pw` | SINGLE_LINE_TEXT | false | false | =logon_name |
| 22 | `windows_name` | SINGLE_LINE_TEXT | false | false | logon_name (個人/共有) / 手入力 (JR) |
| 23 | `mail` | SINGLE_LINE_TEXT | false | false | 595 から（個人のみ） |
| 24 | `mail_acct` | SINGLE_LINE_TEXT | false | false | mail の @ 前 |
| 25 | `mail_pw` | SINGLE_LINE_TEXT | false | false | jb+ランダム4桁数字+K# |
| 26 | `m365_id` | SINGLE_LINE_TEXT | false | false | mail_acct + 環境設定マスタの M365_DOMAIN（個人）/ M365管理マスタから（共有/JR） |
| 27 | `m365_pw` | SINGLE_LINE_TEXT | false | false | logon_name + K#（個人）/ kent2511K#（共有/JR） |
| 28 | `gb_id` | SINGLE_LINE_TEXT | false | false | =mail_acct（個人のみ） |
| 29 | `gb_pw` | SINGLE_LINE_TEXT | false | false | =logon_name（個人のみ） |
| 30 | `sb_id` | SINGLE_LINE_TEXT | false | false | =mail_acct（個人のみ） |
| 31 | `sb_pw` | SINGLE_LINE_TEXT | false | false | =logon_name（個人のみ） |
| 32 | `vpn_id` | SINGLE_LINE_TEXT | false | false | 手入力 |
| 33 | `vpn_pw` | SINGLE_LINE_TEXT | false | false | 手入力 |

### 2.3 SKYSEA 関連（4 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 34 | `skysea_status` | DROP_DOWN | false | - | options: [未確認, インストール済, 未インストール, インストール対象外] / default=未確認 |
| 35 | `skysea_checked_at` | DATETIME | false | false | SKYSEA 最終確認日時 |
| 36 | `skysea_install_log` | MULTI_LINE_TEXT | false | false | SKYSEA インストール履歴 |
| 37 | `skysea_target_flag` | CHECK_BOX | false | - | options: [配信対象] |

### 2.4 M365 リンク参照（1 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 38 | `m365_master_record_id` | NUMBER | false | false | 紐付き M365管理マスタ レコード番号（共有/JR のみ） |

### 2.5 移行用 hidden（v2.1 §4.7.2 / 4 フィールド）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 39 | `import_source` | SINGLE_LINE_TEXT | false | false | "csv" or "" / バリデーション 2 系統判別用 |
| 40 | `legacy_pc_name_594` | SINGLE_LINE_TEXT | false | false | 旧 594 の PC 名（移行追跡用） |
| 41 | `legacy_record_id_594` | NUMBER | false | false | 旧 594 のレコード ID（移行追跡用） |
| 42 | `created_at_jst` | DATETIME | false | false | レコード作成 JST timestamp（後付け検索用） |

### 2.6 フィールドグループ（内部処理用 / 1）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 43 | `internal_system_meta` | GROUP | false | - | 表示名=**内部処理用** / `openGroup` 既定 **false**（閉じる）/ レイアウトで **pc_serial_no・import_source・legacy_pc_name_594・legacy_record_id_594・created_at_jst** を本グループ内に収容（`npm run pc-ledger:674:layout-internal-group`） |

### 2.7 フィールドグループ（SKYSEA処理用 / 1）

| # | code | type | required | unique | 備考 |
|---|---|---|---|---|---|
| 44 | `skysea_system_meta` | GROUP | false | - | 表示名=**SKYSEA処理用** / `openGroup` 既定 **false** / レイアウトで **skysea_status・skysea_checked_at・skysea_install_log・skysea_target_flag** を本グループ内に収容（`npm run pc-ledger:674:add-skysea-group-preview` → `npm run pc-ledger:674:layout-skysea-group`）/ customize は **初期閉＋全員編集可**、運上は浜田のみ周知（§4.2.3a） |

**合計**: 44 フィールド（594 相当 HW 7 + 内部メタ GROUP 1 + SKYSEA GROUP 1）

---

## §3. 事前準備チェックリスト（20:00 までに AI 完了）

| # | 項目 | 完了印 | 備考 |
|---|---|---|---|
| A0 | session-lock 取得 (holder=PC-ledger-day4-prep-2026-04-26) | ☑ 済 | 09:00 取得 |
| A1 | 本ファイル作成 | ☑ 済 | 本ファイル |
| A2 | kintone:test 拡張 (594-627 + 670-674 = **9 apps**) + 全件 OK 確認 | ☑ 済 | 09:00 初回 + **2026-04-27** 674 追加 |
| A3 | scripts/field-spec-diff.mjs（仕様 vs 実フィールド機械照合） | ☑ 済 | 2026-04-27: step3 snapshot **35 match**／2026-04-28: 正本 **42**（kintone 反映は別 Tier B） |
| A6 | scripts/revision-snapshot.mjs（deploy 前後 backup） | ☑ 済 | 2026-04-27 実走 `order2-layer-a-readiness` |
| A4 | customize 雛形 JS 骨組み + lint:customize pass | ☑ 済 | **`customize/new-pc-ledger-v1/desktop.js`**（674 用・Day4 雛形） |
| A5 | chat-sessions/2026-04-26-pc-ledger-day4.md 雛形 | ☑ 済 | 当日ログ用ファイルあり |
| B1 | 20:00 直前: session-lock 切替（holder=PC-ledger-day4-2026-04-26） | ☐ | 旧 lock release → 新 lock acquire |
| B2 | 20:00 直前: `npm run audit:parallel` = 0 点 | ☐ | 3 点以上で着手中止 |
| B3 | 20:00 直前: `npm run smoke` = **9/9** ✅（`smoke:quiet`） | ☐ | NG なら着手中止 |
| B4 | 20:00 直前: `npm run kintone:test` = **9/9** ✅ | ☐ | 674 含む疎通最終確認 |
| B5 | 浜田に「準備 100% / 着手可」報告 → **GO 待ち** | ☐ | GO もらってから §4 に進む |

---

## §4. 当日 7 ステップ手順（Day 3 と同型 + 強化）

> **前提条件（Step 1 より前）**: `SESSION-BOOTSTRAP-CHECKLIST.md` **フェーズ 1b 全体**（**1b-A Read → 1b-B 機械ゲート → 1b-C チャットテンプレ**）を **同一ターンで完了**していること。**「仕様確認しますか？」や「読みました」一文だけでは Step 1 に進まない**（オーダー通りに作れない）。正本は `docs/plans/2026-04-21-new-pc-ledger-spec.md` **§4.2.0〜§4.4**。44 フィールド根拠は `npm run field-spec:generate -- --spec=...` の **`[field-spec-diff] generated 44 fields`** で証跡化。

### Step 1: kintone-add-app（アプリ枠だけ作成）

#### 引数テンプレ

```json
{
  "name": "新・PC台帳ver.1",
  "space": 21
}
```

（`thread: 23` は **MCP スキーマ上は渡せない**。スペース掲示はデプロイ後に管理画面で確認。§0 参照）

- **AI 行動**: 上記引数を chat に dump → 「これで kintone-add-app を呼んで良いですか？」浜田 GO 待ち
- **GO 後**: MCP `kintone-add-app` 実行 → app ID（想定 674）取得 → **revision は環境により 1 ではない**（2026-04-26 実測: **プレビュー上 `2`**。以降は **GET preview の応答 revision を常に使う**）
- **直後**: `npm run revision:snapshot -- --app=<id> --label=step1-add-app`（`--app` / `--label` 形式。保存値は実測 revision）

### Step 2: kintone-add-form-fields（初期一括は 35 フィールド／正本は 44 まで段階追加）

#### 引数テンプレ（縮小版・実引数は §2 を JSON 化したもの）

```json
{
  "app": <674>,
  "properties": {
    "pc_name": { "type": "SINGLE_LINE_TEXT", "code": "pc_name", "label": "PC名", "required": true },
    "pc_serial_no": { "type": "NUMBER", "code": "pc_serial_no", "label": "PC連番", "required": false },
    ... (§2 の全 44 フィールド分 / 別途 scripts/field-spec-diff.mjs で完全版を生成可) ...
  },
  "revision": <Step1 直後の実測 revision。例: 2>
}
```

- **AI 行動**:
  1. §2 から 44 フィールドの完全 JSON を生成（`npm run field-spec:generate -- --spec=docs/plans/2026-04-26-pc-ledger-day4-action.md`）
  2. chat に dump（フィールド数を 44 と verbalize）。**表示ラベル（短文）**は `scripts/data/pc-ledger-v1-ui-display-labels.json`（`npm run pc-ledger:verify-labels-spec`）
  3. 「app: 674 (新・PC台帳ver.1) で間違いないですか？」浜田 GO 待ち
- **GO 後**: MCP `kintone-add-form-fields` 実行 → **revision は +1**（2026-04-26 実測: Step2 完了後 **3**）
- **直後**: `npm run revision:snapshot -- --app=674 --label=step2-add-form-fields`

### Step 3: kintone-deploy-app（本番反映）

#### 引数テンプレ

```json
{
  "apps": [
    { "app": 674, "revision": <Step2 直後の実測 revision。例: 3> }
  ]
}
```

- **AI 行動**: 引数 dump → 浜田 GO 待ち（**手順書の固定数字 2 に依存しない**。Step2 の PUT 応答 revision をそのまま使う）
- **GO 後**: `kintone-deploy-app` 実行
- **直後**: `kintone-get-app-deploy-status` で SUCCESS 確認（PROCESSING の場合は 5 秒間隔で 3 回まで polling）

#### Step 3b（推奨・表示ラベル = 短文正本）

- Step2 の `add-form-fields` は **code と型が主目的**で、画面上の **表示ラベル**は kintone 既定のままになりがち。**画面用の短いラベル**は **`scripts/data/pc-ledger-v1-ui-display-labels.json`** を正本とし、**§4.2 の長い「説明」文をそのままラベルに載せない**（仕様の意味は MD §4.2 側で担保）。
- 反映コマンド: **`npm run pc-ledger:apply-labels`**（浜田 GO 後・Tier B）→ revision は再 GET で確認。
- リポ内ゲート: **`npm run pc-ledger:verify-labels-spec`**（短文 JSON + §4.2.2 マトリクス指紋 + 拡張 JSON）

### Step 4: kintone-get-form-fields（現状取得）+ field-spec-diff（仕様 vs 実装 機械検証）

- **AI 行動**:
  1. `kintone-get-form-fields` (app=674) → 全フィールド定義取得、または `npm run revision:snapshot -- --app=674 --label=post-step4-verify`
  2. `node scripts/field-spec-diff.mjs --spec=docs/plans/2026-04-26-pc-ledger-day4-action.md --actual=<上記 JSON パス> --diff`（**`revision-snapshot` 出力全体をそのまま渡してよい**）
  3. **`npm run pc-ledger:verify-labels-spec`**（短文 JSON + §4.2.2 指紋 + 拡張）
  4. **diff 0 件**かつ verify OK なら次へ。1 件以上あれば調査 → 浜田に修正 GO を仰ぐ

### Step 5: customize JS upload（雛形のみ / lint pass 済）

#### 雛形の範囲（4/26 = Day 4 / 雛形のみ）

- [x] 種別判定（account_type 変更時の visibility 切替 = アカウント情報セクションの show/hide）
- [x] 5 台ライセンス警告（赤バナー雛形 / 実装は 4/27）
- [x] 自動生成ボタン（Day 5 本実装済・674 `new-pc-ledger-v1/desktop.js`。旧「Day 5 で実装」alert は廃止）
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
| C1 | kintone-apps.md に 674 行追記 | ☑ 済 |
| C2 | logs/autonomy-decisions/PC-ledger-day4-2026-04-26.md 詳細ログ作成 | ☑ 代替 | **`PC-ledger-day4-2026-04-27-go.md`** に Tier B 実行ログ記録（2026-04-27） |
| C3 | checkpoint-latest.md 更新（最新更新欄に Day 4 完遂を追記） | ☑ 済 | 2026-04-29: §5 追完に合わせて追記 |
| C4 | chat-sessions/2026-04-26.md / chat-sessions/2026-04-26-pc-ledger-day4.md 仕上げ | ☑ 済 | 2026-04-29: Day4 追記ブロックを `2026-04-26-pc-ledger-day4.md` に追加 |
| C5 | data/snapshots/674-deploy-final-2026-04-26.json (revision-snapshot.mjs 出力) git add | ☑ 代替 | **`674-day4-followup-customize-v076-20260429-*.json`**（rev 38）を 2026-04-29 取得・追加 |
| C6 | smoke-test 8/8 ✅ 再確認 | ☑ 済 | **smoke 10/10**（`smoke-test.mjs` 拡張後の検査数に準拠）2026-04-29 再実行 |
| C7 | commit (`-F file` 経由) → push → session-lock release | ☑ 済 | 本 commit で C7 まで完遂；lock ファイル不在のため release は不要 |

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

- **画面表示ラベル（短文）** + §4.2.2 マトリクス指紋 + 拡張 4: `npm run pc-ledger:verify-labels-spec`（`scripts/data/pc-ledger-v1-ui-display-labels.json` / `pc-ledger-spec-4222-ui-labels.json` / `pc-ledger-spec-field-extensions.json`）。**意味の正本**は §4.2 MD。**追加・変更の一覧**は `docs/plans/2026-04-26-pc-ledger-label-spec-changelog.md`
- ✅ §4.2.1 PC 基本情報 12 フィールド: 完全一致
- ✅ §4.2.2 アカウント情報 14 フィールド: 完全一致
- ✅ §4.2.3 SKYSEA 関連 4 フィールド: 完全一致
- ✅ §4.2.4 M365 リンク参照 1 フィールド: 完全一致
- ➕ 移行用 hidden 4 フィールド: 仕様書本体には記載されていないが §4.7.2 / §10.3 から導出
- ✅ 採番マスタ依存（672/673）: read のみ / customize 雛形では alert スタブで実装先送り
- ✅ M365管理マスタ依存（671）: customize 雛形では未参照（本実装は 4/27）

---

## §8. Day 4 完了条件

- [ ] App 674 が本番に存在し、**仕様書 §4.2 と一致**（field-spec-diff.mjs で機械検証）。**2026-04-27 GO 後**は `674-go-post-deploy-674-*` で **当時の 35/35**。**2026-04-28**: 594 HW + 内部 GROUP で正本 **43 件** → Tier B 後 **43/43**。**2026-04-28 以降**: SKYSEA GROUP（§2.7）を含め正本 **44 件** → **`pc-ledger:674:add-skysea-group-preview` + `pc-ledger:674:layout-skysea-group` + `deploy:674` + `apply-labels`** 後に **44/44** を再検証
- [x] **`customize/new-pc-ledger-v1/desktop.js`** が本番反映（`npm run deploy:674` **SUCCESS** / revision **10**）。種別切替の動作は **浜田目視**（Step 6 と合わせて確認推奨）
- [x] kintone-apps.md に 674 行が追加される（2026-04-27 済・revision 表記更新済）
- [x] logs/autonomy-decisions に Tier B ログが残る（**`PC-ledger-day4-2026-04-27-go.md`** 新設。旧ファイル名 `2026-04-26` は未作成のまま）
- [x] git に 1 commit + push（hash 記録 / -F file 経由）（**commit `a2d4a0f`**）
- [x] session-lock release（取得中なら release）— **2026-04-29 確認**: `.session-state/ai-session.lock` 不在のため不要

---

## §9. Day 5 (4/27) への申し送り

- [ ] customize 仕上げ:
  - 自動生成ボタン本実装（672/673 / 671 から払い出し）
  - 印刷ボタン本実装（627 のレイアウト移植）
  - 5 台ライセンス警告ロジック本実装（671 と連動）
  - 検索バー強化（オートコンプリート + 種別チップ）
- [ ] テンプレ CSV 配布（B-1 移行用・**本番取込は 4/30-5/2**／手順は仕様書 **§7.4.6**・**§8.3**。**日程・着手順の絶対正本・前倒し禁止は §9（§9.0）**—チャットや手順書だけで日付をずらさない）
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

- 仕様書本体: `docs/plans/2026-04-21-new-pc-ledger-spec.md` v2.1（**稼働カレンダー・スケジュール通り・前倒し禁止の単一正本は §9（§9.0）**／移行ブロック分担・時期表は **§7.4.6**、CSV ルートは **§8.3**）
- Day 3 plan: `docs/plans/2026-04-25-pc-ledger-day3-action.md`（同型構造の参照元）
- Day 1+2 plan: `docs/plans/_archive/2026-04-24-pc-ledger-day1-day2-action.md`
- アプリ ID 一覧: `kintone-apps.md`
- field-spec-diff: `scripts/field-spec-diff.mjs`（A3 で新規）
- revision-snapshot: `scripts/revision-snapshot.mjs`（A6 で新規）
- customize 雛形: `customize/674/desktop.js`（A4 で新規）
- 当日ログ: `chat-sessions/2026-04-26-pc-ledger-day4.md`（A5 で新規）
