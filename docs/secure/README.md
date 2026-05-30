# 暗号化 .env バックアップ（Self-Healing Env）

**正本**: `scripts/lib/cio-env-self-healing.mjs`

## 前提

- 暗号化ファイル: `docs/secure/.env.enc`（**値はリポジトリに平文で置かない**）
- 復号マスターキー: 環境変数 **`CIO_ENV_MASTER_KEY`** のみ（64 hex または passphrase）
- **リポジトリにマスターキーを commit 禁止**（§52-8）

## 初回セットアップ（浜田ローカル）

```bash
CIO_ENV_MASTER_KEY=<your-secret> npm run cio:env:encrypt-backup
```

## 自律復旧

```bash
npm run cio:env:self-healing
```

不足キーを `.env.enc` から復号・マージ後、`verify:cio-env-integrity` を再実行。

## 判定

| コマンド | exit 0 |
|----------|--------|
| `npm run cio:env:self-healing` | 補完後 env 整合 |
| `npm run verify:cio-env-integrity` | 鍵充足 |
