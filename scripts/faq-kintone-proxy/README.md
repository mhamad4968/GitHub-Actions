# faq-kintone-proxy

`faq-portal-full.html` 用。ブラウザはこのサーバの `/api/bootstrap` と `/api/portal-sync` だけを呼び、**API トークンはここ（`.env`）にだけ**置きます。

```bash
cp .env.example .env
# .env を編集
npm install
npm start
```

- 疎通: `GET /health`
- 詳細: リポジトリの `docs/faq-portal-external-web-kintone.md`
- **640／641 の役割**（`KINTONE_FAQ_APP_ID` は **640** のみ）: `docs/faq-apps-640-641.md`
