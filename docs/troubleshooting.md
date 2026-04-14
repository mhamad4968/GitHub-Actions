# トラブルシューティング集

過去の障害・不具合の原因と解決策を蓄積する。RAG でセマンティック検索可能。
新しい知見が得られたら **末尾に追記** し、`npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/troubleshooting.md` で再インデックスする。

---

## TSB-001: kintone 画像埋め込みが 404 になる（fileKey の有効期限問題）

| 項目 | 内容 |
|------|------|
| **発生日** | 2026-04-14 |
| **対象** | 経理FAQポータル（App 640）、`faq-portal-full.html` + `server.mjs` |
| **症状** | ユーザーが画像を貼り付け→保存後、画像が壊れアイコンになる。コンソールに `kintone file download 404: GAIA_BL01 ... not found` |
| **根本原因** | kintone ファイルアップロード API (`POST /k/v1/file.json`) が返す `fileKey` は **一時的**（レコード保存前のみ有効）。レコード保存後に kintone が **恒久 fileKey** を割り当てるが、answer テキスト内のマーカー `![name](file:一時キー)` はそのまま残る。一時キーで `GET /k/v1/file.json` すると 404 |

### 解決策（3層防御）

1. **サーバー側 resolveFileKeys（server.mjs）**
   - レコード POST/PUT 後に即座にレコードを再取得し、恒久 fileKey を取得
   - answer テキスト内の一時キーを恒久キーに **ファイル名ベース** で置換
   - 置換後のテキストで再度 PUT し永続化

2. **クライアント側 Blob URL（faq-portal-full.html）**
   - アップロード直後に `URL.createObjectURL(file)` で Blob URL を生成
   - `_blobUrlMap[一時キー] = blobUrl` で保持し、`fileUrl(key)` で Blob URL を優先返却
   - 保存完了後、サーバーから返る恒久キーにファイル名マッチングで Blob URL を引き継ぎ
   - `reload()` 完了後に全 Blob URL を `revokeObjectURL` で解放

3. **ブートストラップ自動修復（server.mjs recordToFaq）**
   - ページ読み込み時（`/api/bootstrap`）にレコードの answer を走査
   - 一時キーが残っていれば恒久キーに置換し、バックグラウンドで kintone に PUT
   - 過去の壊れたレコードも自動修復される

### 第4層防御: 動的 fileKey 解決（2026-04-14 追加）

上記3層に加え、**レコードIDベースの動的解決API**を追加:

4. **サーバー側 `/api/resolve-file/:recordId/:index`（server.mjs）**
   - 画像が404になった場合、クライアントがレコードIDとインライン画像のインデックスでリトライ
   - サーバーがレコードから最新の恒久fileKeyを取得し、ファイルを返却
   - ファイル名の文字化け（mojibake）や名前衝突に依存しない確実な解決手段

5. **クライアント側 onerror リトライ（faq-portal-full.html）**
   - `<img>` の `data-record-id` と `data-img-idx` を使い、404時に自動で `/api/resolve-file` へフォールバック
   - 一時keyで初回取得が失敗しても、レコードIDベースで2回目に成功する
   - 2回目も失敗した場合のみプレースホルダーを表示

### UI 改善: 編集ボタンの summary タグ外移動（2026-04-14）

- 編集/削除ボタンを `<details>` 内部からカードレベル（`<details>` の外）に移動
- FAQ を展開しなくても編集操作が可能に
- `<summary>` のクリックイベントとボタンのクリックの競合を解消

### 教訓

- kintone の fileKey は **アップロード直後は一時的** で、**レコード保存後に恒久キーに変わる**。この2段階を理解せずにキーをそのまま使うと必ず 404 になる
- 画像プレビューは **Blob URL** を使えばネットワークリクエスト不要で即表示できる
- ブラウザキャッシュが古い HTML/JS を保持していると、修正済みコードが反映されない。ユーザーに **Ctrl+Shift+R（ハードリフレッシュ）** を案内する
- **ファイル名の文字化け（mojibake）** は名前ベースのマッチングを無効化する。位置ベースまたはレコードIDベースのフォールバックが不可欠（表示名・`Content-Disposition` の対策は **TSB-004**）
- 操作ボタンは `<details>` や折りたたみ要素の外に配置すべき。展開が必要な操作は UX を損なう

---

## TSB-002: MCP サーバーが赤ランプになる（mcp.json 設定消失・互換性問題）

| 項目 | 内容 |
|------|------|
| **発生日** | 2026-04-14 |
| **対象** | `~/.cursor/mcp.json` 内の複数サーバー |
| **症状** | Cursor 再起動後、MCP サーバーのほとんどが赤ランプ（エラー）表示 |

### 原因と対策

| サーバー | 原因 | 対策 |
|----------|------|------|
| 全般 | `mcp.json` が空になっていた（Windows 側からのコピー漏れ） | Windows 側のバックアップから復元 |
| kintone / kintone-space | `env` ブロック（`KINTONE_BASE_URL` 等）が未設定 | `env` を `mcp.json` に追加 |
| kintone-dev | `MCPServer.js` が MCP SDK の `StdioServerTransport` を使っていなかった | SDK を使った `mcp-entry.mjs` を新規作成 |
| kintone-space | ソースコード消失 + npm に存在しないパッケージ名 | `index.mjs` を MCP SDK で再構築 |
| markdownify | `@iflow-mcp/markdownify-mcp` が Node v24 非互換 | 削除（`fetch` MCP で代替） |
| office-powerpoint | Windows パスの WSL 変換漏れ | `/mnt/c/...` パスに修正 |

### 教訓

- MCP サーバーの設定は **`mcp.json` のバックアップ** を定期的に取る
- WSL 環境では Windows パス（`C:\...`）をそのまま使えない。`/mnt/c/...` に変換が必要
- MCP プロトコルテストは `echo '{"jsonrpc":"2.0",...}' | timeout 10 <command>` で JSON-RPC ハンドシェイクを確認できる
- `cwd` フィールドは Cursor で無視される場合がある。絶対パスで `args` に指定するか、ラッパースクリプトを使う

---

## TSB-003: Windows バッチファイル（.bat）が文字化け・構文エラーで動かない

| 項目 | 内容 |
|------|------|
| **発生日** | 2026-04-12 |
| **対象** | Loto7 アプリの `start_app.bat` |
| **症状** | `'rorlevel'`、`'tokens'`、`'縺ｧ髢九″縺ｾ縺吶'` 等の文字化けエラー |
| **根本原因** | WSL の Cursor（Write ツール）が UTF-8 + LF で `.bat` を保存。Windows CMD は CP932 + CRLF が必須 |

### 対策

- `.bat` / `.cmd` ファイルは **Write/StrReplace ツールを使わない**
- Shell で `printf '...\r\n'` を使い CRLF で書く
- バッチファイル内に **日本語を含めない**（日本語メッセージは Python 側で出力）
- 動作確認は `cmd.exe /c "..."` で行う
- 詳細: `.cursor/rules/windows-cross-platform.mdc`

---

## TSB-004: 配布資料のファイル名が文字化け（mojibake）する

| 項目 | 内容 |
|------|------|
| **発生日** | 2026-04-14 |
| **対象** | 経理FAQポータル `scripts/faq-kintone-proxy/server.mjs`（アップロード・ダウンロード中継）、`faq-portal-full.html`（表示） |
| **症状** | 配布資料リンクに `åå².png` のように表示される。本来は `分割.png` や `テスト.jpg` 等の日本語名であるべき |
| **根本原因（調査結果）** | **複合**。(1) **kintone REST** が返すレコード内の `attachment` / `inline_images` の `name` が、UTF-8 ファイル名を誤解釈した文字列として格納されているケース。(2) **プロキシの `GET /api/file`** が kintone の `Content-Disposition` をそのまま転送しており、**`filename*=UTF-8''...`（RFC 5987）** が無いとブラウザが `filename` のバイト列を誤って解釈する。(3) **`kintoneUploadFile`** が `FormData.append(..., Blob, filename)` のみで、環境によっては **非 ASCII ファイル名**が multipart で不適切に送られ、kintone 側の `name` が最初から壊れる。(4) **multer** 受信時、`originalname` が multipart の `filename` のエンコーディング（RFC 2231 / UTF-8）と一致しない場合に文字化けが残る |

### 修正方針（server.mjs）

1. **アップロード（`POST /api/upload` → `kintoneUploadFile`）**  
   - 受信: `repairKintoneFilename(String(req.file.originalname).normalize('NFC'))` で multer 由来の名前を補正してから kintone に送る。  
   - 送信: **`File` オブジェクト**を `FormData.append('file', file)` で渡す（Node 20+）。`File` が無い環境は従来どおり `Blob` + 第3引数 `filename`。  
   - 目的: UTF-8 の NFC 正規化されたファイル名を kintone ファイル API に渡す。

2. **ダウンロード中継（`GET /api/file/:fileKey` / `GET /api/resolve-file/...`）**  
   - kintone 応答の `Content-Disposition` を **パース**し（`filename*` 優先）、表示用に **`repairKintoneFilename`** を適用。  
   - ブラウザへは **`filename*=UTF-8''` + ASCII の `filename="..."` フォールバック** を付けた `Content-Disposition` を **再生成**してセット（kintone 生ヘッダのまま転送しない）。  
   - `inline` / `attachment` は元ヘッダを維持。

3. **JSON 表示（`/api/bootstrap`）**  
   - 既存の **`repairKintoneFilename`** を `recordToFaq` の `attachments` / `inlineImages` の `name` に継続適用（API 上の名前の補正）。

4. **修復判定の厳格化（半角カタカナによる latin1→UTF-8 バイパス問題）** — 2026-04-15 追記  
   - **事象**: kintone が返す `name` が、UTF-8 バイト列を **Latin-1 として解釈した文字列**（例: `ã...`）ではなく、**半角カタカナ（U+FF61–FF9F）中心**のゴミ文字列になるケースがある。  
   - **誤った実装**: `repairKintoneFilename` / `repairKintoneDisplayName` が「日本語らしさ」を **`/[\u3040-\u309F\u30A0-\u30FF\u3005-\u9FFF\uFF66-\uFF9F]/`** のように判定し、**半角カタカナを「すでに正しい日本語」**とみなして **latin1→UTF-8 修復をスキップ**していた。結果として、添付リンク表示が `ク.jpg` のように残る。  
   - **正しい判定（厳格条件）**: 「修復不要」とみなすのは **ひらがな（U+3040–309F）・全角カタカナ（U+30A0–30FF）・CJK 統合漢字（U+4E00–9FFF）** のいずれかが **1 文字でも**含まれる場合に限定する。半角カタカナ・々（U+3005）帯・Latin-1 拡張文字だけでは **修復不要としない**。  
   - **修復手順**: 厳格条件を満たさない文字列は、**必ず** `Buffer.from(s, "latin1").toString("utf8")`（ブラウザは `TextDecoder("utf-8")` で code unit をバイト化）を試行し、結果が厳格条件を満たし `\uFFFD` を含まなければ採用。それでも直らなければ従来どおり **Shift_JIS 経由**の補助修復を試す。  
   - **限界**: 元データが **半角カタカナのみ**で、UTF-8 バイト列として意味のある全角日本語に戻せない場合は据え置きとなる。**再アップロード**が必要なことがある。

5. **`GET /favicon.ico` の 204 応答** — 2026-04-15 追記  
   - ブラウザのデフォルト取得で **404** が大量に出ないよう、`server.mjs` で **`204 No Content`** を返すルートを定義する（本文なし）。HTML 側は `link rel="icon"`（data URL SVG）でタブアイコンを補完可能。

6. **ダウンロード名の二重経路（`?fn=` + SJIS 誤爆防止）** — 2026-04-15 追記  
   - **事象**: 画面上の配布資料リンクや、保存ダイアログのファイル名が **`åå².png`** のように残る。本文 Markdown 内の `分割.png` は正しいのに、添付フィールドの `name` だけが壊れている。  
   - **原因**: 本来の Latin-1 誤読列は `å` + **C1 制御**（U+0088, U+0086 等）+ `å` + … のように **不可視バイト**を含む。UI や経路のどこかで **C1 が欠落**すると `latin1→UTF-8` が **U+FFFD** を含み失敗し、その後の **Shift_JIS 推測**が誤って **裹ｲ.png** のような別物を返す（誤爆）。  
   - **対策 A（修復）**: `latin1→UTF-8` の結果に **U+FFFD が含まれる場合は Shift_JIS 系の補助修復を行わない**（据え置き）。  
   - **対策 B（ダウンロード名）**: `GET /api/file/:fileKey` に **`?fn=`**（URL エンコードされた UTF-8 名）を付け、**レコード JSON 上で修復できたファイル名**を優先して `Content-Disposition` の `filename*` に使う。`faq-portal-full.html` の配布資料リンクは **`fileUrl(key, saveName)`** で `fn` を付与し、可能なら **`download` 属性**で保存名を指定する。  
   - **限界**: kintone の `attachment[].name` が **バイト欠落した状態で永続化**されている場合、サーバだけでは **分割.png** に復元できない。**ファイルの再アップロード**が必要。

### 検証コマンド（回帰用）

```bash
cd scripts/faq-kintone-proxy
node selftest-filename-repair.mjs
# 典型 mojibake → 期待名（全角＋半角カナ混在）が PASS すること
# 「C1 欠落の短いゴミ」行は SJIS 誤爆を避け入力と同一のままになること

# favicon（サーバ起動に最低限のダミー env が必要な場合あり）
HTTP_PORT=19999 KINTONE_DOMAIN=example.cybozu.com KINTONE_API_TOKEN=dummy KINTONE_FAQ_APP_ID=1 node server.mjs &
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:19999/favicon.ico   # 期待: 204
```

### 教訓

- ファイル名は **multipart の `filename*`** と **レスポンスの `Content-Disposition` の `filename*`** を UTF-8 で明示しないと、中間プロキシやブラウザで二重に壊れる。  
- **Blob + ファイル名**だけに頼らず、可能なら **`File`** で送る。  
- レコードに既に壊れた `name` が入っているデータは、**再アップロード**または kintone 側修正が必要な場合がある（修復関数で直せない欠損パターンあり）。  
- **修復関数の「日本語あり」判定に半角カタカナブロックを含めないこと**。含めると latin1 修復が永遠にバイパスされる。

### 関連

- **TSB-001**（fileKey と画像 404）と独立して管理。表示名は本 TSB を正とする。
