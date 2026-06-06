# Cursor Automations 登録手順（2026-06-06）

**目的**: `data/cursor-automations/*.prefill.json` を Cursor Automations に登録する。

---

## 事前確認

| 項目 | 値 |
|------|-----|
| リポジトリ | `mhamad4968/GitHub-Actions` |
| ブランチ | `main` |
| Cloud Agent | [dashboard](https://cursor.com/dashboard?tab=cloud-agents) で有効 |

```bash
npm run cio:cursor-automation:prefill -- --validate-all
```

---

## 方法 A — Agents Window（推奨・一発 prefill）

1. **Cursor → Agents**（Agents Window）を開く
2. 新規エージェントに次のように依頼:

> `data/cursor-automations/friday-mcp-health.prefill.json` の内容で Cursor Automation を新規作成して。open_automation でエディタを開いて。

3. エディタで **Save**（クラウド実行・リポジトリ接続を確認）
4. 残り3件も同様（下表の id）

| 順 | id | 名前 |
|----|-----|------|
| 1 | `friday-mcp-health` | 金曜 MCP 健全性 |
| 2 | `monday-portfolio-audit` | 週次 portfolio audit |
| 3 | `wednesday-env-verify` | 週次 Cursor環境検証 |
| 4 | `daily-rag-bi-sync` | 業務改善 RAG 同期 |

---

## 方法 B — 手動（このチャットから）

1. prefill を表示:

```bash
npm run cio:cursor-automation:prefill -- --id friday-mcp-health --copy
```

2. **Cursor → Automations → New**
3. 各フィールドを JSON に合わせて入力:
   - **Trigger**: Schedule → cron 式（manifest の schedule 参照）
   - **Repository**: `mhamad4968/GitHub-Actions` / `main`
   - **Instructions**: prefill の `workflow.prompts[0].prompt`
4. **Save**

---

## 一覧・検証コマンド

```bash
npm run cio:cursor-automation:prefill -- --list
npm run cio:cursor-automation:prefill -- --validate-all
```

---

## 登録後チェック

- Automations 一覧に **4件** 表示
- 各 Automation の **Test run** で exit 0 相当の報告が返る
- 失敗時は Cloud Agent クレジット・リポジトリアクセスを確認

---

## なぜこのチャットから直接 Save できないか

通常の Composer チャットには **Automations エディタを開く機能**が無い。  
**Agents Window** では `open_automation` が使える。

---

*正本: data/cursor-automations/manifest.json*
