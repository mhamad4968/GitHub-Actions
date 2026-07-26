# GO: RAG 憲法・運用 aide 試行（AI チーム 1〜2 週間）

**日付**: 2026-07-26  
**承認者**: 浜田（チャット合意 — 「おすすめをやってみて AI チームで 1〜2 週間運用 → よければ広げていく」）  
**実施**: CIO（Composer）

## 範囲

- **する**: 狭い安定パックの ingest + AI チーム運用ルール（`docs/runbooks/rag-constitution-aide-trial.md`）
- **しない**: RAG を正本化／全 docs 再設計／強制 hooks 化（試行後に判断）

## コマンド

```bash
npm run rag:mirror:canonical-docs
npm run rag:ingest:constitution-aide-trial
```

## 評価

- 目安終了: **2026-08-09**
- 判定基準: 同 runbook §5

## 実施メモ（同日）

- 試行パック 20 ファイル ingest 済（Windows `.rag/lancedb`）
- `~/.cursor/mcp.json` の rag を `/mnt/c/Users/.../kintone-ai-lab` に合わせた → **Cursor MCP 再起動後**に AI チームの `query_documents` が正本 DB を見る
