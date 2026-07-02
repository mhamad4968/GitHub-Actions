# 浜田 GO — 2026-07-02 夕反省改善案（595 退職PCリンク・メーリングリスト Space21 — 一括承認）

**承認日**: 2026-07-02  
**承認者**: 浜田（CEO）  
**契機**: 595 fix / 750・751 Space21 移設セッション夕反省（F1–F7）+ 夜間再開ターン

## 承認一覧 — ルール・脚本（§3）

| ID | 内容 | 状態 |
|----|------|------|
| **R-ML-03** | `mailing-list-move-space21.mjs` 完走時に SPEC/完成報告/closures/kintone-apps を同時 patch | **GO — 実装** |
| **S-CLOSE-01** | checkpoint Git 行の origin/main 先祖返りを close-git-warn で WARN | **GO — 実装** |
| **S-ML-05** | `verify-mailing-list-751.mjs` Windows UV crash 時 flush exit（TSB-039 同型） | **GO — 実装** |
| **R-595-03** | deploy 後 `verify-kintone-apps-live-build-sync` + sync 連鎖（garble 防止） | **GO — 実装** |
| **D-CREDIT-01** | `verify:session-close-git-warn` 末尾に credit stale_nudge 1 行 | **GO — 実装** |

## 正本

| ID | パス |
|----|------|
| R-ML-03 | `scripts/mailing-list-move-space21.mjs`, `scripts/lib/mailing-list-space-doc-sync.mjs` |
| S-CLOSE-01 | `scripts/lib/cio-checkpoint-git-sync.mjs`, `scripts/verify-session-close-git-warn.mjs` |
| S-ML-05 | `scripts/verify-mailing-list-751.mjs` |
| R-595-03 | `scripts/deploy-customization.js`, `scripts/verify-kintone-apps-live-build-sync.mjs` |
| D-CREDIT-01 | `scripts/verify-session-close-git-warn.mjs` |

## 付記（MCP / npm — 本ターン判断）

| 項目 | 判断 |
|------|------|
| **MCP パッケージ upgrade** | **不要** — `cio:mcp:env` **6/6 OK**。Tier B（`mcp.json` pin 変更）は計画書どおり **触らない** |
| **npm minor** | **GO 実施** — `@kintone/cli` 1.20.0 / eslint 10.6.0 / globals 17.7.0 / qrcode 1.5.4 |
| **nodemailer 9.x** | **見送り** — major・SMTP 挙動変化リスク |
