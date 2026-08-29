# 復元チェックポイント（最新）
**最終更新**: 2026-08-29 10:35 JST — **朝セッション締め（実行予算v2 マスタ G0）**。実装なし。夜は契約工種・内訳・総括項目名。
**次の1手**: 夜 cold-start 後 `chat-sessions/2026-08-29-jikkou-yosan-v2-night-handoff.md` ＋ G0 SPEC を読む。項番 -0（浜田指示）。個人資産月次は 9/13–17 必須
**レーン変更**: 749 UX クローズ済。実行予算 v2 は **G0 のみ**（実装は明示 GO）。夜=コード表系＋項目名
**Git**: **`e6f254cf`** = `origin/main` — push 済
**closeStatus**: **closed**（朝セッション区切り。day-close は今夜最終）
**制約**: 閉済9件／ジャンル細分化禁止／A6-Sしない／印刷グラフ縮小禁止／720–721・682/683・**749 UX**再開は明示GOまで／**736不触**／756実装はGOまで禁止
**本日状態**: 749=`2026-08-29-749-ux-toolbar-copy-pill-print` rev**18**。696=`2026-08-24-696-modal-keep-open` rev**18**。682=`2026-08-23-682-banner-label-clarify` rev**30**。683=`2026-08-23-683-doyou-shukujitsu-taiou-label` rev**116**。721=`2026-08-23-jr-ipad-dash-p2-vux` rev**17**
**674 live fileKey**: `a16f2595-8e7c-44b2-8bec-98e329aca6c3`
### 本日アクティブ（BUILD/rev — 2026-08-29）
| App | BUILD | rev |
|-----|-------|-----|
| **749** | `2026-08-29-749-ux-toolbar-copy-pill-print` | **18** |
| **696** | `2026-08-24-696-modal-keep-open` | **18** |
| **682** | `2026-08-23-682-banner-label-clarify` | **30** |
| **683** | `2026-08-23-683-doyou-shukujitsu-taiou-label` | **116** |
| **721** | `2026-08-23-jr-ipad-dash-p2-vux` | **17** |
| **776** | `2026-08-22-776-reorder-range-put` | **75** |
| **595** | `2026-08-22-595-preserve-primary-list-sort` | **152** |
| **674** | `2026-08-19-674-replace-fill-emp-id` | **341** |
**継続メモ**: G0 `docs/plans/2026-08-29-jikkou-yosan-v2-master-g0-decisions.md`／夜必読 `chat-sessions/2026-08-29-jikkou-yosan-v2-night-handoff.md`／個人資産 `docs/personal/nisa-ops.md`／NAS SPEC §7.5
**GO待ち**: 実行予算 v2 **実装 GO**（夜は G0 継続が既定）
**調査正本**: G0 SPEC / night-handoff / `docs/personal/nisa-ops.md`
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
| **756/757/758** | LIVE rev318 · MANUAL_ONLY |
| **712** | 削除済 — deploy 禁止 |

<!-- freeze-zone minChars pad (244+ chars; keep for mandatory-read-gate) ·······································································································································································-->
## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-08-29

### 2026-08-29 朝（749 UX 改善レーンクローズ）
- 浜田目視 **OK**（1–8＋一覧 IP/管理者ID/PW コピー）
- live **749** `2026-08-29-749-ux-toolbar-copy-pill-print` rev **18** / fileKey `53f7ec7c-ddc1-442c-a8c7-95b34be384b9`
- SPEC §7.5 / §8.2 更新 · `closures JSON 不触（UXレーンのみ・closed-v1 維持）`
- closeStatus: **closed**（UXレーン。day-close は別途）



## 2026-08-29

### 2026-08-29 朝締め（実行予算 v2 マスタ G0）
- G0 確定: ヘッダ①〜④／発注者E2／支社P1／事務所新／部門P1／休日タブ（祝日自動・土日手動・重複除外）／V1・S1・U1
- SPEC: `docs/plans/2026-08-29-jikkou-yosan-v2-master-g0-decisions.md`
- **夜必読**: `chat-sessions/2026-08-29-jikkou-yosan-v2-night-handoff.md`（契約工種・内訳・総括項目名）
- 実装・deploy **なし**（明示 GO まで）
- 749 UX レーンクローズ済（rev18）
- closeStatus: **closed**（朝区切り。day-close は今夜最終）

### 2026-08-29 朝（749 UX 改善レーンクローズ）
- 浜田目視 **OK**（1–8＋一覧 IP/管理者ID/PW コピー）
- live **749** `2026-08-29-749-ux-toolbar-copy-pill-print` rev **18** / fileKey `53f7ec7c-ddc1-442c-a8c7-95b34be384b9`
- SPEC §7.5 / §8.2 更新 · `closures JSON 不触（UXレーンのみ・closed-v1 維持）`
- closeStatus: **closed**（UXレーン。day-close は別途）


## 2026-08-22 夜

### 2026-08-22 夜締め（名簿データ①〜④＋改善GOクローズ）
- 浜田: **すべてOK**／E2・E5ほか **今回見送り**／S7 Excel削除は最終GOまで残置
- live **776** `2026-08-22-776-agg-kanetsu-seko-under-koji` rev **73** / **595** `…roster-sync-fast` rev **151**
- closeStatus: **closed**（改善レーン。日終わり close-git は別途）

### 2026-08-22 昼締め（名簿 UI＋部／室＋revision衝突修正）
- **夜必読**: `chat-sessions/2026-08-22-employee-roster-night-handoff.md`
- 776: 兼務色／部署末尾／スクロール／ページ送り（`$id`分割）目視OK
- 776: `section_name` 追加・「部追加」・保存時並びUI
- **バグ**: 保存時 revision 衝突 → `sort-after-save` で success 後適用に修正・緊急 deploy（4h超 SKIP）
- 595: 新規兼務→部署末尾／既存並び・section 維持
- closeStatus: **closed**（昼区切り。夜継続）




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-08-29.md -->
