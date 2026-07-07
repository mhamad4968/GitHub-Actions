# 復元チェックポイント（最新）

<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

**最終更新**: 2026-07-07 JST — **674 §4.10.7 削除禁止・取消 GO** · **719 一覧印刷 GO** · **736 PH1c 草案**

### 本日アクティブ（BUILD/rev — 2026-07-07）

| 項目 | 内容 |
|------|------|
| **674 新PC台帳** | BUILD=`2026-07-07-674-cancel-unlink-595` **rev254** — **物理削除禁止** · **登録ミス取消** · **671/595 解放** · **取消一覧非表示** |
| **719 Wi-Fi 台帳** | BUILD=`2026-07-07-wifi-ssid-dash-list-print-scale2` **rev12** — 一覧印刷（A4 カラー・12pt）・Excel 5列・浜田 OK |
| **736 実行予算 PH1c** | 行並び替え **Q0+UX 仕様完了（7/7）** — 草案 `docs/plans/2026-07-07-jikkou-yosan-ph1c-row-reorder-spec-draft.md` · **7/8–9 GO review** |
| **736 PH1b 部分** | 外注④〜⑦テキスト行 — 仕様起票のみ `docs/plans/2026-07-07-jikkou-yosan-ph1b-partial-subcontract-label-spec-draft.md` · **implement 7/11 以降** |
| **699 ご利用ガイド** | BUILD=`2026-07-06-bi-guide-banner-permission-label` **rev121** — **受け入れ確認待ち** |
| **700 提案申請** | BUILD=`2026-07-06-bi-apply-footer-reject-clear` **rev166** — **目視待ち** |
| **698 社員マスタ** | BUILD=`2026-07-04-bi-employee-index-emp-filter` **rev19** — **目視待ち** |

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

**次の1手**: **7/8–9** **736 PH1c** GO review（`docs/plans/2026-07-07-jikkou-yosan-ph1c-row-reorder-spec-draft.md`）· **698/700** 目視 FB · **699** 受け入れ確認  
**Git**: **`0a8a680`** = `origin/main` — push 済
**夕反省**: `docs/reports/2026-07-07-evening-reflection.md` · **698/700 レビュー**: `docs/reports/2026-07-06-bi-698-700-monday-review.md`  
**699 仕様**: Q-GUIDE-13 · `docs/plans/2026-07-06-bi-699-status-summary-spec-draft.md`  
**736 7月**: `docs/runbooks/736-july-2026-schedule.md` · PH1b 凍結正本 `docs/plans/2026-07-06-jikkou-yosan-ph1b-label-row-spec-draft.md`  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`  
**R-ORIENT-07**: 計画タスク完了 → 本日予定（736 7月表）→ 「以上です。本日の依頼をどうぞ」— **完了前は依頼を聞かない**  
**Plan&Usage**（2026-07-05）: Ultra $200/mo · 合計 21% · リセット 7/15 — 現ペース問題なし  
**運用メモ**: Desktop `18-重要確認.txt` 正本 · 本番 Excel **設定マスタ_本番** のみ · MCP `cio:mcp:env` 6/6 OK

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
