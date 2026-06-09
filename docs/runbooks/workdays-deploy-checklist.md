# 687/688 工事稼働日数 — deploy チェックリスト（R6 承認）

表 UI または `workdays-calc-core.mjs` を触ったセッションは **deploy 前に必読**。

## 1. ビルド

```bash
npm run workdays:build-desktop      # 687
npm run workdays:build-desktop:688  # 688
```

## 2. ゲート（deploy スクリプトに組込済み）

```bash
npm run workdays:verify-built-ui -- 688   # または 687
npm run workdays:calc-gate
```

## 3. preflight → deploy

```bash
npm run cio:preflight:688 -- --note "（規律一行）"
npm run deploy:688
```

`deploy:688` / `deploy:687` は上記ゲート → preflight guard → deploy → **kintone-apps BUILD 同期** の順。

## 4. 手動確認（ゲート未カバー分）

- 月列は **(calYear, m) 昇順**（ループ index 順でない）
- 年列 DOM（`.wd688-year-col`）が表に存在

## 5. 計算正本変更時（R4）

`scripts/workdays-calc-core.mjs` を変えたら **同一セッション**で `workdays-calc-gate.mjs` を更新すること。

## 関連

- R2 月列ソート: `docs/runbooks/session-close-reflection-scope.md` 外 — AGENTS 補足は本 runbook §4
- 反省会スコープ: `session-close-reflection-scope.md`
