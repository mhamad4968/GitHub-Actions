---
name: kintone-deploy-lane
description: >-
  kintone customize デプロイの標準レーン。preflight → deploy → ポートフォリオ監査。
  アプリ ID は kintone-apps.md が正本。
---

# kintone デプロイレーン

## いつ使うか

- `customize/*/desktop.js` を変更した後
- 浜田 **実装OK / GO** 済みの変更のみ

## 手順

### 1. アプリ ID 確認

正本: `docs/kintone-apps.md`（または `scripts/data/*-app-ids.json`）

### 2. Preflight（必須）

```bash
npm run cio:preflight:<APP_ID>
```

例: `cio:preflight:696`（共有メール台帳）

### 3. Deploy

```bash
npm run deploy:<APP_ID>
```

### 4. 事後確認

```bash
npm run cio:audit:portfolio
```

厳格時: `npm run cio:audit:portfolio:strict`

## 禁止

- preflight **未実行**の deploy
- **複数アプリ同時 deploy**（1アプリずつ）
- 凍結中プロジェクトへの **前倒し deploy**

## 共有メール / Apple ID パターン参照

| レーン | 参考 |
|--------|------|
| 共有メール 695/696 | `scripts/shared-mail-*.mjs` |
| Apple ID 693/694 | 同構造の create + deploy |

## 4AI

Composer 単独デプロイ禁止 — `cio:guard:composer-interlock` 方針に従う。
