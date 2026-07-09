# Grok 実行契約（CIO が埋めてチャットに貼付）

> 正本: `docs/runbooks/cio-grok-execution-loop.md`  
> モード: **B** = 単発 / **C** = verify 緑まで自律（上限付き）

---

## 【Grok 実行契約】

| 項目 | 値 |
|------|-----|
| **Mode** | B / C |
| **Goal** | （例: `lint:customize` を exit 0 にする） |
| **In-scope** | （例: `customize/736/desktop.js` のみ） |
| **Out-of-scope** | SPEC 意味変更 / deploy:* / git push / kintone PUT / 他アプリ / 憲法・hooks |
| **Done when** | （例: `npm run lint:customize` exit 0） |
| **Composer 初回 Diff** | 済 / 未（C は **済** 必須） |
| **§50-3-8** | 実施済 / 非該当（理由: …） |
| **Limits** | 15 tool calls · 10 min · 同一エラー 3 回で停止 |
| **Allowed MCP（read-only）** | eslint-mcp / kintone-schema-mcp / git-history-mcp / repo-tree（CIO が必要分のみ列挙） |
| **Allowed shell** | （例: `npm run lint:customize` / `npm run smoke:quiet` のみ） |
| **Forbidden shell** | deploy:* / git push / kintone REST PUT/POST/DELETE |
| **contractHash** | （stamp 後に guard が出力 — Subagent 起動時に照合） |

### エラー上下文（末尾貼付）

```
（直近の stderr / verify 出力）
```

### Grok 出力必須

1. 最有力原因 1 行  
2. 変更したファイル一覧  
3. 残リスク 1 行  

---

**CIO 検収後**: deploy / preflight は CIO が実行（Grok 禁止）。
