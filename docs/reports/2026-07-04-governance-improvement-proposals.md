# 運用・ルール改善提案 — 2026-07-04

> **背景**: 本日 6役 AI 体制（§1-2-3-6）・697 本番設定・セキュリティ勉強会 masters・C:\tmp 断捨離を実施。  
> **承認**: §7 — **浜田 GO 待ち**（本ファイル提出時点）

---

## 1. 本日見えたギャップ（事実）

| # | ギャップ | 影響 |
|---|----------|------|
| G1 | **checkpoint `**Git**` 行**が close-git 同期より古い（手編集） | S-CLOSE-01 再発・verify warn |
| G2 | **C:\tmp 完了案件フォルダ**が registry/runbook に未反映のまま残存 | 次セッションが「作業中」と誤認 |
| G3 | **18-ai-team-read-map** が 4AI のみ（Architect / Visual 追補なし） | 6役 GO 後の読取順が曖昧 |
| G4 | **pending proposals 8件**（nodemailer 重複 2 件含む）が滞留 | purge-temp 適用不可・レビュー負債 |
| G5 | **session report** が BI のみ（6役・sec training・C:\tmp が未記載） | セッション 1 本報告の鏡像不足 |
| G6 | **bridge.json / debug-tips** が export-handoff 後に未 commit | 新 Chat 復元が 1 commit 遅れる |

---

## 2. 即日実施済（GO 不要 — 追随のみ）

| ID | 内容 | 正本 |
|----|------|------|
| **D-TMP-01** | `c-tmp-workspace-lifecycle.md` に 2026-07-04 棚卸し・archive パターン追記 | 本ターン commit |
| **D-CLOSE-02** | `cio-project-closure-governance.md` §G — v1 完了後 C:\tmp 廃止手順 | 本ターン commit |
| **D-AITEAM-01** | `18-ai-team-read-map.md` — Architect / Visual 追補節 | 本ターン commit |
| **D-HIER-01** | `00-rule-hierarchy.md` — 6役 runbook 3 本を第3階層に追加 | 本ターン commit |

---

## 3. ルール・手順改善 — **GO 待ち**

| ID | 種別 | 概要 | 正本候補 | 優先 |
|----|------|------|----------|------|
| **R-PENDING-01** | R | pending proposals **重複統合**（nodemailer 2→1）+ 月次 triage runbook 1 本 | `docs/runbooks/approved-changes-triage.md` 新設 | 高 |
| **S-TMP-01** | S | `verify:c-tmp-registry` — registry vs 実フォルダ突合（removedClosedV1 含む） | `scripts/verify-c-tmp-registry.mjs` | 中 |
| **S-CLOSE-02** | S | v1 完了儀式 A に **§G C:\tmp 廃止**を checklist 化（`verify:kintone-project-close-gate` 連動） | `cio-project-closure-governance.md` | 中 |
| **R-BI-03** | R | 697 **人事発令ドリブン**更新の年次 runbook（Excel→seed→validate 固定手順） | `business-improvement-closed-v1-ux.md` 拡張 | 中 |
| **D-CHKPT-02** | D | checkpoint 手編集検知を **bootstrap 時にも warn**（close-git 以外の編集） | `verify-session-close-git-warn.mjs` | 低 |
| **R-AITEAM-02** | R | `verify:mcp-four-ai-alignment` に **visual-diagram intent** 行の必須検査追加 | `ai-team-tool-routing-v2.md` | 低 |

---

## 4. 憲法・Project Rules（慎重 — 別 GO）

| 候補 | 内容 | 理由 |
|------|------|------|
| **§1-2-3-6 短文化** | AGENTS に追補済み — 散文は spec/runbook へ委譲済み | 現状維持で可 |
| **§38-1 major キュー** | nodemailer / xlsx の **レビュー期限**を closures 同型で登録 | pending 滞留防止 |
| **C:\tmp 憲法カーネル化** | `docs/constitution/24-c-tmp-workspace-kernel.md` 新設 | 第3 runbook で十分なら不要 |

---

## 5. うまくいったこと（本日）

- **697/700** 本番 Excel + seed + WF テスト admin 分離 + customize rev144
- **6役 AI** §1-2-3-6 + runbook 3 本 + routing intent（commit `a294c70`）
- **セキュリティ勉強会** masters リポ正本化 + verify npm
- **C:\tmp** closed-v1 8 フォルダ廃止 + archive 移管（`fc66c5d`）
- **mandatory-read-gate / constitution-handoff** — 維持 OK

---

## 6. 推奨 — 次セッション最初の 1 手（GO 後）

1. **R-PENDING-01** — pending 8 件を浜田と 15 分 triage（採用 / 却下 / 統合）
2. **S-TMP-01** — C:\tmp 再発防止の機械検証
3. **R-BI-03** — 8 月本番前の 697 運用 runbook 確定

---

## 7. 浜田 GO 欄

| ID | GO | メモ |
|----|:--:|------|
| R-PENDING-01 | ☐ | |
| S-TMP-01 | ☐ | |
| S-CLOSE-02 | ☐ | |
| R-BI-03 | ☐ | |
| D-CHKPT-02 | ☐ | |
| R-AITEAM-02 | ☐ | |

GO 済 ID は `docs/approved-changes/processed/2026-07-04/` へ proposal JSON 化 → 実装ターンで完走。
