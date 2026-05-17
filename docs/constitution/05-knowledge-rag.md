# ナレチE��・RAG�E�§19〜§21・第6章�E�E

> **条斁E��号の正本**: `AGENTS.md`�E�本ファイルは読みめE��ぁE�E割コピ�E�E�E 
> **ぁE��読む**: ドキュ追加・RAG 検索  
> **索弁E*: `RULES-INDEX.md` ↁE`docs/constitution/README.md\\
\\
---

## 30秒要紁E��Ehase 2�E�E

§19〜§21 と RAG 第6章。鮮度・RAG 検索義務�E学習サイクル、E

## ぁE��読む�E�チェチE��リスト！E

- docs 追加
- rag:ingest
- TSB 起票

## 条斁E��斁E��EGENTS 抽出・削除禁止�E�E

> 以下�E `AGENTS.md` からの抽出コピ�E、E*省略・削除しなぁE*。解釈疑義は `AGENTS.md` 正本、E

## 第5章 ナレチE��運用�E�EAG 連携�E�E

### §19 知識�E鮮度管琁E
常に **最新のコードを正本** とし、古ぁE��キュメントを盲信しなぁE��ドキュメントとコードに乖離を見つけたら、ドキュメントを更新するか、ユーザーに差異を報告する、E

### §20 RAG 検索の義務化
以下�Eタイミングで、RAG�E�Emcp-local-rag`�E�を用ぁE��過去の設計判断・類似の不�E合修正記録を検索すること:
- **重要な設計判断の剁E*�E�アーキチE��チャ変更、新機�E追加、API 設計！E
- **不�E合調査の初動**�E�過去に類似の問題がなぁE��確認！E
- **リファクタリングの剁E*�E�既存�E設計意図・制紁E��確認！E

検索コマンチE
```bash
npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models query "検索キーワーチE
```

MCP チE�Eル経由の場吁E `rag_search` チE�Eルを使用する、E

### §21 知見�EフィードバチE���E�学習サイクル�E�E
障害・不�E合を解決したら、以下�Eサイクルを回ぁE

1. **記録**: `docs/troubleshooting.md` に原因・対策�E教訓を追記する！ESB-XXX 形式！E
2. **インチE��クス更新**: `npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/troubleshooting.md`
3. **ルール匁E*: 繰り返し発生しぁE��問題�E `.cursor/rules/` の該当ファイルにルールとして追記すめE
4. **索引更新**: `RULES-INDEX.md` の随時メモに日付付きで1行残す

これにより AI は「過去に学んだことを二度と忘れず、常に最新を追ぁE��学習サイクルを維持する、E

---



## 第6章 RAG チE�Eタベ�Eス管琁E

### インチE��クス対象
| チE��レクトリ | 冁E�� |
|---|---|
| `docs/` | アーキチE��チャ・運用ランブック・トラブルシューチE��ング |
| `.rag/extra-docs/` | 開発憲法�Eルール・アプリ定義のコピ�E |

### インチE��クス更新コマンチE
```bash
cd /home/mhamada202408224/kintone-ai-lab

# docs/ の全ファイルを�EインチE��クス
npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest docs/

# ルール・憲法�E更新晁E
cp RULES-INDEX.md kintone-apps.md CLAUDE.md .rag/extra-docs/
npx mcp-local-rag --db-path .rag/lancedb --cache-dir .rag/models ingest .rag/extra-docs/
```

### インチE��クス更新タイミング
- `docs/` 配下�Eファイルを追加・更新したとぁE
- `RULES-INDEX.md` / `kintone-apps.md` を更新したとぁE
- トラブルシューチE��ング記録を追加したとぁE
- 月�Eの定期更新�E��Eファイル再インチE��クス�E�E

---

---

---

## 関連ファイル

| 種別 | パス |
|------|------|
| 正本 | `AGENTS.md` |
| 索弁E| `RULES-INDEX.md` |
| 読本目次 | `docs/constitution/README.md` |
| 検証 | `npm run constitution:verify-coverage` |

