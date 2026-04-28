# GW 休み中の整理・改善メモ（2026）

浜田が **GW 中にやる気になったら** 手を付ける候補。**いま必須ではない**。

## AI への運用メモ（提案タイミング）

- **本題が無い**／**項番 -0 で「今日は特に無し」**のとき、AI はこのファイルを **1 回読み**、**§41 一問**で「GWメモのどれから触る？」など **候補を 1〜2 個だけ**提案してよい（押し付けない）。
- **CTO 運用の正本**は `AGENTS.md` **§50-3**（憲法）。本メモは GW 向けの補助バックログ。

## セキュリティ（前回チャットで「今はいいや」とした分）

- **`~/.cursor/mcp.json` の API キー平文** → 各プロバイダで **キーローテーション** → 設定を **環境変数のみ参照**（シェル `export` / systemd user / Cursor が読む別ファイル等）に寄せる案を整理する。
- **`backup-mcp` 等のバックアップ**に `mcp.json` が入る運用なら、**保管場所・アクセス権**もセットで見直す。

## MCP・自動検査まわり

- **Cursor MCP 一覧**が赤になったときの切り分け手順を **1 枚**にまとめる（`npx` 絶対パス、`PATH`、npm 404、Node バージョン）。
- **`npm run health-check`** が落ちている原因の **ログ追跡**（前セッションで smoke に出ていた件）。
- **`docs/mcp-status.md`** を、追加した **kimi / deepseek / openrouter** 含めて更新する日を決める。

## リポ・セッション運用（任意）

- **`audit:parallel` 黄〜赤**が **watcher 再起動だけ**のとき、`--ignore-suspicion` と **false-positive 記録**を方針化するか検討。
- **`SESSION-CLOCK.md` 未コミット**が溜まりやすいなら、「時計更新はコミット対象か」を一度だけ決める。

## 参照

- 直近の MCP 修正内容: `~/.cursor/mcp.json`（kimi = `kimi-api-mcp` + `MOONSHOT_API_KEY`、deepseek = `mcp-deepseek`、openrouter = `@mcpservers/openrouterai`）。
