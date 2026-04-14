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

### 添付ファイル名の文字化け表示（2026-04-14 追記）

- **症状**: 配布資料に `åå².png` のように、本来「分割.png」などであるべき名前が壊れて見える
- **原因**: kintone API が返す `name` が、UTF-8 バイト列を Latin-1 として解釈した結果になっている場合がある
- **対策**: `server.mjs` の `repairKintoneFilename` で API 応答の `name` を補正。`faq-portal-full.html` の `repairKintoneDisplayName` でリンク表示も二重に補正

### UI 改善: 編集ボタンの summary タグ外移動（2026-04-14）

- 編集/削除ボタンを `<details>` 内部からカードレベル（`<details>` の外）に移動
- FAQ を展開しなくても編集操作が可能に
- `<summary>` のクリックイベントとボタンのクリックの競合を解消

### 教訓

- kintone の fileKey は **アップロード直後は一時的** で、**レコード保存後に恒久キーに変わる**。この2段階を理解せずにキーをそのまま使うと必ず 404 になる
- 画像プレビューは **Blob URL** を使えばネットワークリクエスト不要で即表示できる
- ブラウザキャッシュが古い HTML/JS を保持していると、修正済みコードが反映されない。ユーザーに **Ctrl+Shift+R（ハードリフレッシュ）** を案内する
- **ファイル名の文字化け（mojibake）** は名前ベースのマッチングを無効化する。位置ベースまたはレコードIDベースのフォールバックが不可欠
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
