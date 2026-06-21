# handoff-log ブロック — テンプレ

> 正本: `docs/runbooks/checkpoint-handoff-template-v2.md`  
> **接続**: checkpoint 凍結ゾーン更新 **の後**、必ず `handoff-log.md` **末尾**に追記 → `export-handoff`

```markdown
### YYYY-MM-DD JST — **{タイトル}**

**要約**: {1〜2 行 — 何を完了/保留したか}

**次の1手**: {checkpoint の **次の1手** と一致}

**Git**: `{short-hash}` — {message}

**BUILD**（該当時）: App **NNN** — BUILD=`...` rev **N**

**GO待ち**: なし | {内容}

**触らない**: {保留レーン — 688 / 677–679 / SKYSEA 等}

---
```

**追記コマンド**（推奨）:

```bash
npm run cio:handoff:append-block -- --title "タイトル" --summary "要約" --git abc1234 --git-msg "commit msg"
```
