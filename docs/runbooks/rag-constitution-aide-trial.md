# RAG 憲法・運用 aide 試行（AI チーム · 1〜2 週間）

**開始**: 2026-07-26（浜田 GO）  
**終了目安**: 2026-08-09（約 2 週間）— 延長・本格化は浜田判断  
**役割**: **検索の補助のみ**。正本は常にリポの Read（AGENTS / `.cursor/rules` / runbook 本文）。

## 1. 何をするか

| する | しない |
|------|--------|
| ルール・TSB・夕反省・runbook の **当たりを付ける** | RAG チャンクを **権威として断定** |
| ヒット後に **正本パスを Read** してから回答 | 「RAG に書いてあった」だけで GO / 仕様断定 |
| 試行ログを夕反省に 1〜2 行（使った／役に立った／ズレた） | 全 `docs/` の再設計・大規模 ingest 拡張 |

## 2. いつ `user-rag` `query_documents` するか（AI チーム）

次の直前に **1 回**（limit 5〜8）:

1. **ルール／憲法／夕反省スコープ**を記憶だけで断定しそうなとき
2. **TSB・過去の類似失敗**を探す初動（§20 と整合）
3. **依頼者資料レビュー**で「前回どう書いたか」を探すとき
4. **runbook（A/B/C/D・evening・requester-doc）**の節番号が曖昧なとき

**スキップしてよい**: 既に当該正本を **本ターンで Read 済み**のとき／単純な文言修正で根拠パスが明示されているとき。

## 3. 権威の順序（デュアル正本禁止）

```
1. リポ正本を Read（AGENTS / mdc / docs/runbooks / SPEC）
2. RAG は「どのファイルを Read すべきか」の指針
3. 矛盾 → 正本勝ち。RAG は stale の可能性あり → mirror/ingest 更新を検討
```

DeepSeek/Kimi 合意: **RAG を正本と並べて二重引用しない**。

## 4. 試行パック（安定・狭い）

ingest 対象は `npm run rag:ingest:constitution-aide-trial`（`scripts/rag-ingest-constitution-aide-trial.mjs`）:

- 憲法ナビ: `docs/constitution/00-rule-hierarchy.md` / `05-knowledge-rag.md` / `17-four-ai-mode-b.md` / `18-ai-team-read-map.md`
- 運用: `docs/runbooks/evening-reflection-scope.md` / `requester-doc-review-one-at-a-time.md` / A・B・C・D v2 / **本 runbook**
- 直近夕反省: `docs/reports/2026-07-*-evening-reflection.md`（直近 14 日分を脚本が収集）
- 正本ミラー: 既存どおり `rag:mirror:canonical-docs`（AGENTS 等）— 本試行は **置き換えない**
- 集約先 `.rag/extra-docs/constitution-aide-trial/` は **再生成物（gitignore）** — git には載せない

## 5. 成功判定（2 週間後に浜田へ）

| 良い | やめる／狭める |
|------|----------------|
| 「どのルールを Read すべきか」が早く当たる | ヒットが毎回ズレて正本 Read が増えるだけ |
| 夕反省・#CON 系の再発が減る（体感で可） | RAG 断定で誤答が増える |
| AI が「未確認」と言う回数が増える（良い） | ingest メンテが重い |

**広げ方（GO 後）**: troubleshooting 全量・session 直近・SPEC レーン別 — 一括ではなく **レーン単位**。

## 6. 週次メンテ（CIO）

1. 正本 4 + constitution ミラー: `npm run rag:mirror:canonical-docs`
2. 試行パック再 ingest: `npm run rag:ingest:constitution-aide-trial`（**Windows リポ**＝正本）
3. スモーク: MCP `query_documents` で「夕反省 明日やること 禁止」等が当たること

### MCP 経路（2026-07-26 修正）

- `~/.cursor/mcp.json` の rag は **`BASE_DIR` / `DB_PATH` / `CACHE_DIR` = `/mnt/c/Users/mhamada202408224/kintone-ai-lab`**（旧 `/home/.../kintone-ai-lab` は別クローンで stale）。
- **mcp.json 変更後は Cursor の MCP 再起動**が必要。再起動前は MCP 検索が古い DB のままになる。

## 7. GO 記録

`docs/approved-changes/2026-07-26-rag-constitution-aide-trial-hamada-go.md`
