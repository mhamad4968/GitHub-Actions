# 復元チェックポイント（最新）
**最終更新**: 2026-09-10 21:50 JST — 日終わり⑦。715 VL連続・756業者契約期間 目視OK。夕反省全GO（#O1 #T1 #R1 #C1 #M1 #M2）。
**次の1手**: 濱田が Desktop「共有PC_部長金庫_手順書.docx」で設定（後日可）。756 の追加 customize は新しい明示依頼まで作らない。
**レーン変更**: 日終わり完了
**Git**: **`55c5f050`** = `origin/main` — push 済
**closeStatus**: **closed-day**
**制約**: 閉済9件／ジャンル細分化禁止／A6-Sしない／印刷グラフ縮小禁止／720–721・682/683・**749 UX**再開は明示GOまで／**736不触**／688 WBGT以外不触／**浜田が言ったことを聞き直さない**／G0ロック範囲を再質問しない
**本日状態**: **756**=`2026-09-10-ver02-vendor-contract-period` rev**363**。**715**=`2026-09-10-715-vl-serial-continue` rev**28**。749=`2026-08-29-749-ux-toolbar-copy-pill-print` rev**18**。696=`2026-08-24-696-modal-keep-open` rev**18**。682=`2026-08-23-682-banner-label-clarify` rev**30**。683=`2026-09-02-683-wiring-print-box` rev**117**。721=`2026-08-23-jr-ipad-dash-p2-vux` rev**17**
**674 live fileKey**: `a16f2595-8e7c-44b2-8bec-98e329aca6c3`
### 本日アクティブ（BUILD/rev — 2026-09-10）
| App | BUILD | rev |
|-----|-------|-----|
| **756** | `2026-09-10-ver02-vendor-contract-period` | **363** |
| **715** | `2026-09-10-715-vl-serial-continue` | **28** |
| **749** | `2026-08-29-749-ux-toolbar-copy-pill-print` | **18** |
| **696** | `2026-08-24-696-modal-keep-open` | **18** |
| **682** | `2026-08-23-682-banner-label-clarify` | **30** |
| **683** | `2026-09-02-683-wiring-print-box` | **117** |
| **721** | `2026-08-23-jr-ipad-dash-p2-vux` | **17** |
| **776** | `2026-08-22-776-reorder-range-put` | **75** |
| **595** | `2026-08-22-595-preserve-primary-list-sort` | **152** |
| **674** | `2026-08-19-674-replace-fill-emp-id` | **341** |
**継続メモ**: 統括原価行正本 `docs/plans/2026-09-08-jikkou-yosan-v2-summary-cost-row-close.md`。設定タブ駐車 `docs/plans/2026-09-06-jikkou-yosan-v2-salary-staff-settings-tab-parked.md`。共有PC金庫手順は Desktop `共有PC_部長金庫_手順書.docx`（ラボ外）。**MCP 試用は自発提案してよい**（足すのは GO 後・`docs/mcp-status.md` §MCP-opt）。#M2 は JS deploy 前に `list_field_codes`（preview）。Mac Studio M3 Ultra 96GB/16TB・2026-12-20購入／2027-02移行
**GO待ち**: なし（③全GO済）
**調査正本**: `docs/plans/2026-09-08-jikkou-yosan-v2-summary-cost-row-close.md`
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## クローズ済み（`data/cio-project-closures.json` — 9件）
業務改善697–713 / Wi-Fi718–719 / **JR iPad720–721=closed-v1** / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753**
<!-- freeze-zone pad for mandatory-read-gate minChars ································································································································-->

## 保留・その他の制約
| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | **案件外**（2026-08-10）— 手動インストール。kintone登録は浜田指示時のみ |
| **736** | 現行版保持・触らない |
| **756/757/758** | 756 LIVE rev363 · 757 rev31 · 757 customize 未deploy |
| **712** | 削除済 — deploy 禁止 |

<!-- freeze-zone minChars pad (244+ chars; keep for mandatory-read-gate) ·······································································································································································-->
## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-09-10

### 2026-09-10 夜（日終わり after-go）
- 715 LIVE `2026-09-10-715-vl-serial-continue` rev**28**。VL 同一シリアル連続。目視OK
- 756 LIVE `2026-09-10-ver02-vendor-contract-period` rev**363**。業者契約期間。目視OK
- 夕反省全GO: #O1 目視同一ターン push / #T1 Composer / #R1 3点セット / #C1 push衝突1行 / #M1 Kimi ENOENT / #M2 schema MCP preview


## 2026-09-09

### 2026-09-09 夜（日終わり after-go）
- 756 LIVE `2026-09-09-ver02-ascii-num-ime` rev**361**。数量・単価は半角で入る。目視OK
- 夕反省全GO: #O1 目視文面 / #M1 Kimi list-models→DeepSeek / #G1 pending≠Actions
- 9/10 関係者レビュー待ち。設定タブ駐車。共有PC金庫は後日 Desktop Word



## 2026-09-08

### 2026-09-08 夜（日終わり until-pause）
- 756 このラウンド終了（rev359・9/10待ち）。customize 追加なし
- 共有PC金庫: 相談のみ。アイドル切断はタスクスケジューラ。明日1から手順書を作って設定。ラボに手順を置かない
- day-close ③ 承認待ち。heal treadmill しない

### 2026-09-08 夕（756統括原価行クローズ）
- 756 LIVE `2026-09-08-ver02-summary-himoku-type` rev**359**。原価行11列・ブロック×費目×種別。浜田目視OK
- 9/10 関係者レビュー。原価管理・作業者設定は今作らない
- 正本 `docs/plans/2026-09-08-jikkou-yosan-v2-summary-cost-row-close.md`




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-09-12.md -->
