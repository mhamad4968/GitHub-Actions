# Excel UI customize — 二段構成標準（R23）

**制定**: 2026-06-18（浜田 GO — 夕反省提案 C）  
**適用**: **688 / 736 以降**の Excel 書式風 kintone UI（calc-core 分離型）

---

## 必須構成

| 層 | パス | 役割 |
|----|------|------|
| **編集正本** | `customize/<app>/desktop.ui.js` | UI・イベント・M 連動（人が編集） |
| **計算正本** | `scripts/*-calc-core.mjs` | 再計算・Excel 行グループ・gate 検算 |
| **レイアウト** | `scripts/*-excel-*-layout.mjs` | 罫線・groupKey・小計ラベル（736） |
| **ビルド** | `scripts/*-build-desktop.mjs` | ui + core → **`desktop.js` 生成** |
| **deploy 対象** | `customize/<app>/desktop.js` | **生成物 — 直編集禁止** |

---

## 標準コマンド

```bash
# 736
npm run jikkou-yosan:build-desktop
npm run deploy:736

# 688（workdays）
npm run workdays:build-desktop:688
npm run deploy:688
```

**deploy 前**に必ず build。`deploy:*` スクリプトに build 連鎖が無い場合は手動 build を先に実行。

---

## 禁止

- **`desktop.js` 直編集**（次回 build で上書き・gate 不整合）
- calc-core と UI に**同じ計算式を二重実装**（正本は calc-core のみ）
- build 未実行のまま deploy

---

## 参照実装

| アプリ | build スクリプト | calc-core |
|--------|------------------|-----------|
| **688** | `scripts/workdays-build-desktop-688.mjs` | `scripts/workdays-calc-core.mjs` |
| **687** | `scripts/workdays-build-desktop.mjs` | 同上 |
| **736** | `scripts/jikkou-yosan-build-desktop.mjs` | `scripts/jikkou-yosan-calc-core.mjs` |

---

## 新規 Excel UI アプリ追加時

1. `desktop.ui.js` + `*-build-desktop.mjs` を上記 688/736 から fork
2. `package.json` に `build-desktop` / `deploy:<id>` / `calc-gate` を追加
3. `kintone-apps.md` 機械表 + 詳細行を **deploy 前**に用意（R21）
4. 本 runbook と `docs/runbooks/excel-ui-pre-demo-checklist.md` を SPEC にリンク

---

## 関連

- R22 説明前: `docs/runbooks/excel-ui-pre-demo-checklist.md`
- R21 台帳: `npm run verify:cio-deploy-ledger-gate`
- R24 エイリアス: `scripts/data/jikkou-yosan-work-type-aliases.json`
