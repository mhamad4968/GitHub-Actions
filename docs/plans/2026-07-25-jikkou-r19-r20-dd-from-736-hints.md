# R-19 / R-20 DD 棚卸し（736 READ-ONLY ヒント · 2026-07-25 夕方）

**制約**: App **735/736 書込禁止**（[736 画面](https://jbis-kintone.cybozu.com/k/736/) は参照のみ）。実装反映は依頼者回答（早くて **7/27**）または浜田 GO 後。

## 突合メモ（CIO）

| 項目 | 736（現行・参照） | Ver.02（756 側・正本候補） | DD 含意 |
|------|-------------------|---------------------------|---------|
| R-19 名称規格 | `datalist` + `masterCache`（工種名・工種CD・種別・種別CD）を **コード表アプリ**から動的読込 | `scripts/data/jikkou-yosan-v2-excel-name-lists.json`（Excel DV 実測・プロファイル切替） | 736はマスタ連動、756は Excel 固定シード。依頼者リスト差し替え前は **Excel JSON を正**とし、736の動的マスタは「将来の選択中心化」参考 |
| R-20 取引先 | ブロック vendor 行 + 手入力中心（`sub_vendor` / mat vendor） | `vendors[]` 59件（`データマスタ!J3:J103`）をシード | 736はリスト強制が弱い。756は Excel 取引先をシード済み → **リスト外入力の扱い**だけ依頼者確認が残る |
| UI パターン | `datalist(id, items)` を複数（wt/cat/sub-type） | Chrome datalist 絞り込み対策コメントあり（`desktop.ui.js`） | 736の datalist 実装は参考可。ピクセル一致は求めない（SPEC A-07） |
| データ移行 | `migrate-from-736-*` モジュールあり | 735/736 WRITE 禁止のまま読取移行のみ設計 | Excel 完全移行は依頼者データ待ち（checkpoint 継続メモ3） |

## Step1 完了（2026-07-25 夕）— R-19 リスト外 × JSON 棚卸し

**正本**: `docs/plans/2026-07-20-jikkou-list-source-scan.md` §5 × `scripts/data/jikkou-yosan-v2-excel-name-lists.json`  
**機械**: `npm run verify:jikkou-name-lists-excel` → OK（UI pools/profiles 一致）

### JSON 規模（現状シード）

| プール | 件数 |
|--------|-----:|
| kindCore8 | 8 |
| kindLong | 49 |
| materialCats | 8 |
| paintProducts | 9 |
| vendors（R-20） | 59 |
| workTypeCode→profile | 42 |

### スキャン「リスト外」実測値 → JSON 収録状況

| Scan ID | 役割 | リスト外値 | 出現 | JSON | 判定 |
|---------|------|-----------|-----:|------|------|
| DV#1 | 名称 H 長リスト | `労務費（夜間）` | ×14 | **未収録** | **OPEN** — 候補追加 or 手入力維持を依頼者確認 |
| DV#6 | 名称 H 短8 | `工具･機械使用料` | ×13 | **未収録** | **OPEN** — 同上（中黒 `･` 表記注意） |
| DV#8 | 材料 name2帯 | `塗装記録表示シール` | ×2 | `materialCats` / `profiles.material.name1` にあり | **CLOSED（シード済）** — DV範囲外だったが JSON 側は材料カテゴリに含む |
| DV#2 | 明細I／取引先セル混在 | `今岡塗装` | ×1 | `vendors` | **R-20側** — 名称ではなく取引先誤配置の観測 |
| DV#2b | 同上 | `島津テクノリサーチ` | ×1 | `vendors` | **R-20側** — 同上 |

### 表記ゆれ（正規化候補・未確定）

- 全角スペース幅が項目ごとに異なる（例: `線閉責任者　　昼間` vs `重機誘導員　　　　　　昼間`）— Excel 原文どおりシード。**正規化は依頼者リスト確定後**（独断 trim 禁止）。
- 半角カナ製品名（`ｴﾎﾟｷｼ` 等）は `paintProducts` に Excel どおり保持。
- `各種保険料(任意保険）` — 開き `(` 半角・閉じ `）` 全角の混在を JSON 正として維持。

### Step1 結論（R-19）

1. 正式リスト整備の **穴は実質2語**: `労務費（夜間）` / `工具･機械使用料`（手入力実測）。
2. それ以外のリスト外は JSON シード済 or 取引先列の誤DV観測。
3. **実装変更はまだしない**（7/27回答 or 浜田 GO 後）。コンボ＋手入力可（U4）を維持。

## Step2 完了（2026-07-25 夕）— R-20 ＋ Ver.01再利用

詳細一覧: **`docs/plans/2026-07-25-jikkou-v01-reuse-and-r20-role-inventory.md`**

- 明細列 I サンプルは **すべて vendors(J) に含まれる**（二重DV）。取引先正本は J。
- **735 に取引先マスタは無い**。取引先は Excel J / `vendors[]` が正。
- Ver.01で再利用しやすいもの: 735コード表・発注支社・部門・桁種別（読取/seed）、736概念・migrateモデル。UIコードの無条件コピーはしない。

## Step3 完了（2026-07-25）— 単位差分＋表記ゆれ＋依頼者パック

- 単位: **`docs/plans/2026-07-25-jikkou-unit-and-kindlong-diff.md`** — Ver.02 CONFIRMEDが正。735は `㎡/日/回` のみ重複、`月`/`kg` は移植しない。
- 表記: Excel kindLong/material がUI正。735はCD裏取り。外注/直轄↔昼夜は別軸。
- 依頼者負担減: **`docs/plans/2026-07-25-jikkou-requester-confirm-pack-pre-0727.md`** — **確認3点のみ**（送付は7/27以降）。

## 依頼者回答待ちで進められること（書込なし）

1. ~~R-19~~ / ~~R-20~~ / ~~単位・表記ゆれ・確認パック~~ → **Step1–3 済**
2. **次手候補**: 返信テンプレ／回答後のJSON追記手順メモ（実装は回答 or 浜田GO後）
3. 736 画面の操作感は **目視ヒントのみ**（customize/736 編集・deploy しない）

## やらないこと

- `customize/736/**` 編集・deploy
- 旧 BUILD の 756 再 deploy
- 依頼者未回答の正式リストを独断で確定すること
