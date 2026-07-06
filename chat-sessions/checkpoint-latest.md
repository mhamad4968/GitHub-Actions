# 復元チェックポイント（最新）

<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED**（kintone レーン v1 完了・closures 登録）≠ **セッション締め**（export-handoff / Desktop sync / close-git）。混同禁止 -->

**最終更新**: 2026-07-06 JST — **699 Q-GUIDE-13 GO** · **736 PH1b 凍結** · **698/700 レビュー待ち**

### 本日アクティブ（BUILD/rev — 2026-07-06）

| 項目 | 内容 |
|------|------|
| **699 ご利用ガイド** | BUILD=`2026-07-06-bi-guide-banner-permission-label` **rev121** — Q-GUIDE-13 サマリー表 + 権限ラベルバナー |
| **700 提案申請** | BUILD=`2026-07-06-bi-apply-footer-reject-clear` **rev166** — 月曜レビュー機械 OK · **目視待ち** |
| **698 社員マスタ** | BUILD=`2026-07-04-bi-employee-index-emp-filter` **rev19** — 同上 |
| **736 実行予算** | **PH1b 凍結** · **PH1c 仕様 7/7–9 / 実装 7/11** · UI-BACKLOG / BL-DETAIL 7月表確定 |

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

**次の1手**: **7/7** **736 PH1c** たたき台 + Q0 · **698/700** 目視 FB · **699** 受け入れ確認  
**Git**: **`31dca6c`** = `origin/main` — 699 banner まで push 済 · **締め commit これから**  
**夕反省**: `docs/reports/2026-07-06-evening-reflection.md`  
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` | **736 7月**: `docs/runbooks/736-july-2026-schedule.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
