# 経理 FAQ を HTTP で配信する（ショートカット＝方式 1）

共有 **`\\192.168.1.250\インストールソフト\その他\keiri-faq`** に **`faq-portal-full.html`** を置いたあと、社員が **`http://…` の URL** から開けるようにする手順です。  
**社員はショートカット 1 クリックのみ**（Node・bat 不要）。**`file://` や UNC 直開きは使いません。**

前提・全体像: [`faq-portal-environment-setup-and-usage.md`](faq-portal-environment-setup-and-usage.md) ・ [`faq-portal-file-server-setup.md`](faq-portal-file-server-setup.md)

---

## 運用でそろえる 3 点（ここがずれると動かない）

| 項目 | 例（このドキュメントの想定） | 意味 |
|------|------------------------------|------|
| **社員がアドレスバーに出す URL** | `http://192.168.1.250:8080/faq-portal-full.html` | IIS や静的サーバの **バインド**（ポート含む）と一致 |
| **プロキシの `.env` の `CORS_ORIGINS`** | `http://192.168.1.250:8080` | **オリジンはスキーム＋ホスト＋ポートまで**（パスは書かない）。複数ならカンマ区切り |
| **HTML ビルド時の `proxy-url.txt`** | `http://192.168.1.250:3847` | **社員のブラウザから届く**プロキシの URL（`BIND_HOST=0.0.0.0`・FW で **3847** 解放） |

プロキシを **別マシン**に置く場合は、`proxy-url.txt` と FW の説明だけその IP／ホスト名に差し替えます。

---

## A. IIS で配信する（Windows Server／ファイルサーバに IIS がある場合）

1. **サーバ上の実フォルダ**をサイトの物理パスにする（推奨）  
   - 共有 `\\192.168.1.250\…\keiri-faq` の **裏側のローカルパス**（例: `D:\インストールソフト\その他\keiri-faq`）を IIS に指定すると設定が簡単です。  
   - **UNC を直接**物理パスにすると、アプリケーションプールの権限設定が必要になることがあります（可能だが上級者向け）。

2. **IIS マネージャー** → **サイト** → **ウェブサイトの追加**（または既存サイトの下に **アプリケーション／仮想ディレクトリ**）  
   - **バインド**: 例 `http`、**IP** `192.168.1.250` または「すべて未割り当て」、**ポート** `8080`（80 が空なら 80 でも可）。  
   - **物理パス**: 上記 `keiri-faq` フォルダ（`faq-portal-full.html` が入っている場所）。

3. **既定のドキュメント** に **`faq-portal-full.html`** を追加し、先頭に移動（ルート URL だけで開きたい場合）。

4. **静的コンテンツ** が有効であることを確認。

5. **ファイアウォール** で **TCP `8080`**（または選んだポート）の受信を社内 LAN から許可。

6. 動作確認: サーバまたは別 PC のブラウザで  
   `http://192.168.1.250:8080/faq-portal-full.html`  
   を開き、kintone 連携が動くか確認。

---

## B. IIS が無い／すぐ試したい：Node の静的サーバ（同一サーバ）

**192.168.1.250** に Node.js がある場合、`keiri-faq` フォルダをそのまま配信できます。

```bat
cd /d "D:\インストールソフト\その他\keiri-faq"
npx --yes http-server . -p 8080 -a 0.0.0.0 -c-1
```

- **`-a 0.0.0.0`** … 他 PC からアクセス可。  
- **本番**は **タスク スケジューラ** や **NSSM** で起動し、サーバ再起動後も自動起動させる。  
- ファイアウォールで **8080** を開ける。

※ 静的サーバは HTML を配るだけです。**kintone API は引き続き `faq-kintone-proxy`（3847 等）** が担当します。

---

## プロキシ側（必ず）

- **`BIND_HOST=0.0.0.0`**  
- **`.env` の `CORS_ORIGINS`** に **`http://192.168.1.250:8080`**（実際のスキーム・ホスト・ポートに合わせる）  
- 社員 PC から **`http://192.168.1.250:3847/health`** が開けるか確認

---

## HTML の再ビルド（`FAQ_API_BASE` を合わせる）

配信 URL を決めたら、**運用担当の PC**（リポジトリがあるマシン）で:

1. **`scripts\faq-windows\proxy-url.txt`** に **プロキシの URL を 1 行**（例: `http://192.168.1.250:3847`）。  
2. **`04-build-intranet-html.bat`** または **`START-社内FAQポータル.bat`** のビルド相当で **`out\faq-portal-full.html`** を生成。  
3. **`07-copy-to-share.bat`** で **`\\192.168.1.250\…\keiri-faq`** にコピー。

---

## 社員用ショートカット（.url）の作り方

リポジトリの **`scripts\faq-windows\`** で:

1. **`public-portal-url.example.txt`** を **`public-portal-url.txt`** にコピーし、**1 行目**に社員が開く **完成 URL** を書く（例: `http://192.168.1.250:8080/faq-portal-full.html`）。  
2. **`08-create-employee-shortcut.bat`** を実行 → **`配布用\経理FAQポータル.url`** ができます。  
3. その **`.url` を共有・メール・イメージ配布**し、社員はダブルクリックでブラウザが開きます。

---

## 画像が「Cannot GET /uploads/…%29」になるとき

Markdown の `![説明](URL)` の **閉じ括弧 `)` が URL に含まれる**と、末尾が **`%29`** のまま保存され、実ファイル名と一致せず 404 になります。

- **すぐ直す**: 該当 FAQ の回答から、画像 URL 末尾の **`%29` または `)` を削除**して保存し直す。  
- **恒久対策**: リポジトリの **`faq-portal-full.html`**（表示時に URL を正規化）と **`faq-kintone-proxy/server.mjs`**（末尾 `%29` / `)` を除いたファイル名でも配信）を **再デプロイ**し、プロキシを再起動する。

---

## 参照

| 内容 | ドキュメント / ファイル |
|------|-------------------------|
| 環境全体・社員の役割 | [`faq-portal-environment-setup-and-usage.md`](faq-portal-environment-setup-and-usage.md) |
| プロキシ・FW・順序 | [`faq-portal-file-server-setup.md`](faq-portal-file-server-setup.md) |
| Windows bat 一覧 | [`faq-portal-internal-windows-setup.md`](faq-portal-internal-windows-setup.md) |
| `public-portal-url.example.txt` | `scripts/faq-windows/` |
