# 日次チャットメモ（続き用）

Cursor の会話全文の自動保存はありません。**要点メモ**を置き、新しいチャットで **`@メモ.md`** するか **内容を貼り付け**て続きをします。

## 保存場所（既定）

- **Windows**: `C:\Claudeとの会話メモ\`
- **WSL からの実体**: `/mnt/c/Claudeとの会話メモ/`

`npm run chat:today` は **上記フォルダに** `YYYY-MM-DD.md` を作成します（`/mnt/c` が無いときだけ、このリポジトリの `chat-sessions/` にフォールバック）。

別フォルダにしたい場合は環境変数 **`CHAT_MEMO_DIR`** を指定してください。

## 手順

1. `npm run chat:today` … 今日のメモファイルのパスを表示（無ければ作成）。
2. メモを追記（決まったこと・パス・未完了など）。
3. 新規チャットで **Cursor**: メモファイルを `@` で指定、または内容を貼り付け。必要なら **`@RULES-INDEX.md`** も。

## 復元チェックポイント（チャットが消えても「現在地」を戻す）

- **正本（仕様・優先順位）**: **`docs/agent-restore-checkpoint.md`**（**`.mdc` / `kintone-apps.md` / `CLAUDE.md` より下位**。矛盾は正本を採用）。
- **常に最新の1枚**: **`checkpoint-latest.md`** … ゴール・未完了・次にやることを**短く**更新する。
- **長くなったら**: 抜粋を **`checkpoints/YYYY-MM-DD-topic.md`** に移し、`checkpoint-latest.md` は要約だけに戻す。

新しいチャットでは **`@chat-sessions/checkpoint-latest.md`** と **`@CLAUDE.md`**（必要なら **`@RULES-INDEX.md`**）を添えると復元が速い。

**「忘れた」防止**: チャットを閉じる前に **「チェックポイントと INDEX 残して」** と一言入れるか、**`checkpoint-latest.md` 末尾の締めチェック**を実行する。**いつファイルへ書くか**のトリガーと **セッション締め 3 点**は **`docs/agent-restore-checkpoint.md`**「『忘れた』を防ぐ」。

## Cloud 長回し（Cmd+E 等）—「再開可能」SLO と放置の区別

クラウドの SLO は **「必ず完走」ではなく、同一完了定義で再開できること**（`cio-constitution.mdc`・CEO 承認済み）。**「未完のまま放置」**と誤読されないよう、**証跡で必ず次アクションを残す**。**`npm run cio:cloud-handoff -- end --status partial`**（および **`blocked`**）は **`--note "…"` 必須**（脚本が exit 2）。`note` には **次セッションが読めば再開できる具体**（コマンド名・ファイルパス・PR 番号・誰が CI を見るか等）を書く。**`done`** のときは `note` 任意。**合意シール**: タスク単位で `seal` → 第2者 `add` → **プッシュ前に PR 作者（CIO）が `npm run cio:consensus-seal -- verify`**（厳格。ファイル無しは失敗）。**GitHub Actions** は **`npm run cio:consensus-seal:verify-ci`**（`--if-present`）を実行し、**PR に合意 JSON を意図的に載せたときだけ** CI が不足を赤にする。状態ファイル **`chat-sessions/cio-consensus-seal.json`** は **既定で `.gitignore`**（ローカル作業）。ゲートを CI で通す PR では **`git add -f chat-sessions/cio-consensus-seal.json`** で追跡を上書きしてよい。**マージ後**は **`npm run cio:consensus-seal -- clear`** か次タスク冒頭の **`seal`** で状態を畳み、**古い合意 JSON を次 PR に持ち越さない**。型の参考は **`cio-consensus-seal.example.json`**。

## リポジトリ内のファイル

- `TEMPLATE.md` … ひな形（コミット用）。Windows 側にも初回コピーされます。
- `checkpoint-latest.md` … 上記「復元チェックポイント」の**最新版**（テンプレから上書きしてよい）。
- `checkpoints/` … 任意アーカイブ（`.gitkeep` のみでも可）。

## INDEX との役割分け

**詳細・その日のログはこのフォルダ（会話メモ）**、**一覧の索引は `RULES-INDEX.md` の随時メモ（1 行）**。長い説明を INDEX に書きたくなったら、会話メモに書き、INDEX 末尾に `(詳: 会話メモ YYYY-MM-DD)` だけ足す。迷ったら **`RULES-INDEX.md` の「役割分け」表**を見る。

## 履歴を残す（追加要件）

- **過去の `YYYY-MM-DD.md` は削除しない**（読み返し・監査用）。
- その日の続きは **同じ日付ファイルに追記**する。長くなったら見出しで区切る。
- 運用ルールや「こう決めた」は、可能なら **`RULES-INDEX.md` の随時メモ**にも **追記**（テーブルの行を消さない）。

## 注意

- **シークレットや個人情報はメモに書かない**。
