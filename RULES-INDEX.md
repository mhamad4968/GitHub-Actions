# RULES-INDEX（運用メモの受け皿）

長いセッションや「覚えて」と言われた内容は **ここに 1 行ずつ**残す（チャットの暗記に頼らない）。

## 履歴・ルールの残し方（追加要件）

- **削らない・上書きしない**: いままでのやり取りで決めた**ルール・運用・経緯**は、基本的に **残し続ける**（履歴として消さない）。
- **このファイル（随時メモ表）**: 行の**削除・丸ごと差し替えはしない**。新しい内容は **日付＋1 行をテーブルの下に追記**する。古い行は参照用に残す。
- **日次チャットメモ**（`C:\Claudeとの会話メモ\YYYY-MM-DD.md`）: **過去日付のファイルは消さない**。その日の追記は当日ファイルに足す。必要なら「前日の続き」リンクを 1 行で書く。
- **ルールの正本**: コード規約・エディタ向けは **`.cursor/rules/*.mdc`**。アプリ・フィールドは **`kintone-apps.md`**（変更履歴テーブルも**追記**）。この INDEX はそれらへの短いインデックス役。
- **チャット全文**: Cursor は自動で全日保存しない。重要な決定だけを上記のファイル群に**抜粋して**残す。
- **エージェントの自己判断**: ユーザーが短く依頼しても**補完して進めてよい**（詳細はルート **`CLAUDE.md`「依頼の解釈・自己判断・ナレッジの貯め方」**）。判断に使った**事実と結論**は、正本への追記＋**本表に 1 行**＋必要なら会話メモ、で**判断材料を積み上げる**（次回以降の迷い防止）。

## INDEX 随時メモと `C:\Claudeとの会話メモ` の役割分け（二重メンテを減らす）

| 書く場所 | 目的 | ここに書く内容（目安） | ここに書かないもの |
|----------|------|------------------------|---------------------|
| **随時メモ（本ファイルの表）** | あとから **検索・索引** できる「決定の荷札」 | **1 行・短文**。題名（太字）、**アプリ ID / フィールドコード / ファイルパス / npm スクリプト名**、必要なら末尾に **`(詳: 会話メモ YYYY-MM-DD)`** | 長い経緯・試行錯誤ログ・エラー全文のコピペ・チャットの生ログ |
| **会話メモ `YYYY-MM-DD.md`** | **その日の文脈** と続き作業 | サマリ、**やったこと・コマンド・結果（短く）**、**未完了**、判断理由、**貼る用スニペット** | フィールド一覧の正本（→ **`kintone-apps.md` に追記**）。恒久ルールの本文（→ **`.cursor/rules` や README に書き、INDEX は1行で指向**） |

**運用のコツ（迷ったらこの順）**

1. **事実の正本**（フィールドコード・アプリ ID・設計）は **`kintone-apps.md`** やコード／専用 README。**INDEX は「どこを見るか」を指す短い行**に留める。
2. **その日の詳細**は **会話メモに集約**。INDEX の同じトピックを長くしたくなったら、**会話メモの日付へ送る**（INDEX は `(詳: …)` を足すだけ）。
3. **恒久に効く約束事**ができたら: 正本ファイル（`.mdc` / `kintone-apps.md` 等）を直したうえで、**随時メモに 1 行だけ**「何をどこに書いたか」を追記。
4. **随時メモ 1 行と会話メモが食い違ったら**: **正本（`kintone-apps.md`・リポジトリ内の事実）を優先**し、会話メモに「INDEX 某行は古い→正本どおり」と メモで注記（INDEX の古い行は削除せず、必要なら新しい行で訂正と書く）。

## チェックリスト（作業前に目を通す）

- **Next.js / React / Tailwind / TS / Supabase / Prisma / Firebase / OpenAI / LangChain 等** の生成・設計は、**`.cursor/rules/modern-web-official-docs.mdc`** と **`docs/cursor-official-references.md`** を参照し、公式の最新仕様を辿る（必要なら MCP **fetch** で該当ページを確認）。
- **kintone** のコード生成・API 確認は **`docs/cursor-official-references.md` の「0. kintone」**を正とし、Cursor **@Docs** には **`cybozu.dev`**・**`ui-component.kintone.dev`**・**`github.com/kintone/js-sdk`** を登録する（`github.io` / `github.com` ドメインのみは不可）。
- **復元チェックポイント（チャットが消えたあと）**: 作業の「現在地」は **`chat-sessions/checkpoint-latest.md`**（任意で **`chat-sessions/checkpoints/`** にアーカイブ）。**ユーザー指示 → `.mdc` → `kintone-apps.md` → `CLAUDE.md` → … → チェックポイント**の順で解釈し、**矛盾は正本を採用**。仕様・優先順位の正本は **`docs/agent-restore-checkpoint.md`**。新セッションは **`CLAUDE.md`「復元チェックポイント」**。**「忘れた」防止**（締めトリガー・3 点・人間の一言）は同 **`docs/agent-restore-checkpoint.md`**「『忘れた』を防ぐ」・**`checkpoint-latest.md`** 末尾チェックリスト。
- **Claude Code / エージェント**: フィールド正本の**信頼順位**はルート **`CLAUDE.md`**（型 → **`kintone-apps.md`（依存マップ含む）**・履歴 → `npm run app:fields -- <ID> [--markdown]`）。**推測禁止**。**Plan of Action**（多ファイル・広い影響の前に宣言。**制約・懸念の先出し**含む）は **`CLAUDE.md`「作業開始前の宣言」**。**短い依頼の補完・判断後のナレッジ化**も **`CLAUDE.md`「依頼の解釈・自己判断・ナレッジの貯め方」**。**着手前の最新化**・**公式への回帰**・**フィールド正本の突合**は **`CLAUDE.md`「着手前の情報収集」**（**Source of Truth**・判断分岐時は **cybozu.dev** 等の URL を**Plan of Action 5**または応答に）。**環境パトロール**・**プロジェクト全体の正本突合**は **`CLAUDE.md`「環境整合性のチェック」**（**プロジェクト全体の健康診断**・**4 ステップ標準フロー**）。**新セッションで kintone 実装に入る前**は **`CLAUDE.md`「セッション開始時の作法」**の**既定 Health Check**（実行ログ＋黄金 3＋details、スキーマのみなら実データ該当なし）。**一時ファイル**は **`CLAUDE.md`「一時ファイルのゴミ拾い」**。**A/B トレードオフ**は **ユーザー選択**（**忖度禁止**）。**5 app 超・不確実**は **分割／ペアプロ提案**。**ツール・npm・Actions・MCP**は **`CLAUDE.md`「ツール・依存関係・MCP のバージョン」**・**`docs/dependency-upgrade-backlog.md`**・**`.cursor/rules/kintone-javascript.mdc`**「**ツール・環境の自律保守（セルフ・アップデート）**」。**`CLAUDE.md` のメンテ**は同ファイル「本ファイルのメンテナンス」（**合意ルールの依頼なし削除禁止**）。**作業完了報告**は **`CLAUDE.md`「作業完了報告の型（黄金の3ステップ）」**＋**報告テンプレート**（メインはビジネス言語、技術は `<details>`）。**レコード更新・計算等**は **details 内に主要フィールドの JSON ビフォー／アフター**。**エラー時・副作用・エビデンス・Lessons Learned**は **`CLAUDE.md`「エラー時の自己解決ルール」**（**PR 前セルフレビュー**含む）。**アプリ間依存の正本**は **`kintone-apps.md`「アプリ間依存関係マップ」**。**放置 Issue の整理**は **`CLAUDE.md`「バックログ・Issue パトロール」**。
- **Claude × GitHub（Issue/PR の `@claude`）**: 索引 **`docs/claude-github-index.md`**、導入 **`docs/claude-github-setup.md`**、ワークフロー **`.github/workflows/claude-code-action.yml`**（要 **Secrets: `ANTHROPIC_API_KEY`** ＋ [Claude App](https://github.com/apps/claude)）。
- **新規アプリ・フォーム大変更**: 手順の正本は **`docs/agent-learning-and-app-creation.md`**（チェックリスト・儀式と併用）。議論で出た「学習」の二意味（RAG vs 習得）も同文書。
- フィールドコードは **`kintone-apps.md`** / `npm run app:fields <ID>` に合わせる。
- kintone JS のルール: **`.cursor/rules/kintone-javascript.mdc`**（フィールド正本・`kintone.events.on` 前の確認は **`.cursor/rules/kintone-schema-trust.mdc`**）
- **Security NEXT 収集（631）**: 運用フロー・429 / Gemini 判定・モデル切替の詳細は [**security-next-automation/README.md**](./security-next-automation/README.md) を参照（先頭の「運用の地図」から全体ナビ可能）。
- **セキュリティニュース（チャット）**: 依頼時は **概要 1 行＋要約は箇条書き**。CVE ありなら **CVSS・修正版の有無を調査**し **管理者の見解** を付す。**正本: `.cursor/rules/security-news-response.mdc`**
- CVE 照会（MCP）: Cursor **`cve-search`**（`~/.cursor/mcp.json`・`~/.cursor/cve-search_mcp`）
- Web→Markdown（MCP）: Cursor **`fetch`**（`uvx mcp-server-fetch`・`~/.local/bin/uvx`）、**`markdownify`**（`npx mcp-markdownify-server`・PDF/Office 等）
- Security NEXT **分析用 MCP 1〜5**（一覧・注意事項）: **`security-next-automation/README.md`**「ニュース分析で使う MCP」
- チャットの「続き」: **過去スレッドの全文は新規チャットに載らない**（モデルも自動では覚えない）。**`@RULES-INDEX.md`** と **会話メモ**（リポジトリなら **`@chat-sessions/YYYY-MM-DD.md`**、Windows なら `C:\Claudeとの会話メモ\YYYY-MM-DD.md`）を開き、必要なら **`@kintone-apps.md`** などを添えて依頼すると**続きやすい**。例: **予実管理表**に入る前は **`@RULES-INDEX.md` + `@chat-sessions/2026-03-28.md`**（またはその日のメモ）。`npm run chat:today` で当日メモを用意。別パスは `CHAT_MEMO_DIR`。詳細は `chat-sessions/README.md`

## 随時メモ

| 日付 | メモ |
|------|------|
| 2026-03-29 | **629 出張精算**: 宿泊費フィールド `shukuhaku`（`setup:629:shukuhaku`）、`customize/shucccho-seisan/desktop.js` で入力チェック（整数・上限 50 万円・`kingaku` 以下）、反映は `npm run deploy:629`。マニフェスト再生成は `npm run generate:customize-manifests`。 |
| 2026-03-29 | **customize-uploader**: `package.json` に `@kintone/customize-uploader`。公式アップロードは `npm run upload -- <アプリID>`（ログイン/OAuth）。**API トークンでの反映**は従来どおり `deploy:<id>` / `deploy-customize-api-token.js`（Actions）。 |
| 2026-03-29 | **Security NEXT**: `collect` の RSS `User-Agent` は `kintone-security-collector`。631 全削除は `security-next-automation` の `DELETE_ALL_SECURITY_NEXT_NEWS=1 npm run delete-all-news`。 |
| 2026-03-29 | **GitHub**（リポジトリ名 GitHub-Actions）: `feature/calculate-tax`・`src/tax.js` は消費税 **軽減 8%**。PR/Issue #1 の説明は 8% に更新済み（`gh pr edit` が GraphQL で失敗する場合は REST `PATCH`）。 |
| 2026-03-29 | **ローカルバックアップ**: `npm run backup` → `backups/日時/` に customize・scripts・src・security-next-automation（src/docs）・`kintone-apps.md`・`RULES-INDEX.md` 等をコピー（`.env` / `node_modules` は除外）。`backups/` は gitignore。 |
| 2026-03-29 | **履歴ポリシー**: やり取り・ルールは**消さず残す**。随時メモは**末尾追記のみ**（行削除しない）。`C:\Claudeとの会話メモ` の過去日付 `.md` も削除しない。詳細は本ドキュメント「履歴・ルールの残し方」と `chat-sessions/README.md`。`chat:today` 実行で `00-履歴の残し方.md` を未作成時のみ配置。 |
| 2026-03-30 | **チャットの続き（インデックス要約）**: 新規チャットは**前の会話ログそのものは引き継がない**。**`@RULES-INDEX.md` + `@会話メモ`** で文脈を渡せば**実務上は続けられる**。チェックリストの「チャットの続き」行を参照。 |
| 2026-03-30 | **INDEX と会話メモの役割**: INDEX は **1 行の索引**、詳細・ログは **`C:\Claudeとの会話メモ\YYYY-MM-DD.md`**。食い違いは **正本（`kintone-apps.md` 等）優先**。節「INDEX 随時メモと … 役割分け」を正本。 |
| 2026-03-29 | **595/627/594 運用**: 入社・異動・退社の手順は **`docs/jbis-hr-account-pc-operations.md`**（正本）。`kintone-apps.md` 先頭から1行リンク。 |
| 2026-03-28 | **JBIS 台帳まとめ**: `594/desktop.js` カード検索パネル左右余白（`JBIS594_SEARCH_PANEL_VER=4`・`deploy:594`）。`627/desktop.js` 一覧検索（PC除外・DROP_DOWN は `in()`）・**システム情報印刷**（5段・薄緑・1段目強調・`document.write`/詳細スナップショット・`deploy:627`）。次 **予実管理表**。詳 **`chat-sessions/2026-03-28.md`**・`kintone-apps.md` 変更履歴。 |
| 2026-03-30 | **631 Security NEXT**: GEMINI 時 **概要＝何が起きたか 1〜2 文＋`Security NEXT` 行**、**要約＝事象/脆弱性関連/修正・対策/見解**（`format-news-gemini.ts`・例は `security-next-automation/README.md`）。キーなしは RSS トリム。 |
| 2026-03-30 | **631 閲覧**: **概要（`summary`）**で全体像だけ先に掴み、**必要なときだけ要約（`digest`）**で具体的な数値・修正アクション（推奨対策など）を確認する使い分け。**詳: `security-next-automation/README.md`（閲覧のコツ）**。 |
| 2026-03-31 | **CVE Search MCP**: Cursor の `~/.cursor/mcp.json` に **`cve-search`**（`roadwy/cve-search_mcp`、API `cve.circl.lu`）。本体は **`~/.cursor/cve-search_mcp`**。依存更新は同ディレクトリで **`~/.local/bin/uv sync`**。 |
| 2026-03-31 | **Fetch / Markdownify MCP**: `mcp.json` に **`fetch`**（公式 `uvx mcp-server-fetch`・URL を Markdown 化）、**`markdownify`**（`mcp-markdownify-server`・PDF/Office/画像等）。**内部 URL を開くと情報漏えいリスク**あり（Fetch README の注意）。 |
| 2026-03-31 | **セキュリティニュース（チャット体裁）**: 依頼時は **概要 1 行＋要約は箇条書き**。CVE 含有時は **CVSS・修正版の有無を調査**し **管理者の見解** を添える。**正本: `.cursor/rules/security-news-response.mdc`。** |
| 2026-03-30 | **595／594**: PC 紐づけはサブテーブル `pc_ledger_list`（627 用 `ledger_*` と別）。追加 `npm run setup:595:pc_ledger_subtable`、反映 `deploy:594`・`deploy:595`、既存 `npm run backfill:595:pc_ledger_from_594`（`--dry-run` 可）。詳 **`kintone-apps.md`**・`docs/jbis-hr-account-pc-operations.md`。 |
| 2026-03-31 | **594（PC台帳）CSV 取り込み**: **`mail` は必須**にし、**社員マスタ（595）のメールと完全一致**（表記ゆれ・前後空白なし）。取り込み後は **`npm run backfill:595:pc_ledger_from_594`**（先に `--dry-run` 可）。未一致社員一覧は **`npm run list:595:no-pc-mail-match`**。 |
| 2026-03-31 | **631 ニュース分析 MCP**: CVE / fetch / markdownify / kintone / cyber-news / collectは不要 の **1〜5** を **`security-next-automation/README.md`** に表記。**`security-news-response.mdc`** からも参照。 |
| 2026-03-31 | **631 collect 稼働**: Gemini 既定モデル **`gemini-2.0-flash`**（1.5-flash の 404 回避）。**本番手順**は **`security-next-automation/README.md`**「collect を本番稼働させる」。Actions は Env **`kintone-collect`** に secrets。 |
| 2026-03-31 | **業務改善提案アプリ（新規・予定）**: 作成時にエージェントへ協力依頼あり。**着手時にそろえると早い前提** → （1）**利用者**（提案者のみ／審査・承認ロールの分け）、（2）**プロセス**（段階・分岐のラフ）、（3）**必須フィールド**（題名・背景・効果・担当・期限など）、（4）**既存 kintone との連携**の有無。決まり次第 **`kintone-apps.md`** にアプリ ID・フィールド正本を追記。プロセス＋タブ見え分けは **プロセスの段階でのフィールド表示**を第一候補（詳は会話）。 |
| 2026-04-01 | **公式ドキュメント索引（モダン FE/BE/AI）**: エージェント向けに **Next.js・React・Tailwind・TS・Supabase・Prisma・Firebase・OpenAI・LangChain・Lucide・Notion API** の公式入口を **`docs/cursor-official-references.md`** に整理。チェックリストにも 1 行追加。Firebase は **`firebase.google.com`**（`google.com` 誤リンクではない）。 |
| 2026-04-01 | **Cursor ルール**: 上記索引をエージェントが拾いやすいよう **`.cursor/rules/modern-web-official-docs.mdc`** を追加（kintone 作業時は `kintone-javascript.mdc` 優先を明記）。 |
| 2026-04-01 | **Cursor @Docs（kintone）**: **Add new doc** に **`cybozu.dev`**・**`ui-component.kintone.dev`**・**`github.com/kintone/js-sdk`** を登録。詳細表は **`docs/cursor-official-references.md`「0. kintone」**。`github.io`/`github.com` 単体は誤り。 |
| 2026-04-01 | **kintone 共通方針**はルート **`.cursorrules`**（補足・チェックリストは **`.cursor/rules/kintone-javascript.mdc`**・本 INDEX）。 |
| 2026-04-01 | **フィールド正本の優先順位**: ルート **`CLAUDE.md`**（Types → `kintone-apps.md` 末尾の履歴 → Live）。`app:fields` の Markdown 追記用は **`npm run app:fields -- <ID> --markdown`**。編集時ルール **`.cursor/rules/kintone-schema-trust.mdc`**。 |
| 2026-04-01 | **`npm run app:types -- <appId>`**: **`scripts/app-types.js`** が `@kintone/dts-gen` を呼び **`types/kintone-<appId>.d.ts`** を生成（`.env`・`--preview` 可）。セッション開始の作法は **`CLAUDE.md`「儀式」**。 |
| 2026-04-01 | **kintone「黄金のサイクル」**（儀式→`app:types` 環境チェック→型・`kintone-apps.md` 同期→推測なし実装）と伸ばし方（**`kintone-schema-trust.mdc` に 1 行**）の正本は **`CLAUDE.md`**。 |
| 2026-04-02 | **631 collect 実行後の確認**: 429 時はログ **`[Gemini体裁] … 再試行`**。成功時 **`gemini=Y`**／見解のみ **`gemini=I`**。**`GEMINI_MODEL`**: **`gemini-1.5-flash` は 404 になりやすい**→ AI Studio／[モデル一覧](https://ai.google.dev/gemini-api/docs/models)で **2.5 Flash 系など**を指定。**詳: `security-next-automation/README.md`**。 |
| 2026-03-30 | **631 collect 設定の埋め場所（正本）**: **`security-next-automation/docs/collect-env-settings.md`**（必須・任意・GitHub Secret/Variable 対応表）。クリック手順つきの詳細は **`security-next-automation/README.md`**「ハイブリッド収集」。NVD キー [request-an-api-key](https://nvd.nist.gov/developers/request-an-api-key)。`.env` は **`security-next-automation/.env`**。 |
| 2026-04-03 | **631 collect 概要・要約の整形修正**（次回収集から適用）: **`text.ts`**＝概要のタイトル行重複除去、CVE 無しでも **`脆弱性`** を含む抜粋を **`脆弱性関連`** に優先、`見解:` は **`lastIndexOf`** で末尾見出しのみ差し替え、**`normalizeInsightParagraphBody`** で語尾重複圧縮。**`format-news-gemini.ts`**＝見解 JSON の正規化。**既存 631 レコードは自動更新されない**（手修正または URL 再取得）。 |
| 2026-04-02 | **631 ニュース収集（品質）**: 概要の重複解消・脆弱性抽出ロジック改善・見解語尾の正規化を実装（**`security-next-automation/src/lib/text.ts`**・**`format-news-gemini.ts`**）。既存レコードは要手修正。**「概要・要約の品質向上」**の一連対応（インフラ整備〜ロジック微調整）はコードとドキュメントの両面で完結。 |
| 2026-04-04 | **594/627（PC台帳の見え方）**: 当面は**「台帳番号が入っているか／未入力か」**（627 一覧の条件・代表 `pc_594_record_id` とサブ `pc_ledger_links` の併用）までで十分とする。**594 保存**は **627 への代表番号ミラー**まで（`customize/594/desktop.js` の `mirror627Pc594From594Save`）。627 サブと 595 `pc_ledger_list` の**保存時フル同期は未実装のまま保留**；齟齬が気になるときは **`npm run backfill:627:pc_ledger_links`**。仕様の正本は **`kintone-apps.md`（627 節）**。今後ここが課題になったらエージェントに**提案・実装の相談**を出す。**(詳: `chat-sessions/2026-04-04.md`)** |
| 2026-04-05 | **社内FAQポータル（経理想定）**: 全機能 **`scripts/faq-portal-full.html`**（下書き・バックアップファイル・検索正規化・テーマ・印刷・任意 PIN 等）。使い方 **`docs/faq-portal-usage-keiri.md`**。Win 例: **`Documents/kintone-app`**。**631 analyze** の Gemini **429 再試行**は **`security-next-automation/src/lib/gemini-rate-limit.ts`**（`analyze.ts`・`format-news-gemini.ts`・README 更新）。**NVD** 要約の **`(NVD掲載)`** は **`collect-enrich.ts`** 後処理（見出し行は維持）。**(詳: `chat-sessions/2026-04-05.md`)** |
| 2026-04-06 | **631「情報セキュリティ関連集約」不調**: 画面名と **631（collect）／632（analyze）** を切り分け。**正本 `docs/security-news-app-troubleshoot.md`**（Actions・`npm run security-next:collect`・キーワード・Gemini・フィールド）。`kintone-apps.md` の 631 行からもリンク。 |
| 2026-04-06 | **631 日曜運用開始**: **実施順チェックリスト `docs/631-sunday-go-live-checklist.md`**（`jbis-kintone.cybozu.com`・631・`kintone-collect` の 3 Secret・ローカル `npm run security-next:collect` → Actions 手動 Run → 定時確認）。README 運用地図からリンク。 |
| 2026-04-06 | **FAQ ポータル＋ kintone（別 URL）**: **`docs/faq-portal-external-web-kintone.md`**。**社内FAQDB＝アプリ 638**（637 は情報セキュリティ情報収集で別）。フォーム追加 CB_VA01 対策＝**ドロップダウン／チェックの label をキーと同一**（`faq`/`meta`/`yes`）。リカバリ: **`npm run setup:faq-portal-fields-preview`** + `KINTONE_FAQ_APP_ID`。 |
| 2026-04-07 | **FAQ ファイルサーバ（手順の順序）**: **`docs/faq-portal-file-server-setup.md`**（1〜10: Node・`.env`・`BIND_HOST=0.0.0.0`・FW **3847**・`FAQ_API_BASE`）。**社内FAQDB のアプリ ID は正本 `kintone-apps.md`（確定は 640）**；上の **2026-04-06 行の 638 は古い**。 |
| 2026-04-05 | **エージェント「学習」と現行アプリ作成**: 議論ログを **`docs/agent-learning-and-app-creation.md`** に明文化（ナレッジ化とスキル習得の区別・Cursor の前提・**新規／フォーム変更チェックリスト**・今後実施項目）。**`CLAUDE.md`**・**`kintone-apps.md`** と併用。 |
| 2026-04-05 | **640／641 FAQ**: **640＝社内FAQDB（ポータル）**、**641＝カテゴリマスタ**（640 の `category_lookup` 参照先）。正本 **`docs/faq-apps-640-641.md`**。`customize/640`・`641` の JS・`deploy:640`／`641`・Actions マトリクス。**混同禁止**。 |
| 2026-04-05 | **FAQ ポータル環境・使い方（入口）**: **`docs/faq-portal-environment-setup-and-usage.md`**（初回構築・日常運用・Linux/WSL・トラブル早見）。Windows bat 詳細は **`docs/faq-portal-internal-windows-setup.md`**。 |
| 2026-04-05 | **社内FAQポータル（Windows）**: **`START-社内FAQポータル.bat`** で一括起動（初回 `.env`／`npm install`／`proxy-url.txt` 自動コピー可）。個別は **`scripts/faq-windows\*.bat`**。手順 **`docs/faq-portal-internal-windows-setup.md`**。`proxy-url.txt`・`out/` は **.gitignore**。 |
| 2026-04-05 | **経理FAQ HTTP＋ショートカット（方式1）**: **`docs/faq-portal-http-keiri-faq.md`**（IIS／`http-server`・`CORS_ORIGINS`・**`08-create-employee-shortcut.bat`**・`public-portal-url.txt`）。 |
| 2026-04-05 | **経理FAQ HTML 配置例**: UNC **`\\192.168.1.250\インストールソフト\その他\keiri-faq`**（`\\Server01\…` 可）… **`deploy-share-path.txt`** + **`07-copy-to-share.bat`**（正本 **`docs/faq-portal-internal-windows-setup.md`**）。 |
| 2026-04-06 | **FAQ ポータル「明日再開」メモ**: **`docs/faq-portal-resume-tomorrow.md`**（Node 未完了からの番号付き要約・**関連ドキュメント一覧**）。Node／npm が進まないとき **`docs/faq-portal-node-install-troubleshoot.md`**。 |
| 2026-04-06 | **Claude × GitHub 要約・索引（正本）**: **`docs/claude-github-index.md`**。導入 **`docs/claude-github-setup.md`**。**`.github/workflows/claude-code-action.yml`**（`anthropics/claude-code-action@v1`）を追加。旧議論メモは **`docs/claude-github-autonomy-discussion-log.md`** から索引へリダイレクト。 |
| 2026-04-06 | **エージェント運用**: 短い依頼の**補完・自己判断**と**判断材料のナレッジ化**（正本／**`RULES-INDEX` 1 行**／会話メモ）を **`CLAUDE.md`「依頼の解釈・自己判断・ナレッジの貯め方」**に明文化。本 INDEX の「履歴の残し方」にも 1 条追加。 |
| 2026-04-06 | **ユーザー前提**: 技術判断は**エージェントに委ねる**。**`CLAUDE.md`** に「ユーザーは技術判断をエージェントに委ねることが多い前提」を追記。確認は業務優先・取り返しが重い操作に限定。 |
| 2026-04-06 | **最新情報の取り込み**: 着手前に **MCP（fetch / google-search / cve-search 等）・Web・公式**で確認する方針を **`CLAUDE.md`「着手前の情報収集（最新化・MCP）」**に追記。 |
| 2026-04-06 | **ツール／MCP の随時更新**: **`CLAUDE.md`「ツール・依存関係・MCP のバージョン（随時アップデート）」**— `package.json`・Actions・MCP 触るときに最新版を判断、更新後は **`RULES-INDEX` 1 行**。無関係な全面メジャー上げは別タスク。 |
| 2026-04-06 | **`CLAUDE.md` の自己メンテ**: **`CLAUDE.md`「本ファイル（CLAUDE.md）のメンテナンス」**— 約束・矛盾・リポ変更・公式作法の変化で随時改稿。**履歴は `RULES-INDEX` 1 行**で足す。 |
| 2026-04-06 | **本日セッション総括（振り返り）**: **`chat-sessions/2026-04-06.md`**（FAQ ポータル運用・HTTP/ショートカット・再開メモ・Claude×GitHub・`CLAUDE.md` 運用方針の**まとめとマスター索引表**）。 |
| 2026-04-06 | **npm 依存のパッチ更新**: ルート `dotenv` **^17.4.0**、`@kintone/customize-uploader` **^9.0.3**、`@types/node` **^25.5.2**。**`npm audit fix`** で lodash 高を解消。残り **tmp** 系 5 件低は `@kintone/customize-uploader` 経由—**`audit fix --force` は uploader 降格のため未実施**。**security-next-automation**: `dotenv` **^17.4.0**、`@kintone/rest-api-client` **^6.1.4**、`@types/node` **^22.19.17**。`lint:customize`・`typecheck:utils`・631 `typecheck` 通過。 |
| 2026-04-07 | **依存アップデート保留課題の正本**: **`docs/dependency-upgrade-backlog.md`**（ESLint 10・`globals` メジャー・**tmp** / **`npm audit fix --force`** 未実施理由・631 の openai/TS 参考）。**`CLAUDE.md`**（ツール節＋関連ルール）・チェックリストからリンク。今後検討時は本ファイルを更新し **`RULES-INDEX` に結果 1 行**。 |
| 2026-04-07 | **`@kintone/rest-api-client` の自律活用**: **`CLAUDE.md`「File Specific Rules」**内に節追加—Node/スクリプトでは REST を **クライアント優先**、`.env` 整合、短い依頼でもエージェントが組み立て可、CI でも `npm ci` 後利用可。 |
| 2026-04-07 | **エラー時の自己解決ルール**: **`CLAUDE.md`「エラー時の自己解決ルール（デバッグスクリプト）」**— stderr 読む・最小再現・`scripts/debug-*.js` / rest-api-client / `app:fields` で自律切り分け・残骸整理・**3 回同じ失敗で方針転換**。ナレッジは **`RULES-INDEX` 1 行**。 |
| 2026-04-07 | **自律性の加速（職人ルール）**: **`CLAUDE.md`** 同節に **副作用の予測**（`utils/`・`kintone-common.ts`・共有 `scripts/` 変更時は grep で影響範囲→デグレ確認）と **証拠の提示**（完了報告に実行ログまたはテスト結果、未実行は明示）を追記。 |
| 2026-04-07 | **Plan of Action・依存マップ・Lessons Learned**: **`CLAUDE.md`** に **作業開始前の宣言**（多ファイル／広い影響の前に目的・対象・影響を箇条書き）。**`kintone-apps.md`** に **アプリ間依存関係マップ**（表＋自動更新ルール）と AI 指示 1 条。**完了報告末尾に Lessons Learned**＋**`RULES-INDEX` へ新事実 1 行**。 |
| 2026-04-05 | **セルフ・コードレビュー・Issue パトロール**: **`CLAUDE.md`** — **PR 作成前セルフチェック**（API 同時実行・レート／密結合・アンチパターン／正本整合を自問し**報告に含める**）。**バックログ・Issue パトロール**（依頼時または週次目安で未完了 Issue をコード・正本と照合し**提案のみ**）。**`RULES-INDEX`** チェックリスト・関連ルールからリンク。 |
| 2026-04-05 | **報告の黄金3ステップ・テンプレート**: **`CLAUDE.md`** — **一行サマリー／ビフォーアフター／次のアクション**をメインに**義務化**。**メインはビジネス言語**（メソッド名等は `<details>` へ）。**📢 作業完了のご報告**＋**🛠️ 技術的な詳細**の**Markdown テンプレート**を同節に掲示。証拠・セルフチェック・Lessons Learned は **details 内**を正とする。 |
| 2026-04-05 | **制約事項の事前共有（守護神）**: **`CLAUDE.md`「作業開始前の宣言」**に **4. できないこと・懸念点・制約（先出し）**を**必須化**（kintone 標準限界・API／レート・トレードオフ・要確認の明示）。無ければ **「制約・懸念なし」**一行。**後出しジャンケン**防止。 |
| 2026-04-05 | **実データスナップショット・公式回帰・的確さ**: **`CLAUDE.md`** — **レコード操作時**は報告 **`<details>`** に**代表的 1 件・主要フィールドの JSON ビフォー／アフター**（マスク・未取得時は理由）。**着手前の情報収集**に **公式ドキュメントへの回帰**（判断分岐時 **cybozu.dev** 等を fetch／curl／Python で確認、**URL を Plan of Action 5 または応答に**）。冒頭に**的確さ**方針。**PR 前セルフチェック**に**レコード実データ**行。 |
| 2026-04-05 | **環境 Health Check・自律パトロール**: **`CLAUDE.md`** — **新 app 着手時・大作業の区切り**に **`.env`／`app:types`・`app:fields`・`kintone-apps.md` 突合・npm audit／backlog 照合**（**`gh` は任意**）。異常は **Plan of Action または報告 details「Health Check:」**。**着手前の情報収集**に **環境の整合性** 1 段。**冒頭に自律サイクル**（計画→調査→実装→検証→報告）。 |
| 2026-04-05 | **ゴミ拾い・忖度禁止・ギブアップ・一括健康診断**: **`CLAUDE.md`** — **一時ファイル**は完了時**原則削除**、残すときは **`scripts/debug/` 等**＋**`RULES-INDEX` 1 行**。**A/B トレードオフ**は**ユーザーに選択を仰ぐ**。**5 app 超・Health Check 不確実**は**分割／ペアプロ提案**。**プロジェクト全体の健康診断**（全対象 `app:fields` 突合→**`kintone-apps.md` 履歴追記**・型再生成）を**4 ステップ**（Health Check→Plan of Action→エビデンス→黄金3）で報告。 |
| 2026-04-05 | **セッション開始時の既定 Health Check**: **`CLAUDE.md`「セッション開始時の作法」**—**新セッション**で kintone 実装・customize 等に入る**前**に、**4 ステップ**で**全 app 突合・一括同期**を**毎回言わなくても**実施。**実行ログ**を details に。**スキーマのみ**は実データ **該当なし**。**続きの会話・ドキュメントのみ・スキップ明示・`.env` 無し**は省略可。**自律サイクル**の 3 に実行ログ必須を明記。 |
| 2026-04-05 | **合意ルールの削除禁止**: **`CLAUDE.md`「本ファイルのメンテナンス」**—ユーザーと定めた**運用・儀式・チェックリスト**を**依頼なしに削除・丸ごと消去**しない。**変更はユーザー確認**または**追記で旧／移行先を残す**。**重複統合**は**義務・トリガ・例外が失われない**範囲で。 |
| 2026-04-07 | **FAQ成果物の置き場所ログ**: `docs/faq-portal-artifacts-log.md` を追加（HTML・プロキシ・bat の**正本の所在**と配布先を日付で追跡）。`docs/faq-portal-resume-tomorrow.md` からリンクし、更新・コピーのたびに1行追記する運用で「どこにある？」問題を再発防止。 |
| 2026-04-09 | **ツール・環境の自律保守（セルフ・アップデート）**: **`.cursor/rules/kintone-javascript.mdc`** に節追加—セッション開始や `package.json`/MCP 触る直前の **Claude Code / `@kintone/rest-api-client` / MCP** の検知、**承認後**の `npm outdated` 基調の更新、**検証**（`typecheck:utils`・`lint:customize`・`kintone:test`・必要な `build`）、異常時の**ロールバック方針**。**Git コミットはユーザー明示承認時のみ**（秘密はログに出さない）。**`CLAUDE.md`「ツール・依存関係・MCP」**・**`docs/dependency-upgrade-backlog.md`** と併用。 |
| 2026-04-09 | **`CLAUDE.md` ツール節の相互参照**: **「[ツール保守ルール]」** 行を **`## ツール・依存関係・MCP のバージョン`** の末尾に追加—**`.cursor/rules/kintone-javascript.mdc`**「**ツール・環境の自律保守（セルフ・アップデート）**」へ誘導（エディタ外・ターミナル経由の起動時も正本へ到達しやすくする）。 |
| 2026-04-10 | **復元チェックポイント（チャット消失時）**: **`docs/agent-restore-checkpoint.md`** が運用・**正本優先**の順位を定義。**`chat-sessions/checkpoint-latest.md`** を「現在地」、**`chat-sessions/checkpoints/`** を任意アーカイブ。**`CLAUDE.md`** に **判断材料 7** と **「復元チェックポイント」** 節。**`chat-sessions/README.md`**・本 INDEX チェックリストからリンク。**`npm run backup`** に **`chat-sessions/`**・**`CLAUDE.md`**・**`docs/agent-restore-checkpoint.md`** を含める（`scripts/backup-workspace.js`）。 |
| 2026-04-11 | **「忘れた」防止（ナレッジの締め）**: **`docs/agent-restore-checkpoint.md`** に **トリガー**・**セッション締め 3 点**（恒久 INDEX／正本 → `checkpoint-latest` → 日次メモ）・完了報告直前の自問・人間の**締め一言**・リカバリを追記。**`CLAUDE.md`「復元チェックポイント」**・**`checkpoint-latest.md`** 末尾チェックリスト・**`chat-sessions/README.md`** を同期。 |
| 2026-04-09 | **会話メモ（本日・振り返り・明日再開）**: **`chat-sessions/2026-04-09.md`**（本日の要約・触ったパス・再開コピペ・`@` 付き再開スニペット）。**`chat-sessions/checkpoint-latest.md`** を締め更新済み。 |
| 2026-04-05 | **FAQ サイト・不明時は確認**: **`CLAUDE.md`「関連ルールファイル」**に **FAQ ポータル**の正本導線と、**状況が不明なときはユーザーに確認（推測禁止）**を追記。 |
| 2026-04-10 | **次回フォロー（595＋経理FAQ・ユーザー依頼）**: （1）API トークン露出時は **再発行**。（2）**HTML URL／プロキシ URL／CORS_ORIGINS** の運用メモ 1 枚。（3）**`uploads` バックアップ**。（4）595 は **`deploy:595` 要否**。（5）**Git コミット**。（6）FAQ **スモーク**（画像・太字・箇条書き・リンク）。**ルール**: **`.cursor/rules/next-session-jbis-followups.mdc`**。 |
| 2026-04-10 | **654 予算ダッシュ（Cursor）**: 工種別合計テーブルから会社・摘要・確認列を削除。`dashboard-desktop.js`・`deploy:654`・`JBIS_DASH_UI_COPY_VERSION`。ルール追記はホーム **`~/.cursor/rules/kintone-javascript.mdc`**・**`persist-policies.mdc`** と本リポ **`.cursor/rules/kintone-javascript.mdc`**。**続き・共有用**: **`chat-sessions/2026-04-10.md`**（コピペブロック付き）。 |

**備考（2026-03-31 行との関係）**: 631 の**既定は `gemini-2.0-flash`**。**429 時は別 Flash ID**へ。1.5-flash 名は API で 404 になりがちなため、**Studio 表示の ID を正**とする。

| 2026-04-14 | **RAG 環境構築**: `mcp-local-rag`（ローカルベクトル検索）を導入。`docs/` 全22ファイル＋ルール・憲法9ファイル＝計1087チャンクをインデックス化。DB: `kintone-ai-lab/.rag/lancedb`。MCP サーバーとして `~/.cursor/mcp.json` に登録。 |
| 2026-04-14 | **開発憲法（AGENTS.md）制定**: `kintone-ai-lab/AGENTS.md` を新規作成。§1-§18 で基本原則・kintone 開発規約・品質保証・環境・ナレッジ運用（RAG連携）を体系化。§16 知識の鮮度管理、§17 RAG 検索の義務化、§18 知見のフィードバック（学習サイクル）。 |
| 2026-04-14 | **トラブルシューティング集**: `docs/troubleshooting.md` を新規作成。TSB-001（fileKey 有効期限→3層防御）、TSB-002（MCP 設定消失→復旧手順）、TSB-003（.bat 文字化け→CRLF/printf）を収録。RAG インデックス対象。 |
| 2026-04-14 | **MCP 災害復旧体制**: `scripts/backup-mcp.sh`（日次自動+手動）、`scripts/restore-mcp.sh`（一発復旧）、`scripts/check-mcp.sh`（ヘルスチェック）を整備。cron 登録済み。復旧手順書: `docs/mcp-disaster-recovery.md`。AGENTS.md に §19-§21 を追加。 |
| 2026-04-14 | **経理FAQ・受け取り側配慮**: `faq-portal-full.html` / `faq-kintone-proxy/server.mjs` 変更時は **`npm run faq:pack-minimal`** で `faq-portal-ONLY-1-and-2.tar.gz` を更新し **コミット＋push**（未追跡のまま残さない）。**`AGENTS.md` §22**・**`scripts/DEVELOPER-FAQ-HANDOFF.txt`**。 |

追記するときは **日付＋1行**をテーブルの**末尾に足す**（旧行はそのまま残す）。
