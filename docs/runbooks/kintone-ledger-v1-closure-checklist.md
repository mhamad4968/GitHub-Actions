# 台帳 v1 クローズ標準チェックリスト（R41）

**制定**: 2026-06-17（浜田 GO — R41）  
**関門**: **kintone 台帳 v1 の「目視 OK → CLOSED」締めターン**で本書を完走  
**親 runbook**: [`cio-project-closure-governance.md`](cio-project-closure-governance.md) §A

---

## 前提

- 浜田 **目視 OK** 済み
- 本番 customize deploy 済み（`npm run deploy:<appId>` または CI `kintone-customize-deploy` success）
- SPEC 状態が **v1 完成** または **CLOSED** に更新済み

---

## チェックリスト（順序固定・省略禁止）

| # | 項目 | 正本 / コマンド | ✓ |
|---|------|-----------------|---|
| 1 | **完成サマリー** | `docs/reports/YYYY-MM-DD-<lane>-completion.md` | |
| 2 | **SPEC 状態 CLOSED** | `docs/plans/*-<lane>-kintone-spec.md` 状態行 | |
| 3 | **closures 登録** | `data/cio-project-closures.json` — `status: closed-v1`・`forbiddenNextTaskPatterns` | |
| 4 | **kintone-apps.md** | 該当セクションに **v1 完成** + BUILD/rev | |
| 5 | **live-builds / registry** | `data/cio-live-builds.json`・`data/kintone-customize-path-registry.json` | |
| 6 | **checkpoint 先頭** | `**最終更新**` / `**次の1手**` / 凍結表 1 行 / **`**Git**`** 行 | |
| 7 | **handoff 末尾** | `chat-sessions/handoff-log.md` — BUILD・正本・再開条件 | |
| 8 | **SESSION-CLOSE** | `chat-sessions/SESSION-CLOSE-REPORT_YYYYMMDD.txt`（明日の手順は書かない） | |
| 9 | **ESLint** | `npm run lint:customize` — error 0 | |
| 10 | **close-gate 一括** | `npm run verify:kintone-project-close-gate` | |
| 11 | **closure 整合** | `npm run verify:checkpoint-project-closure` | |
| 12 | **Git 締め** | `npm run cio:session:close-git -- --execute --auto-stage --message "[CLOSE] …"` | |
| 13 | **GitHub CI** | `gh run list --branch main --limit 5` — constitution-gates / customize-deploy success | |

---

## CLOSE コミットに含めるファイル（目安）

| 種別 | 例 |
|------|-----|
| customize | `customize/<lane>-db/` `customize/<lane>-dash/` |
| scripts | `scripts/<lane>-*.mjs` `scripts/data/<lane>-*.json` |
| docs | SPEC・完成報告 |
| data | closures・live-builds・registry |
| checkpoint | `chat-sessions/checkpoint-latest.md` |

**混在禁止**: 無関係レーン（別台帳・governance 単独）を CLOSE コミットに混ぜない。

---

## 機械検査（PowerShell）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
npm run verify:kintone-project-close-gate
npm run verify:checkpoint-project-closure
npm run cio:project:close -- --verify
```

---

## scaffold 生成

```powershell
npm run kintone:ledger-v1-scaffold -- --id <lane-id> --label "表示名" --apps <db>,<dash> --dirs <db-dir>,<dash-dir> --date 2026-06-17
```

---

## 関連

- [`kintone-project-close-gate.md`](kintone-project-close-gate.md)（R36）
- [`kintone-ledger-spec-qa-checklist.md`](kintone-ledger-spec-qa-checklist.md)（SPEC GO 前）
- [`windows-governance-ops.md`](windows-governance-ops.md)（R48 PowerShell 標準形）
- [`docs/plans/_TEMPLATE-kintone-ledger-spec.md`](../plans/_TEMPLATE-kintone-ledger-spec.md)（R46）
