---
name: kintone-cursor-automation-register
description: >-
  Cursor Automations を data/cursor-automations の prefill から登録する。
  Agents Window で open_automation を使う。通常 Composer では不可。
---

# Cursor Automations 登録

## 前提

- **Agents Window** で実行（`open_automation` が必要）
- prefill 正本: `data/cursor-automations/`

## 手順

### 1. 検証

```bash
npm run cio:cursor-automation:prefill -- --validate-all
```

### 2. 1件ずつ open_automation

manifest の `automations[]` を順に:

```bash
npm run cio:cursor-automation:prefill -- --id friday-mcp-health
```

`prefillWorkflowData` として `open_automation` に渡す。

### 3. 浜田が Save

エディタで Cloud Agent・リポジトリ接続を確認して保存。

## 4件一覧

| id | cron |
|----|------|
| friday-mcp-health | 金 17:00 |
| monday-portfolio-audit | 月 09:00 |
| wednesday-env-verify | 水 10:00 |
| daily-rag-bi-sync | 毎日 06:00 |

## 参照

- `docs/runbooks/cursor-automations-register.md`
- `~/.cursor/skills-cursor/automate/SKILL.md`
