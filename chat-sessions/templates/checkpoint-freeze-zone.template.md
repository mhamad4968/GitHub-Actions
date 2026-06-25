# checkpoint 凍結ゾーン — テンプレ（≤50 行）

> 正本: `docs/runbooks/checkpoint-handoff-template-v2.md`  
> このファイルは **preamble のみ**（最初の `## YYYY-MM-DD` 日付セクション直前まで）。  
> 日付付き履歴は **書かない** → rollup 対象。

```markdown
# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: YYYY-MM-DD JST — **{本日の要約 1 行}**

### 本日アクティブ（BUILD/rev — YYYY-MM-DD）

| 項目 | 内容 |
|------|------|
| **{app}** | BUILD=`...` rev **N** — {要約} |

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

| レーン | 状態 | クローズ日 | 正本 |
|--------|------|------------|------|
| （必要行のみ） | closed-v1 | YYYY-MM-DD | `docs/reports/...` |

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | … |
| **予実管理 保留** | 677/678/679 — 触らない |
| **SKYSEA 保留** | … |
| **736 担当説明 保留** | … |

**次の1手**: **{次にやる 1 つ}** — {補足}. **触らない**: {保留レーン}  
**Git**: `{short-hash}` — {commit message 要約}（push 済/予定）  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`  
**{active-app} 本番**: BUILD=`...` rev **N**  
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** `session-boundary-close-gate.mdc` | **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
```

**更新ルール**: `次の1手` / `Git` / `最終更新` のみ差し替えが多い。表は変わったときだけ。
