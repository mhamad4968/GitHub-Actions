# AGENTS.md — 開発憲法（kintone-ai-lab）

本ファイルはプロジェクト全体を統治する開発規範（憲法）である。
すべての AI エージェント（Cursor Agent、Claude Code、Codex 等）はこのファイルに従う。
個別の詳細ルールは `.cursorrules` および `.cursor/rules/*.mdc` に委任する。

---

## 第1章 基本原則

### §1 役割
AI エージェントはビジネス・エンジニアリングの共同責任者として、意思決定の質と実行速度を最大化する。

### §2 正本主義
すべての設計判断・フィールド定義・運用ルールは **ファイルに記録されたものを正本** とする。チャットだけで完結させない。

### §3 索引駆動
作業着手前に `RULES-INDEX.md` を読み、該当するルールファイルへ辿る。索引の複製・長文マージはしない。

---

## 第2章 kintone 開発規約

### §4 フィールドコードの整合性
推測禁止。`kintone-apps.md` または `npm run app:fields <ID>` の出力と一致するコードのみ使用する。

### §5 非同期制御
`async/await` を基本とし、`kintone.events.on` ハンドラは event を正しく return する。

### §6 一括処理の最適化
1件ずつのループ更新をデフォルトにしない。bulkRequest / 複数件更新を優先する。

### §7 エラーの可視化
console だけでなく画面上で利用者が状況を把握できるようにする。

### §8 デプロイ指示の3点セット
アプリID・実行コマンド・アップロード対象パスを同じ返答内に必ず書く。

---

## 第3章 品質保証

### §9 完了時チェックリスト
コード作成・修正後は「動作確認チェックリスト（3項目程度）」を必ず添える。

### §10 自己レビュー（3点）
コード提示後に kintone 制限事項・保守性・ユーザー体験の3点を自己レビューし結果を報告する。

### §11 修復後の検証義務
「直した」とだけ言わない。具体的な検証手順を添え、ユーザーの実機確認まで未完了として扱う。

### §12 イベントバインド確認
モジュール分割・render 改修後は再描画のたびにイベントリスナーが再バインドされるか検証する。

---

## 第4章 環境・クロスプラットフォーム

### §13 WSL/Windows の使い分け
`.bat` / `.cmd` は Write/StrReplace 禁止。Shell + printf + CRLF で書く（`windows-cross-platform.mdc`）。

### §14 MCP 設定の保全
`~/.cursor/mcp.json` を変更する際は最小差分とし、秘密をログに出さない。変更後は JSON-RPC ハンドシェイクテストで動作確認する。

### §15 セキュリティ
API トークン・パスワード・鍵を回答に不必要に再掲しない。設定例はプレースホルダで示す。

---

## 第5章 ナレッジ運用（RAG 連携）

### §16 知識の鮮度管理
常に **最新のコードを正本** とし、古いドキュメントを盲信しない。ドキュメントとコードに乖離を見つけたら、ドキュメントを更新するか、ユーザーに差異を報告する。

### §17 RAG 検索の義務化
以下のタイミングで、RAG（`mcp-local-rag`）を用いて過去の設計判断・類似の不具合修正記録を検索すること:
- **重要な設計判断の前**（アーキテクチャ変更、新機能追加、API 設計）
- **不具合調査の初動**（過去に類似の問題がないか確認）
- **リファクタリングの前**（既存の設計意図・制約を確認）

検索コマンド:
```bash
npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models query "検索キーワード"
```

MCP ツール経由の場合: `rag_search` ツールを使用する。

### §18 知見のフィードバック（学習サイクル）
障害・不具合を解決したら、以下のサイクルを回す:

1. **記録**: `docs/troubleshooting.md` に原因・対策・教訓を追記する（TSB-XXX 形式）
2. **インデックス更新**: `npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/troubleshooting.md`
3. **ルール化**: 繰り返し発生しうる問題は `.cursor/rules/` の該当ファイルにルールとして追記する
4. **索引更新**: `RULES-INDEX.md` の随時メモに日付付きで1行残す

これにより AI は「過去に学んだことを二度と忘れず、常に最新を追う」学習サイクルを維持する。

---

## 第6章 RAG データベース管理

### インデックス対象
| ディレクトリ | 内容 |
|---|---|
| `docs/` | アーキテクチャ・運用ランブック・トラブルシューティング |
| `.rag/extra-docs/` | 開発憲法・ルール・アプリ定義のコピー |

### インデックス更新コマンド
```bash
cd /home/mhamada202408224/kintone-ai-lab

# docs/ の全ファイルを再インデックス
npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/

# ルール・憲法の更新時
cp RULES-INDEX.md kintone-apps.md CLAUDE.md .rag/extra-docs/
npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest .rag/extra-docs/
```

### インデックス更新タイミング
- `docs/` 配下のファイルを追加・更新したとき
- `RULES-INDEX.md` / `kintone-apps.md` を更新したとき
- トラブルシューティング記録を追加したとき
- 月初の定期更新（全ファイル再インデックス）

---

---

## 第7章 MCP 保全・災害復旧

### §19 MCP 設定の保全
`~/.cursor/mcp.json` およびカスタム MCP サーバーのソースコードは以下の体制で保全する:

- **日次自動バックアップ**: cron で `scripts/backup-mcp.sh` を毎日実行（30世代保持）
- **手動バックアップ**: MCP 設定変更後に `bash scripts/backup-mcp.sh`
- **保存先**: `kintone-ai-lab/backups/mcp/<YYYYMMDD-HHMMSS>/`

### §20 MCP 消失時の復旧プロトコル
MCP ツールが消えた / 赤ランプが出た場合:

1. `bash scripts/check-mcp.sh quick` で状況確認
2. `bash scripts/restore-mcp.sh` でバックアップから復旧
3. Cursor 再起動
4. 詳細手順: `docs/mcp-disaster-recovery.md`

### §21 MCP 変更時の義務
- mcp.json を変更したら **必ず** `bash scripts/backup-mcp.sh` を実行
- カスタムサーバーのコードを変更したら同上
- JSON-RPC ハンドシェイクテストで動作確認してから Cursor を再起動

### §22 経理FAQポータル変更時の受け渡し（受け取り側が `git pull` だけでよい状態）
Windows 等の**受け取り側**が、未追跡ファイルやローカル専用パスに依存せず更新を取り込めるようにする:

1. **`scripts/faq-portal-full.html`** または **`scripts/faq-kintone-proxy/server.mjs`** を変更したら、**必ず** `npm run faq:pack-minimal`（`bash scripts/package-faq-only-1-and-2.sh` と同等）を実行し、**`scripts/faq-portal-ONLY-1-and-2.tar.gz` を更新して同一コミットに含める**。
2. 変更は **リモートへ push まで完了**させる（受け取り側は **`git pull`** のみでよいこと）。
3. 追跡ブランチは運用で合意したものを正とする（現状の受け渡し先: **`feature/calculate-tax`**）。
4. 詳細チェックリスト: **`scripts/DEVELOPER-FAQ-HANDOFF.txt`**。

---

## 付則

- 本ファイルの変更はユーザーの承認を得てから行う
- 既存の `.cursorrules` および `.cursor/rules/*.mdc` との矛盾が生じた場合、本ファイル（AGENTS.md）を優先する
- 制定日: 2026-04-14
