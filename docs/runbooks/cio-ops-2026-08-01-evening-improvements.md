# 運用・規則改善 — 2026-08-01 夕反省（浜田全承認）

**GO**: `docs/approved-changes/2026-08-01-evening-reflection-hamada-go.md`  
**Cursor 規則**: `.cursor/rules/cio-ops-2026-08-01-evening-improvements.mdc`（`alwaysApply: false`）  
**憲法本文**: 変更なし  
**由来**: 756 Excel 原価管理明細（並びミス・11100 二重・ENSURE 区分の施工固定）

---

## 行動（A）

### A1 — 並びは業務クラスタ単位

並び替え前に **工事がらみ名称枠**（軌道工事〜追加工事等）と **コード付き賃金／経費枠** を分ける。浜田の業務語（「工事がらみ」等）を先に確認する。コード番号順だけで名称枠を押し下げない（**R-EXCEL-PLACE-01**）。

### A2 — 新規枠後の二重目視

Excel 枠追加の deploy 後、同一システム工種コードが原価管理に二重に出ていないか目視1巡する。

### A3 — 保安系は区分も確認

11100 系など保安コードは、費目・種別に加え **区分（施工／保安）** をコード表／Excel で確認してから ENSURE する。

---

## ルール・脚本（S / R）

### S-DEDUP-01 — 同一コード重複は表示 omit

`jy2CostMgmtDuplicateCodedBlockIdSet`。内訳 App757 は非破壊。phase4d BUILD assert で針を維持。

### S-CAT-01 — ENSURE 区分はコード表 resolve

`jy2CostMgmtEnsureCodedFrameList` は `jy2ResolveCostCategoryFromWorkType` を使う。硬コード「施工」禁止。

### S-ORDER-01 — 配置順の固定

原価管理の意図順: **10700 → 名称枠群 → 10800 → 10900 → オペレーター → その他コード枠**。変更時は同ターン SPEC 更新。

### R-EXCEL-PLACE-01

並び替えは業務クラスタ単位。コード番号順だけで名称枠を押し下げない。

---

## 体制・運用（O）

### O-756-01 — 枠追加受入ミニチェック

新規／再表示 Excel 枠の deploy 前（または直後）に次を確認:

1. 費目名（Excel 正）  
2. 種別数・名称  
3. 区分（施工／保安）  
4. 同一システム工種コードの二重なし  
5. 並びクラスタ（名称枠 vs コード付き）

クロム受け入れ表の **#12** と同旨。

### O-756-02 — 1枠=1 deploy

連続枠追加（例: 11100→11200→11300）は **1枠=1 deploy** を維持。まとめ deploy は浜田明示時のみ。

### O-GHA-01 — 日終わり GitHub

日終わりの GitHub 確認は「最新 success」に加え、**当日 tip に失敗 run が残っていないこと**を1行報告する。確認手段は **`gh run list`**（**M-2**）。

---

## ルール・憲法まわり（C）※本文は触らない

### C-EXCEL-01 — #R-EXCEL-UI-09 区分

コード表 himoku／種別は原価管理の正ではない、に加え、**区分もコード表 resolve。ENSURE で施工固定しない**（SPEC 注記）。

### C-EXCEL-02 — 756 UI 夕反省

App756 見た目／Excel 枠レーンの夕反省では **§体制・運用を空にしない**（並び・二重・区分のどれか1つは必ず書く）。`evening-reflection-scope.md` 追記。

---

## MCP 最適化（M）

### M-1 — 連続枠は repo Grep 優先

756 連続枠追加ターンのコード表確認は **`desktop.ui.js` 内 hierarchy の Grep 優先**。外部 MCP／コード表アプリ検索は浜田が明示したときだけ。

### M-2 — GitHub は `gh` 正

日次／締めの GitHub 確認は Shell の `gh run list`（失敗時 `gh run view --log-failed`）。browser MCP は使わない。

### M-3 — sequential-thinking の上限

並び・二重の議論で使う場合は **仮説1つ＋根拠ファイル行**まで。実装前に浜田へクラスタ確認1問だけ出す（推測実装の抑制）。
