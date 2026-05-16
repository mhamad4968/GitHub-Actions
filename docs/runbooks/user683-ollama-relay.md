# 683 ダッシュ — Ollama 中継（社内）

## 目的

kintone 683 一覧の **「Ollamaで週次・月次要約を生成」** ボタンから、社内の **HTTP 中継**経由で **Ollama** に本文を渡し、週次 4 本＋月次 1 本の要約を返す。

**自動化（推奨）**はブラウザを経由せず、**`docs/runbooks/user683-summary-job.md`**（`npm run user683:sync-summaries:apply`）を参照。

## 前提

- kintone は **HTTPS**。ブラウザから `http://127.0.0.1:...` へは **混在コンテンツ等でブロックされやすい**ため、実運用では **HTTPS で届く中継 URL** を用意する（社内リバースプロキシ・証明書付きホスト等）。
- 中継と Ollama は **社内ネットワーク**上で到達できること。

## 中継の起動（リポ）

```bash
npm run user683:ollama-relay
```

（`package.json` 経由では **`npx dotenv -e .env -e .env.proxy`** で起動する。**`.env.proxy` が無い PC**では通常 **`.env` だけ**が効く（`OLLAMA_MODEL` も **`.env` の 1 行**が正本）。**`.env.proxy` がある場合のみ**同じキーは後勝ちになるので、起動ログの `model=` と食い違う 404 のときは **`.env.proxy` に古い `OLLAMA_MODEL` が無いか**も確認する。雛形は **`.env.example`**。`.env` が無い環境では `dotenv-cli` が失敗しやすいので、その場合のみ `node scripts/user683-ollama-relay.mjs` と手動で環境変数を渡す。）

既定: `http://0.0.0.0:17883`、POST 先パス **`/user683/summarize`**。**`ollama list` は「そのコマンドを打ったマシン」上の一覧**です。Ollama が **別ホスト**（例: Linux `masa`）だけにある場合、中継／ジョブを動かすマシンの `.env` で **`OLLAMA_HOST=http://<masa の IP またはホスト名>:11434`** のように、**実際に Ollama が待っている URL** を指してください（中継の既定 `127.0.0.1:11434` は **中継プロセスのいる PC のループバック**です）。

### リポの場所と「中継スクリプトが新しいか」（Windows）

1. **フォルダを開く**: エクスプローラのアドレスバーに `C:\Users\mhamada202408224\kintone-ai-lab` と入力して Enter。  
2. **そのフォルダでターミナルを開く**: アドレスバーに `powershell` と入力して Enter（または Cursor のターミナルで `cd C:\Users\mhamada202408224\kintone-ai-lab`）。  
3. **ファイルの中身で確認**（`git pull` が分からなくてよい）:

```powershell
Select-String -Path scripts\user683-ollama-relay.mjs -Pattern RELAY_BUILD
```

1 行以上ヒットすれば、**診断版（起動ログに `RELAY_BUILD=…` が出る版）**です。ヒットしなければ **まだ古い `user683-ollama-relay.mjs`** か、パスが違います。

4. **`git pull` とは**: GitHub 等の **リモート**から、この PC の `kintone-ai-lab` に **コミット済みの変更を取り込む**コマンド（`cd` したうえで `git pull`）。**Cursor がこの PCに直接書いた変更だけ**を使うなら、**上記 3 の検索で足りる**（リモートに無い変更は `pull` では来ない）。  
5. `git status` で `scripts/user683-ollama-relay.mjs` が **`??`（未追跡）**のときは、**まだ Git に登録されていないローカルファイル**です。別 PC と揃えるには **コミット＆ push** か、ファイルを手でコピーする必要があります。

6. **683 のネットワークタブ**で POST の **レスポンスヘッダ `X-Relay-Build`** を見る（**`diag-v3` 等**が付いていれば、このリポの中継が応答した証拠）。**ヘッダが無い／別名**なら **別ホストの中継**に当たっている。

7. **要約欄の 404 文に `[ollama-relay build=…]` が付いていない**場合、その文字列は **diag-v2 以降の中継が返したものではない**（**古いコピペ**・**別 URL の中継**・**別タブの残り**）。**レスポンス本文の生データ**とターミナルの **`POST client=…` 行**を同じタイミングで照合する。（**diag-v3** から `POST client=` が出る。）

環境変数（任意）:

| 変数 | 既定 | 説明 |
|------|------|------|
| `USER683_RELAY_PORT` | `17883` | 中継の待受ポート |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Ollama のベース URL |
| `OLLAMA_MODEL` | `llama3.2` | **Ollama アプリのモデル一覧と同じ文字列**（例: UI が `qwen3:8b` なら `.env` に `OLLAMA_MODEL=qwen3:8b`）。**404** は未 pull／名前不一致が多い → `ollama list` で確認 |
| `USER683_CORS_ORIGIN` | `*` | `Access-Control-Allow-Origin`（必要なら kintone のオリジンに限定） |
| `USER683_OLLAMA_TIMEOUT_MS` | `120000` | Ollama 1 回あたりのタイムアウト（ms） |

## 683 側の URL 設定

ブラウザの開発者ツール（コンソール）で、**HTTPS のフル URL** を設定し、一覧を再読込する。

```js
sessionStorage.setItem(
  'user_support_683_ollama_relay_url',
  'https://社内ホスト名/user683/summarize'
);
```

または `window.USER683_OLLAMA_RELAY_URL = 'https://...'`（ページ読込前に注入できる場合）。

## リクエスト／レスポンス（参考）

**POST** JSON 本体（683 が自動生成）:

- `weeks`: 長さ 4 の配列。各要素 `{ label, corpus }`。
- `month`: `{ label, corpus }`。

**レスポンス** JSON:

- `weekSummaries`: 文字列の配列（長さ 4）
- `monthSummary`: 文字列

空の `corpus` は中継側で短いプレースホルダ文を返す。

## 浜田さん向け「1 個ずつ」チェックリスト（順番）

1. **Ollama を起動し、モデルを pull 済みにする**（例: `ollama serve` と `ollama pull llama3.2`）。
2. 中継を起動する（`npm run user683:ollama-relay`）。必要なら **HTTPS 前段**を別途。
3. 683 のブラウザで **sessionStorage に中継 URL** を入れ、一覧を再読込。
4. **「Ollamaで週次・月次要約を生成」** を押して動作確認。

（以降のトラブルはコンソール・中継の標準出力・Ollama ログを確認。）

## トラブル: `ERR_NAME_NOT_RESOLVED` / `TypeError: Failed to fetch`

コンソールに **`20http//127.0.0.1:11434/user683/summarize`** のように **先頭に数字**、**`http//`（コロン欠け）**、**ポート 11434** が付いている場合は **URL の誤設定**です。

- **POST 先は Ollama（11434）ではなく、Node 中継**（既定 **`http://127.0.0.1:17883/user683/summarize`**）。kintone が HTTPS のときは **混在コンテンツ**で `http://127.0.0.1` がブロックされることが多いので、実運用では **HTTPS の社内ホスト**を `sessionStorage` に入れること。
- **683 の JS（v11 以降）**では、上記のような誤りを **正規化**（`http//` → `http://`、先頭ゴミ除去、**`https:// http://...` の二重スキーム除去**、**localhost + 11434 + `/user683/summarize` → 17883**）し、正規化できたときは **`sessionStorage` に正しい URLを書き戻し**ます（`window.USER683_OLLAMA_RELAY_URL` に誤字が残っている場合は、そちらも手で直してください）。それでも失敗する場合は **手で正しい URL を入れ直し**、一覧を **強制再読込**してください。

## トラブル: 要約欄に **（Ollama HTTP 404）** と出る

中継は Ollama の **`POST …/api/generate`** を呼びます。**404** の **`model '…' not found`** は、**`OLLAMA_HOST` が指している先**の Ollama に、その名前が無いときです。**エラー文の末尾**に **`[ollama-relay model=… ollama=…]`** が付くので、body の `model '…'` と **末尾が一致するか**確認する（**一致しない**＝別の中継プロセスや古いタブの応答の可能性）。**別マシン**で `ollama list` しただけではなく、**中継が実際に叩いているホスト**で list する。雛形は **`.env.example`**。

**確認手順（この順）**

1. **Ollama が動いている PC**で `ollama list` を実行し、**NAME 列と完全一致する文字列**をメモする。
2. リポ直下 **`kintone-ai-lab` の `.env`** に 1 行追加または修正する:  
   `OLLAMA_MODEL=（ollama list の NAME）`  
   例: `OLLAMA_MODEL=qwen3:8b`
3. まだ無いモデルなら `ollama pull qwen3:8b`（上で選んだ NAME）を実行する。
4. **中継を一度止めてから**、再度 `cd` したうえで `npm run user683:ollama-relay` を起動する。起動ログに **`model=…`** と出るので、**手順 1 の名前と一致**しているか見る。
5. 中継が **別マシン**で動いている場合は、そのマシンの Ollama に **`OLLAMA_HOST`** が向いているか（既定 `http://127.0.0.1:11434`）も確認する。

ブラウザ経由でなく **`npm run user683:sync-summaries:*`** を使う場合も、同じ **`OLLAMA_MODEL`** が `.env` 経由で読み込まれる点は共通です（詳細は **`user683-summary-job.md`**）。

## トラブル: **（Ollama HTTP 500）** と `model requires more system memory` が body に出る

Ollama が **500** を返し、JSON の `error` に **`model requires more system memory … than is available`** とある場合は、**その PC の空きメモリがモデル要件を下回っている**状態です（例: 5.5 GiB 必要なのに 2.4 GiB しか無い）。

**対処の優先順**

1. **他アプリを閉じる**／タスクマネージャで **使用メモリを減らす**（Ollama 以外の重いプロセスを止める）。
2. **より小さいモデル**に切り替える: `ollama list` で小さめのモデルを選び、`.env` の **`OLLAMA_MODEL=`** をその NAME に変更 → 中継を **再起動**（例: 要件が厳しい **8B** ではなく、環境に合う **小サイズ・量子化**のタグを選ぶ。具体名は環境ごとに異なるため **`ollama list` / `ollama pull`** で確認）。
3. **メモリの大きい別 PC**で Ollama を動かし、そのマシンを指すよう **`OLLAMA_HOST`** を設定して中継／ジョブを動かす（中継と Ollama が同じ PC である必要はないが、**到達可能な URL** であること）。

これは **683 の JS や中継のバグではなく**、ローカル実行環境のリソース制約です。
