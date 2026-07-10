# 復元チェックポイント（最新）

<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

**最終更新**: 2026-07-10 JST — **セッション締め**（736 PH1e/PH1f 区分・サマリー）

### 本日アクティブ（BUILD/rev — 2026-07-10）

| 項目 | 内容 |
|------|------|
| **736 実行予算** | **PH1e** 仕様明細① `spec_category`（工事費/保安費）· 合計内訳·％専用セル · rev **175–177** |
| | **PH1e-fix** `recalcState` が `spec_total_*` を state にコピーしていなかった不具合修正 · rev **176** |
| | **PH1f** 原価行 `cost_budget_category` · ⑧内訳 · **区分別サマリー**（売上①/原価⑧/粗利/粗利率）· 印刷対応 · rev **179** |
| | 詳細表②〜⑦は **区分なし** のまま（合意） |
| **698 社員マスタ** | BUILD=`2026-07-04-bi-employee-index-emp-filter` **rev19** — **目視待ち** |
| **700 提案申請** | BUILD=`2026-07-06-bi-apply-footer-reject-clear` **rev166** — **目視待ち** |

### 前セッション（2026-07-09）

| 項目 | 内容 |
|------|------|
| **674 PC台帳** | BUILD=`2026-07-09-674-list-export-col-order` **rev260** |
| **699 ご利用ガイド** | BUILD=`2026-07-09-bi-guide-list-accordion-exclusive` **rev123** |

## クローズ済み（`data/cio-project-closures.json` — 9件）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**。**触らない**: **688 / 677–679 / SKYSEA 7月**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 触らない |
| **予実管理 保留** | **677/678/679** — 触らない |
| **SKYSEA** | **8/1–8/15 再計画** · **配信目標 9/15** — **7月着手禁止** |
| **736** | **§9.6 凍結** · **7/7〜 AI 主導 §41**（736 のみ） |
| **712** | 削除済 — deploy 禁止 |

**次の1手**: **736 PH1c** 行並び替え implement · **698/700** 目視  
**Git**: **`5c601a3a`** = `origin/main` — push 済
**夕反省**: `docs/reports/2026-07-09-evening-reflection.md`  
**736 7月**: `docs/runbooks/736-july-2026-schedule.md`  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`  
**運用メモ**: Desktop `18-重要確認.txt` 正本 · 674 deploy は `desktop.bundle.js`（`pc-ledger:674:bundle-desktop`）

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
