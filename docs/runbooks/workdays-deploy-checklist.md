# 687/688 工事稼働日数 — deploy チェックリスト（R6 + R10 承認）

表 UI または `workdays-calc-core.mjs` を触ったセッションは **deploy 前に必読**。

## 0. 一括ゲート（R10）

```bash
npm run workdays:deploy-gate -- 688   # または 687
```

= **R1** `workdays-verify-built-ui` + **R4** `workdays-calc-gate`。`deploy:687` / `deploy:688` に組込済。

## 1. ビルド

```bash
npm run workdays:build-desktop      # 687
npm run workdays:build-desktop:688  # 688
```

## 2. preflight → deploy

```bash
npm run cio:preflight:688 -- --note "（規律一行）"
npm run deploy:688
```

`deploy:688` / `deploy:687` の順: **deploy-gate** → preflight guard → deploy → **R3** `sync-kintone-apps-build`（deploy 成功時自動）。

## 3. 手動確認（ゲート未カバー分）

- 月列は **(calYear, m) 昇順**（ループ index 順でない）— **R2**
- 年列 DOM（`.wd688-year-col`）が表に存在

## 4. 計算正本変更時（R4）

`scripts/workdays-calc-core.mjs` を変えたら **同一セッション**で `workdays-calc-gate.mjs` を更新すること。

## 承認

| ID | 内容 | 承認日 |
|----|------|--------|
| R1 | UI マーカー grep | 2026-06-09 + 2026-06-10 再確認 |
| R2 | 月列ソート | 同上 |
| R3 | BUILD 同期 | 同上（`deploy-customization.js`） |
| R4 | calc-gate | 同上 |
| R5 | 締めスコープ | `session-close-reflection-scope.md` |
| R6 | 本 runbook | 同上 |
| R10 | deploy-gate 一括 | **2026-06-10 浜田 GO** |

## 関連

- 反省会スコープ: `docs/runbooks/session-close-reflection-scope.md`
- 6/9 詳細: `docs/reports/2026-06-09-evening-reflection.md`
- 6/10 承認: `docs/approved-changes/2026-06-10-rules-r1-r12-hamada-go.md`
