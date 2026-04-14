経理FAQポータル — ファイルサーバー／配布サーバー向け
================================================================

【配布用アーカイブの場所】
  この README と同じフォルダ（scripts/）にある:
    faq-portal-fileserver.tar.gz

  リポジトリを clone した直後で .tar.gz が無い場合は、リポジトリのルートで次を実行:
    bash scripts/package-faq-deploy.sh

  ※ 以前の dist/ 配下だけに作っていたため、Git に含まれず Windows 側のコピーには出てこなかったことがあります。
    以降は上記スクリプトで scripts/ に再生成できます。

----------------------------------------------------------------

【同梱物】faq-portal-fileserver.tar.gz を展開すると次の構成になります。

  scripts/faq-portal-full.html          … ポータル本体（ブラウザ用）
  scripts/faq-kintone-proxy/            … Node プロキシ（kintone 認証はサーバー側のみ）

【重要】HTML 単体を静的ファイルサーバーだけに置く場合、kintone のトークンを
ブラウザに置けないため、必ず別途プロキシを動かし、HTML 先頭付近で API の
ベース URL を指定してください（同一オリジンで Node が HTML も配信する場合は不要）。

  <script>window.FAQ_API_BASE = 'https://プロキシのURL';</script>

【Node プロキシ側のセットアップ】

  1. Node.js 20 以上をインストール
  2. cd scripts/faq-kintone-proxy
  3. cp .env.example .env  … 中身を本番用に編集（.env は配布に含めない）
  4. npm ci または npm install
  5. npm start

  既定では http://0.0.0.0:8080 で HTML + API が同じポートから提供されます。

【.env に含めないこと】

  本番のパスワード・API トークンは zip/tar に入れず、サーバー上で直接 .env を作成してください。

詳細ドキュメント: リポジトリ docs/faq-portal-external-web-kintone.md
