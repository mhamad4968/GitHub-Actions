# 朝報（morning-prep）未生成日の扱い

**制定**: 2026-07-07（浜田 GO · evening-reflect-queue 消化）

## 原則

| 状況 | 対応 |
|------|------|
| **`docs/reports/<JST今日>-morning-prep.md` あり** | セッション **項番 0 前**に Read → 緑/黄/赤を宣言 |
| **なし（cron 未実行・休日等）** | **ブロックしない** — 下記 **手動 1 本** または **`npm run cio:quick-health`** で代替 |
| **手動生成** | `TZ=Asia/Tokyo node scripts/daily-morning-prep.mjs`（所要 ~6 分 · **gitignore** のため commit 不要） |

## AI 手順（-0 / bootstrap 前）

1. 当日 `*-morning-prep.md` を Glob — **無ければ**「朝報未生成 — quick-health で代替」と **1 行宣言**
2. `npm run cio:quick-health` を実行（または浜田が手動生成を指示）
3. **夕反省に「朝報なし」を書かない**（本 runbook が正本）

## 禁止

- 朝報未生成を理由に **kintone 着手を無期限停止**
- morning-prep `.md` を **git add**（`.gitignore` 対象）
