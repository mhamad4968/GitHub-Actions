# 浜田 GO — 2026-06-29 夕反省改善案（メーリングリスト — A + R/S/D 一括承認）

**承認日**: 2026-06-29  
**承認者**: 浜田（CEO）  
**契機**: メーリングリスト 750/751 v1 CLOSED セッション夕締め反省（F1–F6）

## 承認一覧 — 行動（§2）

| ID | 内容 | 状態 |
|----|------|------|
| A-ML-01 | 案件 CLOSED 時 checkpoint に「セッション締め」「close-git 済」と書かない | **GO** |
| A-ML-02 | 「締め」「反省」「お疲れ」まで close パイプラインを起動しない | **GO** |
| A-ML-03 | 案件完了 commit 前に除外パスを 1 行明示。同一レーン dirty は同一ターン commit | **GO** |
| A-ML-04 | push 直後 checkpoint Git 行を verify 結果で更新（手書き「未 push」禁止） | **GO** |
| A-ML-05 | schema verify skip 時は TSB-039 手順 + 代替確認を残してから deploy | **GO** |

## 承認一覧 — ルール・脚本（§3）

| ID | 内容 | 状態 |
|----|------|------|
| R-ML-01 | 「案件 CLOSED ≠ セッション締め」を close-gate / checkpoint に明記 | **GO — 実装** |
| R-ML-02 | 「先走るな」= close パイプラインのみ。B1 commit は止めない | **GO — 実装** |
| S-ML-01 | verify-session-close-git-warn が untracked を reports/code 等に分類 | **GO — 実装** |
| D-ML-01 | mailing-list spec M7 / §712 を済 | **GO — 実装済** |
| D-ML-02 | TSB-039 に mailing-list deploy skip 事例追記 | **GO — 実装** |
| R-ML-03 | push 後 checkpoint Git 行の機械同期 runbook | **GO — 実装** |

## 正本

| ID | パス |
|----|------|
| R-ML-01 | `.cursor/rules/session-boundary-close-gate.mdc`, `chat-sessions/checkpoint-latest.md` 冒頭コメント |
| R-ML-02 | `.cursor/rules/session-close-execute-first.mdc` |
| S-ML-01 | `scripts/verify-session-close-git-warn.mjs` |
| D-ML-02 | `docs/troubleshooting.md` TSB-039 |
| R-ML-03 | `docs/session-report-checklist.md` §3c-1 |
