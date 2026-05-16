# customize デプロイ・先祖返り復旧 Runbook

**正本台帳**: `kintone-apps.md`（人間向け）＋ `data/cio-live-builds.json`（機械照合）  
**監査**: `npm run cio:audit:portfolio`（`--strict` で CI 同等）

## 症状

- 画面が古い（例: 678 で 677 新規リンクが復活、予実表が出ない）
- リポの `BUILD` と本番が一致しない

## 典型原因

1. **複数アプリ同時 push** で GHA がデプロイをスキップしていた（2026-05-16 以前）→ **修正済**（全 ID 順デプロイ）
2. **リポだけ更新**し `deploy:<app>` 未実行
3. **ブラウザキャッシュ**（Ctrl+F5）

## 復旧手順（CIO 自律）

```bash
# 1. 監査（不一致の特定）
npm run cio:audit:portfolio -- --strict

# 2. 対象アプリを再デプロイ
npm run cio:preflight:678 -- --note "restore-678"
npm run deploy:678

# 3. 再監査
npm run cio:audit:portfolio -- --strict
```

ポートフォリオ一括（**627 / 668(ops-guide) / 677–679 / 682–683 / 686**。定義: `scripts/cio-portfolio-apps.mjs`）:

```bash
node scripts/cio-sync-portfolio-deploy.mjs --note "portfolio-resync"
# 一部のみ: node scripts/cio-sync-portfolio-deploy.mjs --apps=627,668,686 --note "..."
npm run cio:audit:portfolio -- --strict
```

668 は `deploy:668`（内部で `ops-guide-kintone.mjs deploy`）。HTML 本文更新は別途 `npm run ops-guide:publish`。

## フォーム定義のバックアップ（任意・四半期推奨）

```bash
npm run cio:snapshot:portfolio
```

出力: `data/snapshots/<app>-portfolio-YYYY-MM-DD-*.json`

## API トークン（混同防止）

| 系統 | アプリ | 環境変数 |
|------|--------|----------|
| Security NEXT | 631/632 | `KINTONE_API_TOKEN_COLLECT` / `KINTONE_APP_ID=631` |
| ICT 掲示板 | 685 | `KINTONE_API_TOKEN_ICT_COLLECT`（**631 用を流用しない**） |
| customize デプロイ | 各 app | `KINTONE_USERNAME` + `KINTONE_PASSWORD`（プレビュー反映必須） |

## 変更履歴

- **2026-05-16**: 初版（678 先祖返り教訓・live-build registry・portfolio 監査）
