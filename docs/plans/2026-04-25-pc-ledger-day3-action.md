# PC 台帳 Day 3 — WindowsID 採番マスタ 2 アプリ（P1）

**作成**: 2026-04-25  
**前提**: Day 1（670 環境設定）・Day 2（671 M365）完了済み  
**正本仕様**: `docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.3.2・§2 アプリ一覧（アプリ 4・5）  
**遵守**: §51（直列）/ §52-3（Q1–Q6）/ §55（異常時は縮小）/ kintone 書込は **浜田 GO 毎ステップ**

---

## ゴール

| # | アプリ名（想定） | 役割 | WindowsID 規則（新規発番） |
|---|------------------|------|----------------------------|
| A | **新個人WindowsID採番マスタ** | 旧 626 置換 | `^jbm\d{4}$`・開始 `jbm0001` |
| B | **新共有WindowsID採番マスタ** | 旧 667 置換 | `^sjbm\d{4}$`・開始 `sjbm0001` |

アプリ ID・フィールドコードは **`npm run app:fields <ID>`** で正本確認（§4）。

---

## フィールド案（626 を簡素化した起票用・**確定は get-form-fields で検証**）

旧 **626** に倣いつつ、v2.1 では **WindowsID 払い出し**が主目的。最低限:

| code | 型 | 備考 |
|------|-----|------|
| `logon_name` | SINGLE_LINE_TEXT | 払い出した ID（UNIQUE 推奨） |
| `used_count` または状態 | DROP_DOWN | 未使用/使用済 等（626 踏襲可） |
| `note` | MULTI_LINE_TEXT | 任意 |

JS・ボタン連携は **Day 4 以降（新・PC台帳 ver.1 customize）** で本実装。Day 3 は **マスタの器と初期レコード方針**まで。

---

## 1 アプリあたり 6 Step（Day 1+2 と同型）

1. **AI**: `kintone-add-app` 引数テンプレ提示 → **浜田 GO**  
2. **AI**: add-app 実行 → app ID 確定  
3. **AI**: `kintone-add-form-fields` 引数提示 → **浜田 GO** → 実行  
4. **AI**: `kintone-deploy-app`（または相当）→ **浜田 GO**  
5. **浜田**: 必要なら CSV 取込（**初期は空またはテスト 1 件**で可。本格プールは customize 後）  
6. **AI**: `get-records` で件数確認・`kintone-apps.md`・checkpoint 更新・commit

**禁止**: 並列 MCP、scope 外の 627 リファクタ等（§52-3 Q6）

---

## 仕様書との突合ポイント

- 新規発番は **4 桁厳格**（移行 CSV 時の緩和パターンとは別ルート・§4.7.2）  
- JR 端末は **自動採番対象外**（仕様 §4.3.2）

---

## 完了条件

- [x] 2 アプリとも本番に存在し、フィールドが `npm run app:fields` と一致 ✅ **2026-04-25 達成**
- [x] `kintone-apps.md` 更新履歴に 4/25 行が付く ✅ **2026-04-25 追記済**
- [ ] `logs/autonomy-decisions.log` に Tier 判断が残る（該当操作があれば）

---

## ✅ 完了報告（2026-04-25 / 07:50 完了）

### 実施結果

| # | アプリ名 | App ID | logon_name 制約 | revision | deploy 状態 |
|---|---------|--------|-----------------|----------|-------------|
| A | 新個人WindowsID採番マスタ | **672** | `^jbm\d{4}$` 厳格 / unique:true / minLength=maxLength=7 | 3 | SUCCESS |
| B | 新共有WindowsID採番マスタ | **673** | `^sjbm\d{4}$` 厳格 / unique:true / minLength=maxLength=8 | 3 | SUCCESS |

### フィールド構成（両アプリ共通 / 標準フィールド除く）

| code | type | required | unique | 備考 |
|------|------|----------|--------|------|
| `logon_name` | SINGLE_LINE_TEXT | true | true | A: minLength/maxLength=7 (jbm + 4 桁) / B: =8 (sjbm + 4 桁) |
| `status` | DROP_DOWN | true | - | options=[未使用/使用済/無効] / default=未使用 |
| `note` | MULTI_LINE_TEXT | false | - | 自由メモ（任意） |

### 仕様書との整合（§4.3.2）

- ✅ 新規発番は厳格 4 桁ゼロ埋め（minLength=maxLength で物理的に強制）
- ✅ unique 制約で二重発番事故を物理的に防止
- ✅ 既存移行ルート（5-6 桁許容 / `^jbm\d{4,6}$`）は本マスタを経由せず、新・PC台帳ver.1 直接登録（仕様 §4.7.2）→ 採番マスタ側は厳格のみで OK
- ✅ JR 端末は自動採番対象外（仕様 §4.3.2）→ 本マスタの管轄外

### MCP 工程（直列実行）

1. `kintone-add-app` (App A) → revision 2 / app=672
2. `kintone-add-form-fields` (App A / 3 fields) → revision 3
3. `kintone-deploy-app` (App A) → SUCCESS（kintone-get-app-deploy-status で確認）
4. `kintone-add-app` (App B) → revision 2 / app=673
5. `kintone-add-form-fields` (App B / 3 fields) → revision 3
6. `kintone-deploy-app` (App B) → SUCCESS
7. `kintone-get-form-fields` (App A & B) → 仕様完全一致を確認

### 設計判断のメモ（Day 4 以降の参考）

- **Day 3 は「器のみ」方針**: payout 追跡フィールド (`assigned_to` / `assigned_at`) は意図的に未追加。Day 4 customize 設計時に「採番ボタン」の挙動と合わせて追加要否を再判断する（YAGNI 寄り判断）。
- **status の default=未使用** にしたので、CSV 一括投入時に status を省略しても自動で「未使用」プールに入る → 初期データ投入が楽になる。
- **「予約済」状態の追加検討**: Day 4 で「採番ボタン押下中」の中間状態が必要なら status の options を 4 つに拡張可能（今は 3 つ：未使用/使用済/無効）。

### Day 4 への申し送り

- [ ] 新・PC台帳ver.1（Day 4 で作成予定）から 672/673 を呼ぶ採番ボタン UI 実装
- [ ] 初期データ投入: jbm0001〜jbmXXXX / sjbm0001〜sjbmXXXX（必要数を浜田と決定）
- [ ] 旧 626（1993 件）/ 旧 667（40 件）の凍結タイミング決定（5/13 月曜本番切替日）
- [ ] 旧 626/667 のリネーム + 権限変更（書込ロック）

### Tier 判断ログ（§52）

- **Tier B**（kintone API write）: 浜田 GO「仕様通りに作成してね。確認はするよ」07:46 にて全工程一括承認
- 並列禁止（§51）遵守: MCP 呼出は 1 件ずつ順次実行（応答受領後に次へ）
- 異常時縮小（§55）発動なし: 全 MCP 呼出が 1 発 SUCCESS
