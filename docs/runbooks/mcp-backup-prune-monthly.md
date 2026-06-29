# mcp.json.bak-* 月次世代整理 — 運用 runbook

> **制定**: 2026-06-28  
> **目的**: API キー含有の `.bak-*` を **毎月 1 回**整理（セキュリティ + フォルダ衛生）

---

## 1. 仕組み（3 層）

| 層 | 内容 |
|----|------|
| **① 自動（主）** | Windows タスク スケジューラ — 毎月 **1 日 08:30**（ローカル TZ） |
| **② 随時** | `mcp:sync` / `mcp:overlay` 実行後の **自動 prune**（各 3 世代保持） |
| **③ 監視** | `health-check` / `verify:mcp-backup-prune-monthly` — **35 日超**で WARN |

---

## 2. 初回セットアップ（1 回だけ）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab

# タスク登録（毎月 1 日 08:30）
npm run mcp:prune-backups:install-task

# 即時 1 回実行 + 実行記録（stamp）
npm run mcp:prune-backups:monthly

# 確認
npm run verify:mcp-backup-prune-monthly
```

**記録ファイル**: `logs/mcp-backup-prune-last.json`  
**実行ログ**: `logs/mcp-prune-scheduled-*.log`

---

## 3. 月次（浜田 / CIO）

| タイミング | やること |
|------------|----------|
| **毎月 1 日** | タスクが自動実行（手動不要） |
| **金曜 health-check** | WARN が出たら `npm run mcp:prune-backups -- --apply` |
| **月次定例** | `npm run verify:mcp-backup-prune-monthly` が OK であること |

カレンダー登録: `docs/runbooks/cio-periodic-ops-schedule.md` 参照。

---

## 4. コマンド早見

```powershell
npm run mcp:prune-backups              # dry-run
npm run mcp:prune-backups -- --apply   # 手動実行
npm run mcp:prune-backups:monthly      # apply + stamp（タスク本体）
npm run verify:mcp-backup-prune-monthly
npm run mcp:prune-backups:uninstall-task
```

---

## 5. 保持ポリシー

- sync バックアップ: **3 世代**
- overlay バックアップ: **3 世代**
- 手動バックアップ: **1 世代**

---

## 6. 関連

- `docs/mcp-status.md` — MCP 台帳
- `scripts/lib/mcp-json-backup-retention.mjs` — prune ロジック
- TSB-028 — mcp.json 二重正本
