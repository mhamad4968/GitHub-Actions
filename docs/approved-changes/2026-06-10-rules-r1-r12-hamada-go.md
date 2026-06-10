# ルール更新 R1–R12 — 浜田 GO（2026-06-10 夜）

> **承認者**: 浜田  
> **承認文**: 「明日以降のアップデート案（承認待ち）すべてOK」  
> **反映 commit**: （本ファイル同梱）

---

## 承認一覧

| ID | 概要 | 実装状態 |
|----|------|----------|
| **R1** | deploy 前 UI 主張 vs built JS grep | ✅ `scripts/workdays-verify-built-ui.mjs`（6/9） |
| **R2** | 表データ (calYear,m) 昇順 | ✅ `workdays-calc-gate` + runbook §3 |
| **R3** | deploy 後 kintone-apps BUILD 同期 | ✅ `scripts/sync-kintone-apps-build.mjs` |
| **R4** | calc-core 変更時 calc-gate 同梱 | ✅ `scripts/workdays-calc-gate.mjs` |
| **R5** | 締め文書スコープ固定 | ✅ `docs/runbooks/session-close-reflection-scope.md` |
| **R6** | workdays deploy チェックリスト | ✅ `docs/runbooks/workdays-deploy-checklist.md` |
| **R7** | 憲法・索引変更後 Desktop 同期同一ターン | ✅ `docs/runbooks/cio-four-ai-governance.md` |
| **R8** | PowerShell `;` / bash `&&` 明記 | ✅ `WORKFLOW.md` |
| **R9** | extract-genres CRLF 固定 | ✅ `scripts/extract-constitution-by-genre.mjs` |
| **R10** | workdays deploy-gate 一括 | ✅ `scripts/workdays-deploy-gate.mjs` + `deploy:687/688` |
| **R11** | SESSION-ONE-REPORT 当日化 | ✅ `19-SESSION-ONE-REPORT-2026-06-10.md`（旧 06-05 は archive） |
| **R12** | npm audit `xlsx` リスク受容 | ✅ `docs/reports/2026-06-10-pc-maintenance.md` §R12 |

---

## 正本リンク

- 6/9 提案: `docs/reports/2026-06-09-evening-reflection.md`
- 6/10 提案: `docs/reports/2026-06-10-evening-reflection.md`
- workdays: `docs/runbooks/workdays-deploy-checklist.md`
- governance: `docs/runbooks/cio-four-ai-governance.md`

---

## 意図的に未実施

- `xlsx` パッケージ代替 lib への置換（R12 は **受容記録のみ**）
- AGENTS.md § 本文への R2/R5 追記（runbook + WORKFLOW で足りる判断）
