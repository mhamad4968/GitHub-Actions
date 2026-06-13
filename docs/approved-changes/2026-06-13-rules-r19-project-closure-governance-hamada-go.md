# ルール更新 R19 — プロジェクト完了・認識同期ガバナンス（2026-06-13）

> **承認者**: 浜田  
> **承認文**: 「ルール化も含めてしっかりAIチームで管理してほしい。わたしとAIチーム間で間違った認識が出て事故になることは避けたい」  
> **教訓**: 業務改善 v1 完了（2026-06-13）後も checkpoint/handoff が 6/11 の Q-SCHED-03 のまま → 新セッションで誤ブリーフィング

---

## 承認一覧

| ID | 概要 | 実装状態 |
|----|------|----------|
| **R19** | プロジェクト v1 完了の儀式 + ブリーフィング前 3 系統突合 + 機械 verify | ✅ 本パッケージ |

---

## 正本リンク

| 種別 | パス |
|------|------|
| Runbook | `docs/runbooks/cio-project-closure-governance.md` |
| AI-KERNEL | `docs/constitution/23-project-closure-recognition-kernel.md` |
| Cursor rule | `.cursor/rules/cio-project-closure-gate.mdc` |
| TSB | `docs/troubleshooting.md` **TSB-038** |
| 登録 | `data/cio-project-closures.json` |

---

## 機械ゲート

```powershell
npm run verify:checkpoint-project-closure
npm run cio:briefing:recognition-gate
npm run cio:session:close-recognition-gate
npm run verify:cio-project-closure-governance
npm run verify:cio-four-ai-governance
```

---

## 再開条件

業務改善 v1 再開は **浜田 GO + closures 解除 + checkpoint 次の1手更新** のみ（R19 §C）。
