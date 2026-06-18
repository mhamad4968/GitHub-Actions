# ルール更新 R21–R24 — 浜田 GO（2026-06-18 夜）

> **承認者**: 浜田  
> **承認文**: 「OKです。すべて承認します。明日に備えてほしいです」  
> **起源**: `docs/reports/2026-06-18-evening-reflection.md` 提案 A–D

---

## 承認一覧

| ID | 起源 | 概要 | 実装 |
|----|------|------|------|
| **R21** | 提案 A | deploy SUCCESS 後 **registry + kintone-apps 機械表** 未同期なら **セッション締め NG** | ✅ `verify-cio-deploy-ledger-gate.mjs` + `sync-kintone-apps-build.mjs` 強化 + session-close 連鎖 |
| **R22** | 提案 B | Excel 正本 UI **担当説明前チェックリスト**（§9 + gate + 超リロード） | ✅ `docs/runbooks/excel-ui-pre-demo-checklist.md` + `jikkou-yosan:pre-demo-gate` |
| **R23** | 提案 C | **688/736 型** `desktop.ui.js` + `build-desktop.mjs` 標準 — `desktop.js` 直編集禁止 | ✅ `docs/runbooks/excel-ui-customize-two-stage.md` |
| **R24** | 提案 D | 工種名エイリアス **JSON 正本**（M735 名称 ↔ 画面表示） | ✅ `scripts/data/jikkou-yosan-work-type-aliases.json` + build 注入 |

---

## コマンド早見

```bash
npm run verify:cio-deploy-ledger-gate      # R21 — 締め前 / deploy 後
npm run sync:kintone-apps-build -- 736    # 台帳 BUILD 同期
npm run jikkou-yosan:pre-demo-gate       # R22 — 736 担当説明前
```

---

## 正本リンク

- 夕反省: `docs/reports/2026-06-18-evening-reflection.md`
- 736 仕様 §9: `docs/plans/2026-06-18-jikkou-yosan-spec.md`
- ルール MDC: `.cursor/rules/cio-deploy-ledger-gate.mdc`
