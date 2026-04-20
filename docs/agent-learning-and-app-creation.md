# エージェントの「学習」と現行アプリ作成（参考・運用）

議論ログで整理した内容を **リポジトリ正本**として残す。Claude Code / Cursor のエージェントと人間の両方が、**同じ前提**で kintone 作業に入れるようにする。

**コマンドの一覧・優先順位の詳細**はルート **`CLAUDE.md`**。**フィールド・アプリ ID の正本**は **`kintone-apps.md`**。**公式 URL（Cursor @Docs）**は **`docs/cursor-official-references.md`**。

**依頼が短くても迷わない・判断材料を貯める**: **`CLAUDE.md`「依頼の解釈・自己判断・ナレッジの貯め方」**（判断の参照順・正本／`RULES-INDEX`／会話メモへの残し方）。

**期待値の整合・連鎖・事後学習**: **`CLAUDE.md`「作業開始前の宣言（Plan of Action）」**（**制約・懸念の先出し**・判断分岐時は **5. 参照した公式 URL**）・**`kintone-apps.md`「アプリ間依存関係マップ」**・完了時 **Lessons Learned**＋**`RULES-INDEX` 1 行**（**`CLAUDE.md`「エラー時の自己解決」**内）。**レコード操作時は JSON ビフォー／アフター**（同ファイル・報告 **details**）。**着手前の公式回帰**・**`kintone-apps.md` と実フォームの突合**は **`CLAUDE.md`「着手前の情報収集」**。**環境パトロール**・**全アプリ正本の一括突合**は **`CLAUDE.md`「環境整合性のチェック」**（**プロジェクト全体の健康診断**・**Health Check→Plan of Action→エビデンス→黄金3**）。**新セッションの最初**（kintone 実装に入る前）は **`CLAUDE.md`「セッション開始時の作法」**で**同フローを既定実行**（実行ログを details、スキーマ同期のみなら実データ該当なし）。**一時スクリプトのゴミ拾い**・**トレードオフ時のユーザー確認**・**大規模時の分割提案**も同ファイル。**PR 前の品質セルフチェック**・**放置 Issue のパトロール**も同 **`CLAUDE.md`**。

---

## 1. 「学習」という言葉の二つの意味（混同しない）

| 意味 | 目的 | 本リポ・Cursor での当たり |
|------|------|---------------------------|
| **ナレッジ化（RAG 等）** | 自社マニュアル・仕様を根拠に答えさせる | **Codebase indexing**、**@Files / @Folders / @Codebase**、**@Docs**（`cybozu.dev` 等）、**`kintone-apps.md`**・生成 **`.d.ts`**。社内横断検索は別製品（例: Glean）の領域。 |
| **スキル・仕組みの習得** | エージェント設計・マルチエージェント等を学ぶ／作る | CrewAI・LangGraph 等は **別トピック**。本リポの日常開発では **`CLAUDE.md` の儀式**と **スキーマ同期**が主戦場。 |

**Cursor はモデルを自社データで再学習（ファインチューニング）しない。** 精度は **インデックス・ルール・正本ファイル・公式 Docs** で担保する。

---

## 2. 参考にしてほしいこと（エージェント・開発者共通）

1. **フィールドコードは推測しない**  
   正本の優先順位は **`CLAUDE.md` の Schema Retrieval Priority**（型 → `kintone-apps.md` の**履歴末尾** → `npm run app:fields`）。
2. **フォームやアプリを変えたら、コードより先に定義を揃える**  
   `npm run app:fields -- <ID> --markdown` と `npm run app:types -- <ID>`（プレビューなら `--preview`）。詳細は **`CLAUDE.md` の「黄金のサイクル」**。
3. **`kintone-apps.md` は追記運用**  
   履歴行の削除や黙殺はしない。別名・旧名は **グロッサリー／対応表**で明示（AI が古いコードを提案しやすい箇所）。
4. **サブテーブル・グループ内**は **`親コード > 子コード`** で統一（`app:fields --markdown` と同じ）。
5. **kintone 公式の「共通型」**と **アプリ固有型**を分ける  
   - API・イベントの型: `@kintone/types`・`@kintone/rest-api-client`（既存 `package.json` に準拠）。  
   - レコードの形（フィールドコード）: **`npm run app:types`** で `types/kintone-<appId>.d.ts`。
6. **REST クライアントの共通処理**は **`utils/kintone-common.ts`** を優先して再利用する（認証・baseUrl を各所で複製しない）。
7. **Cursor @Docs**  
   kintone は **`docs/cursor-official-references.md`「0. kintone」**の URL を登録する（`github.io` やドメインだけの誤 URL は使わない）。
8. **GitHub 上の Claude（Issue / PR の `@claude`）**  
   索引・導入手順は **`docs/claude-github-index.md`** と **`docs/claude-github-setup.md`**。ルート **`CLAUDE.md`** がリポジトリ上のエージェントの道しるべとして参照される想定。

---

## 3. 現行アプリ作成・大規模フォーム変更チェックリスト（今後必ず踏む）

新規アプリ、または **フィールド追加・改名・サブテーブル変更**を伴う改修で、エージェントに依頼するときは **次の順を正**とする。

| # | 作業 | 備考 |
|---|------|------|
| 1 | **アプリ ID・論理名・利用者・プロセス**を一文で確定させる | 不明なまま実装に入らない。 |
| 2 | **kintone 上でフォームを確定**（またはプレビュー環境を明示） | 本番／プレビューのどちらを正にするか決める。 |
| 3 | **`npm run app:fields -- <ID> --markdown`** を実行 | 出力先頭のメタ（appId・時刻等）を残し、**`kintone-apps.md` の変更履歴に 1 行追記**（既存行は削除しない）。 |
| 4 | **`npm run app:types -- <ID>`**（プレビューなら **`--preview`**） | **`types/kintone-<ID>.d.ts`** を生成・コミット。`.env` 不足時は **`app-types.js` のメッセージ**に従う。 |
| 5 | **`kintone-apps.md` のアプリ一覧表**に 1 行追加（新規の場合） | `customize` パス・`deploy` 例を既存アプリと同型で書く。 |
| 6 | **別名・他アプリとの対応**（例: 594↔627）を 1 ブロックで書く | 表示ラベル／実フィールドコード／廃止予定があれば併記。 |
| 7 | **実装**（`customize/`・`scripts/`） | **`@`** で生成型または `kintone-apps.md` を会話に添付する習慣。 |
| 8 | **デプロイ・動作確認** | 既存の `npm run deploy:<id>` 等に合わせる。 |

**エージェントへの依頼文の型**は **`CLAUDE.md` の Implementation Starter（コピペ用）**を使う。

---

## 4. 今後実施してほしいこと（チーム・エージェント向け）

- **新規／フォーム変更のたび**に、上記チェックリスト **3〜4** をスキップしない（スキップが「フィールド迷子」の主因）。
- **うまくいかないとき**は、**アプリ ID・実行コマンド・標準エラー全文・（あれば）エージェントの推論ログ**を残し、**`RULES-INDEX.md` の随時メモ**に 1 行で索引を足す（長文は会話メモや `chat-sessions/` へ）。
- **繰り返しの迷い**（特定プラグイン、ルックアップ階層、命名規則）は、**`.cursor/rules/kintone-schema-trust.mdc` に 1 行追記**して再発を抑える（**`CLAUDE.md` の優先順位と矛盾させない**）。
- **複数アプリで共通化する処理**は **`utils/kintone-common.ts`** に寄せ、新規スクリプトはそこ経由を検討する（SDK のメソッド名・引数は **実装中のバージョン**に合わせ、推測で古い API を書かない）。

---

## 5. 関連ファイル（短い索引）

| 用途 | ファイル |
|------|----------|
| セッション儀式・コマンド・黄金のサイクル | `CLAUDE.md` |
| アプリ一覧・フィールド・変更履歴（追記のみ） | `kintone-apps.md` |
| ルールの目次・随時メモ | `RULES-INDEX.md` |
| Claude × GitHub（要約・索引・Action） | `docs/claude-github-index.md`、`docs/claude-github-setup.md`、`.github/workflows/claude-code-action.yml` |
| kintone JS・スキーマ信頼 | `.cursor/rules/kintone-javascript.mdc`、`.cursor/rules/kintone-schema-trust.mdc` |
| 公式 URL 一覧 | `docs/cursor-official-references.md` |

---

*最終更新: 2026-04-06（GitHub Actions 連携の索引・ワークフロー追加）*
