# 運用ガイドを Kintone に自動反映する

## あなたがすること（確認だけ）

1. 初回だけ: 社内 PC で `kintone-ai-lab` に移動し、次を実行した結果に `.env` の行を追記する。
2. 以降: 特になし（HTML を直した開発側が `publish` を流す）。

## 開発側が実行するコマンド（全自動）

前提: `.env` に `KINTONE_BASE_URL` / `KINTONE_USERNAME` / `KINTONE_PASSWORD`（＋ Basic があればそれも）。

| コマンド | 内容 |
|----------|------|
| `npm run ops-guide:init` | 初回: アプリ新規作成 → HTML をレコード投入 → `desktop.js` デプロイ。2回目以降: 同期+デプロイのみ。 |
| `npm run ops-guide:publish` | `docs/ops-guide/*.html` を Kintone に同期し、JS を再デプロイ（日常の更新はこれ）。 |

初回後、コンソールに出る次の 1 行を `.env` に保存する。

```env
KINTONE_OPS_GUIDE_APP=（表示されたアプリ ID）
```

## アプリをスペースに作りたいとき（任意）

```env
KINTONE_OPS_GUIDE_SPACE_ID=48
KINTONE_OPS_GUIDE_THREAD_ID=（スレッド ID）
```

未指定の場合はドメイン既定で作成を試みます（環境によっては失敗するため、そのときは上記を設定）。

## 仕組み

- Kintone アプリにフィールド `guide_slug` / `guide_title` / `guide_body_html` を持たせ、HTML をレコードに格納する。
- `customize/ops-guide/desktop.js` が一覧の先頭にタブ付きビューで HTML を表示する（レコード一覧は初期で隠し、「一覧を表示」で切替）。

## GitHub Actions（push したら本番 Kintone まで）

リポジトリに **`.github/workflows/ops-guide-kintone-publish.yml`** がある。`main` へ次のパスが push されると **`node scripts/ops-guide-kintone.mjs publish`** が走る（手動は **Actions → ops-guide-kintone-publish → Run workflow**）。

- `docs/ops-guide/**`
- `scripts/ops-guide-kintone.mjs`
- `customize/ops-guide/**`

### GitHub に登録する Secrets（Environment `kintone-collect` でも可）

| 名前 | 内容 |
|------|------|
| `KINTONE_BASE_URL` | 例: `https://jbis-kintone.cybozu.com` |
| `KINTONE_USERNAME` | レコード更新・カスタマイズ反映ができるアカウント |
| `KINTONE_PASSWORD` | 上記のパスワード |
| `KINTONE_OPS_GUIDE_APP` | 運用ガイドアプリ ID（数値のみ。初回 `ops-guide:init` で表示） |
| `KINTONE_BASIC_AUTH_USERNAME` | 任意（ドメイン前段 Basic があるとき） |
| `KINTONE_BASIC_AUTH_PASSWORD` | 任意 |

**注意**: パスワードログインはリポジトリ秘密情報になる。可能なら **専用のデプロイ用ユーザー**に権限を絞ること。

### PC 台帳など既存 customize の「push → 本番」

別ワークフロー **`.github/workflows/kintone-customize-deploy.yml`** が `customize/**` 変更時に **API トークン**で 594 等へアップロードする。こちらに必要なのは主に **`KINTONE_DOMAIN`** と **`KINTONE_API_TOKEN_594`** 等（ファイル先頭コメント参照）。運用ガイド用アプリを同じ方式に載せたい場合は、将来 `deploy-customize-api-token.js` 用に **App 専用トークン**とマトリクス追記が必要（現状は上記 `publish` ワークフローで十分なことが多い）。
