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

- [ ] 2 アプリとも本番に存在し、フィールドが `npm run app:fields` と一致  
- [ ] `kintone-apps.md` 更新履歴に 4/25 行が付く  
- [ ] `logs/autonomy-decisions.log` に Tier 判断が残る（該当操作があれば）
