---
name: kintone-create-app
description: >-
  kintone 新規アプリ作成の標準レーン。fields JSON → create-app スクリプト → deploy →
  App ID 記録。shared-mail 695/696・Apple ID 693/694 パターンを正本とする。
---

# kintone 新規アプリ作成レーン

## いつ使うか

- 新規アプリの **スケルトン作成**（fields + REST create + deploy）
- 業務改善 ver.02 案B1（新①②③④）
- 共有メール・Apple ID と同型のレーン

## 着手ゲート

| 条件 | 必須 |
|------|------|
| 仕様・fields レビュー済み | ✅ |
| 浜田 **実装OK / GO** | Tier B は必須 |
| Space / thread 確認 | ✅ |
| 凍結レーンと無関係 | checkpoint 凍結表を確認 |

## 標準手順（この順）

### 1. 正本確認

| 項目 | 正本 |
|------|------|
| フィールド定義 | `scripts/data/<app>-fields.json` |
| 仕様 | `docs/plans/*-spec.md` |
| App ID 記録 | `scripts/data/<app>-app-ids.json` + `docs/kintone-apps.md` |
| Space / thread | 仕様 § または env（例: `SHARED_MAIL_SPACE_ID`） |

### 2. fields JSON 検証

```bash
npm run verify:kintone-fields -- --file scripts/data/<app>-fields.json
```

### 3. create-app スクリプト（パターン）

参照実装:

| レーン | スクリプト | App |
|--------|-----------|-----|
| 共有メール DB | `scripts/shared-mail-create-db-app.mjs` | 695 |
| 共有メール Dash | `scripts/shared-mail-create-dash-app.mjs` | 696 |
| Apple ID | 同構造（`docs/plans/2026-06-02-apple-id-kintone-spec.md`） |

**create フロー（共通）**:

1. `findAppByName` — 既存なら **再作成しない**（idempotent）
2. `POST /k/v1/preview/app.json` — space + thread 指定
3. `deployApp` — 空アプリを一度 deploy
4. `POST /k/v1/preview/app/form/fields.json` — properties 投入
5. `PUT /k/v1/preview/app/settings.json` — 名前・説明・テーマ
6. `deployApp` — 最終 deploy
7. `saveAppIds` + `kintone-apps.md` 更新

**dry-run 必須**:

```bash
node scripts/<app>-create-db-app.mjs --dry-run
```

### 4. データ取込（任意・別フェーズ）

- Excel / CSV 取込は **create 完了後**の別スクリプト
- 設定マスタ等は **アプリ作成と分離**（業務改善: 新④ 30行）

### 5. 事後記録

```bash
npm run cio:second-reviewer:capture -- --app <id> --note "create-app 完了"
npm run cio:task-complete-seal -- --lane <lane-id> --scope "create-app 完了"
```

## 禁止

- **凍結中**プロジェクトへの前倒し create
- fields 未検証の create
- App ID 未記録のまま次フェーズへ
- customize（JS）を create と同時に着手（**スケルトン優先**）

## 業務改善 ver.02 への適用

`kintone-business-improvement-lane` を併読。  
Space **57** / thread は handbook 参照。  
新④ は **30行 + jinji + 評価20段階** を create 後に取込。

## ヘルパー

`scripts/lib/shared-mail-kintone.mjs` の `getKintoneConfig` / `fetchJson` / `deployApp` を流用可。  
レーン固有は `scripts/lib/<lane>-kintone.mjs` に切り出す。
