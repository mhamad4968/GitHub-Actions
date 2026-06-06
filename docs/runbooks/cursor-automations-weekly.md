# Cursor Automations — 週次・定期運用（Phase D）

**目的**: AIチームの **自律レベルアップ** をカレンダーで補強する。  
**前提**: 浜田 PC・Cursor Automations 利用可（Agents Window）。

---

## Automation 案（prefill 作成済 — 登録は Agents Window）

| id | 名前 | トリガー | prefill |
|----|------|----------|---------|
| `friday-mcp-health` | 金曜 MCP 健全性 | 金 17:00 | `data/cursor-automations/friday-mcp-health.prefill.json` |
| `monday-portfolio-audit` | 週次 portfolio audit | 月 09:00 | `monday-portfolio-audit.prefill.json` |
| `wednesday-env-verify` | 週次 Cursor環境検証 | 水 10:00 | `wednesday-env-verify.prefill.json` |
| `daily-rag-bi-sync` | 業務改善 RAG 同期 | 毎日 06:00 | `daily-rag-bi-sync.prefill.json` |

**登録手順**: `docs/runbooks/cursor-automations-register.md`  
**検証**: `npm run cio:cursor-automation:prefill -- --validate-all`

| 手動代替 | 内容 |
|----------|------|
| checkpoint rollup | sessionEnd hook または `cio:checkpoint:rollup -- --keep 8` |

## デモスモーク（7/1 前）

```bash
npm run smoke:bi-demo -- --dry-run
```

実画面は **chrome-devtools MCP** または **playwright MCP** で各ステップを記録。

## アクセシビリティ（customize 後）

**accessibility-scanner MCP** — 業務改善 Q55（60歳以上・16px/18px）を検証。

## Cursor SDK（8/1 前・低優先）

- `sync-595` 夜間ジョブ
- リマインド 3日おき

→ `docs/plans/_future/` に別途 SPEC を起こす。

## 作成手順

1. `npm run cio:cursor-automation:prefill -- --validate-all`
2. **Agents Window** で Skill `kintone-cursor-automation-register` を使用
3. 各 id を `open_automation` でエディタに prefill → **Save**

---

*2026-06-06 Phase D — prefill 4件作成済*
