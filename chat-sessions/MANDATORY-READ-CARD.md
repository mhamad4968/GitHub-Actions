# 必読カード（薄化入口）— 毎回ここから

> **正本ではない要約**。詳細はリンク先。憲法本文は消さない・書き換えない。  
> **GO**: 2026-08-02 7月振り返り提案1／4／8／9（`docs/runbooks/july-2026-ops-thinning-go.md`）

## 毎回 30 秒

1. **次の1手** = `chat-sessions/checkpoint-latest.md` 先頭のみ  
2. **完了済は出さない** — GO待ち／次の1手／質問に再掲禁止（O-5）  
3. **R63** — deploy 成功後は同一セッションで customize + kintone-apps + cio-live-builds を commit  
4. **壁時計 4h** — 接近したら handoff／checkpoint を先に更新してから続き  
5. **bootstrap** — `npm run session:bootstrap`（緑になるまで本題に入らない）

## kintone MCP 使い分け（1行）

| サーバ | いつ |
|--------|------|
| `kintone` | 本番アプリのレコード／フィールド／権限 |
| `kintone-dev` | API仕様・フィールド型の開発ドキュメント |
| `kintone-space` | スペース／ポータル／スレッド |
| `kintone-schema-mcp` | preview form／lookup 等のライブ schema |

## MCP メモ（2026-08）

- **Cold 候補**: `accessibility-scanner` は運用日 `disabled`（FE a11y 時だけ再 enable）  
- **office-powerpoint**: `neverDisable` — 無効化しない（doc-lane 時）  
- **figma / shadcn / colors-fonts**: 留置。**四半期ごと**（次: 2026-10）に利用実績で再判定  

## 詳細リンク

- Lifecycle: `docs/runbooks/session-lifecycle-v2.md`  
- MCP 選択: `.cursor/rules/mcp-server-use-triggers.mdc`  
- SKYSEA 日程: `docs/runbooks/skysea-2026-schedule.md`  
- 本改善 GO: `docs/runbooks/july-2026-ops-thinning-go.md`  
