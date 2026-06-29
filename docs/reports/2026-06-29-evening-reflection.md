# 夕反省 — 2026-06-29（メーリングリスト 750/751 v1 CLOSED + NAS 748/749 sync）

> **スコープ**: `docs/runbooks/evening-reflection-scope.md` — **AI 失敗** + **ミス削減**（行動 **および** ルール・手順・脚本）  
> **承認**: 本ファイル §3 の ID — **浜田承認待ち**（承認後 `docs/approved-changes/2026-06-30-rules-mailing-list-evening-hamada-go.md`）

---

## 1. 本日 AI が失敗したこと

| # | 私がやったこと（失敗） | 結果 |
|---|------------------------|------|
| F1 | **案件 CLOSED** と **セッション締め** を混同し checkpoint に「セッション締め」と記載 | 浜田指摘 — クローズ ≠ 締め |
| F2 | 締め・反省の **先走り**（`evening:reflect` 雛形生成・close-git 文言） | 「先走るな」指摘 |
| F3 | メーリングリスト commit 時 **NAS 748/749 の dirty を意図的に除外**し、その後 **B1 整理も止めた** | 未コミット残 → 浜田が再依頼 |
| F4 | push 後も checkpoint に **「origin 未 push」** と残した | ブリーフィング 3c と矛盾 |
| F5 | 712 ポータルリンクを **未完了として残タスクに列挙** | 浜田 — 済み |
| F6 | Windows `verify:kintone-live-schema` UV crash 後 **skip deploy** の証跡が弱い | TSB-039 再発リスク（mailing-list deploy） |

---

## 2. 改善 — 私が次から変えること（行動）— 承認済み

| ID | 失敗 | 私が次から変えること | 状態 |
|----|------|----------------------|------|
| **A-ML-01** | F1 | **案件 CLOSED** 宣言時は checkpoint に **「セッション締め」「close-git 済」** と書かない | **GO** |
| **A-ML-02** | F2 | 浜田が **「締め」「反省」「お疲れ」** と言うまで close パイプラインを **起動しない** | **GO** |
| **A-ML-03** | F3 | **案件完了 commit** 前に `git status` を読み、**除外パスをチャット 1 行で明示**。同一レーン dirty は **同一ターンで commit** | **GO** |
| **A-ML-04** | F4 | push 直後 **checkpoint Git 行を verify 結果で更新**（手書き「未 push」禁止） | **GO** |
| **A-ML-05** | F6 | schema verify skip 時は **TSB-039 手順 1 行 + 代替確認** を残してから deploy | **GO** |

### §1-N 憲法運用レビュー（2026-06-29 結論）

- **CIO 二人体制**: 本日 kintone 実装は **本体のみ**。§50-3-8 スキップ — 仕様確定・目視 OK は浜田、実装・deploy は本体（妥当）。
- **§1c**: メーリングリスト spec Q&A は **一問一答**で進行 — 確定前に実装しなかった。
- **MCP**: health-check **36/36 OK**（死蔵 4 は参考）。`mcp-status:refresh-usage` を締め前に実行。
- **ルールと実態**: **CLOSED / セッション締め / B1** の三語が今日ほつれた — §3 R-ML-01〜03 で恒久化提案。

---

## 3. ルール・手順・脚本改善 — 承認済み・実装

| ID | 対応失敗 | 概要 | 正本 | 状態 |
|----|----------|------|------|------|
| **R-ML-01** | F1 | 「案件 CLOSED」≠「セッション締め」明記 | `session-boundary-close-gate.mdc` | **実装** |
| **R-ML-02** | F2,F3 | 「先走るな」= close のみ。B1 は止めない | `session-close-execute-first.mdc` | **実装** |
| **S-ML-01** | F3 | untracked 分類 reports/code | `verify-session-close-git-warn.mjs` | **実装** |
| **D-ML-01** | F5 | spec M7 / §712 済 | mailing-list spec | **実装済** |
| **D-ML-02** | F6 | TSB-039 mailing-list 事例 | `troubleshooting.md` | **実装** |
| **R-ML-03** | F4 | push 後 checkpoint Git runbook | `session-report-checklist.md` §3c-1 | **実装** |

---

## 4. うまくいったこと（事実）

- メーリングリスト **750/751** — spec → 実装 → 63 件移行 → 目視 OK → v1 CLOSED → push まで **1 日完遂**。
- NAS **os_type / xlsx resync / ホスト名列** — live rev 17 と repo **`b584332`** 同期。
- B1 再発防止 — 浜田指摘後 **同一セッションで commit+push**。
- GitHub Actions — 本日 push **すべて success**（constitution-gates / kintone-customize-deploy）。

---

## 5. 承認済み

**2026-06-29 浜田 GO — すべて承認・§3 実装完了**

- **行動**: A-ML-01 〜 A-ML-05  
- **ルール・脚本**: R-ML-01, R-ML-02, S-ML-01, D-ML-01, D-ML-02, R-ML-03  
- **正本**: `docs/approved-changes/2026-06-29-rules-mailing-list-evening-hamada-go.md`

---

## 6. メモ

- 最大の失敗は **F1+F2（CLOSED と締めの混同 + 先走り）**。
- §3 は明日のレーンではなく **今日の再発防止** に限定。
