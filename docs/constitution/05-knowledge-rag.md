# ナレッジ・RAG（§19〜§21・第6章）

> **条文番号の正本**: `AGENTS.md`（本ファイルは読みやすい分割コピー）  
> **いつ読む**: ドキュ追加・RAG 検索  
> **索引**: `RULES-INDEX.md` → `docs/constitution/README.md`

---

## 要約

このジャンルに属する § は、下記本文どおり `AGENTS.md` から抽出したものです。解釈の最終正本は `AGENTS.md` の同一 § です。

---

## 第5章 ナレッジ運用（RAG 連携）

### §19 知識の鮮度管理
常に **最新のコードを正本** とし、古いドキュメントを盲信しない。ドキュメントとコードに乖離を見つけたら、ドキュメントを更新するか、ユーザーに差異を報告する。

### §20 RAG 検索の義務化
以下のタイミングで、RAG（`mcp-local-rag`）を用いて過去の設計判断・類似の不具合修正記録を検索すること:
- **重要な設計判断の前**（アーキテクチャ変更、新機能追加、API 設計）
- **不具合調査の初動**（過去に類似の問題がないか確認）
- **リファクタリングの前**（既存の設計意図・制約を確認）

検索コマンド:
```bash
npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models query "検索キーワード"
```

MCP ツール経由の場合: `rag_search` ツールを使用する。

### §21 知見のフィードバック（学習サイクル）
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

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索引 | `RULES-INDEX.md` |
| Cursor 常時 | `.cursor/rules/cio-constitution.mdc` |
| 手順 | `WORKFLOW.md` |

