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

## 5b. 中間観測（2026-07-28 · CIO）

| 観測 | 判定 |
|------|------|
| 索引規模 | hybrid · docs≈276 · chunks≈14k — **稼働している** |
| 当たり良い例 | tool-routing / R63 / aide runbook 自体 — **当たりやすい** |
| 当たり弱い例 | 曖昧クエリ「§1 四行」「完了済をGO待ち」→ 旧反省・無関係に偏る。**Exact / 固有語**だと checkpoint が当たる（再 ingest 後） |
| ルート誤配 | intent に `effectiveness` があると github-ci の短語 `CI` が部分一致（**修正済**: 短 ASCII は単語境界） |
| scope 注意 | MCP base は `/mnt/c/...`。Windows 風 `C:\...` scope は **マッチ0**（相対扱い） |
| 結論（中間） | **効き目は「当たり付け」としては出ている**。正本の代替にはなっていない（設計どおり）。**クエリの具体性**と**現行案内の ingest**が効きを左右。フル拡大は 8/9 判定後 |

## 6. 週次メンテ（CIO）

1. 正本 4 + constitution ミラー: `npm run rag:mirror:canonical-docs`
2. 朝 prep: **毎回** `rag:aide-smoke --sync-only`／**月曜 JST**（または `MORNING_PREP_RAG_AIDE=1`）でフル `rag:aide-smoke`
3. フル後の MCP 目視 2 クエリ:
   - `夕反省 明日やること 禁止`
   - `完了済を GO待ち／次の1手／質問に出さない`（Exact 寄り）
4. scope を絞るときは **`/mnt/c/...` 形式**（`C:\` はマッチ0）— `ai-team-tool-routing-v2.md` §11

### MCP 経路（2026-07-26 修正）

- `~/.cursor/mcp.json` の rag は **`BASE_DIR` / `DB_PATH` / `CACHE_DIR` = `/mnt/c/Users/mhamada202408224/kintone-ai-lab`**（旧 `/home/.../kintone-ai-lab` は別クローンで stale）。
- **正本は `scripts/sync-cursor-mcp-windows-from-wsl.mjs`**（close-git の `mcp:sync-cursor-windows` が Windows mcp.json を上書きするため、脚本側を直さないと戻る）。
- **mcp.json 変更後は Cursor の MCP 再起動**が必要。

## 7. GO 記録

`docs/approved-changes/2026-07-26-rag-constitution-aide-trial-hamada-go.md`
