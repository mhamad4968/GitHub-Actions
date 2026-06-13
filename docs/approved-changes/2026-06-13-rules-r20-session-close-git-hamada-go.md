# ルール更新 R20 — 締め commit+push + 先祖返り回避連鎖（2026-06-13）

> **承認者**: 浜田  
> **承認文**: Phase 2 着手（kintone 目視 OK 後「次」）— 安全性・先祖返り禁止を最優先  
> **関連**: Phase 1 checkpoint bootstrap 復元（commit `7913875` 系）

---

## 承認一覧

| ID | 概要 | 実装状態 |
|----|------|----------|
| **R20** | `cio:session:close-git` が R19 突合 → commit → pull --rebase → push → desktop sync を一括 | ✅ 本パッケージ |

---

## 正本

| 種別 | パス |
|------|------|
| スクリプト | `scripts/cio-session-close-git.mjs` |
| Cursor | `.cursor/rules/cio-session-close-git-gate.mdc` |
| Runbook | `docs/runbooks/session-close-multi-session.md` |
| 18 | `18-重要確認.txt` B1/B4 + 先祖返り節 |

---

## 機械ゲート

```powershell
npm run cio:session:close-git -- --execute --auto-stage --message "…"
npm run verify:cio-r20-session-close-git-infra
npm run verify:cio-four-ai-governance
```

---

## 緊急脱出

`--skip-desktop-sync` / `--skip-r19` — 浜田 GO + チャット理由 1 行必須（通常禁止）
