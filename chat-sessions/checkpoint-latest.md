# 復元チェックポイント（最新）
**最終更新**: 2026-08-30 17:15 JST — **夜セッション**。§15＋**§16**（listOnly祖父・S0〜S5）を仕様確定。コードなし。**実装合図待ち**。
**次の1手**: 浜田の実装合図 → G0 **§15＋§16** の **S0**（既存値スキャン）。個人資産月次は 9/13–17 必須
**レーン変更**: 実行予算 756 は **今夜 §15 全部**（S0〜S5 は順序のみ。スライスA／別画面は廃案）。工事原価管理はタブ非表示のみ
**Git**: **`73474c7c`** = `origin/main` — push 済
**closeStatus**: **open**（夜セッション進行中。day-close は今夜最終）
**制約**: 閉済9件／ジャンル細分化禁止／A6-Sしない／印刷グラフ縮小禁止／720–721・682/683・**749 UX**再開は明示GOまで／**736不触**／688 WBGT以外不触／**浜田が言ったことを聞き直さない**
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
**継続メモ**: G0 §15+§16 `docs/plans/2026-08-29-jikkou-yosan-v2-master-g0-decisions.md`／夜必読 `chat-sessions/2026-08-30-jikkou-yosan-v2-night-impl-handoff.md`／個人資産 `docs/personal/nisa-ops.md`
**GO待ち**: **実装の合図**（浜田）。合図後 S0。スライスAのGOは求めない
**調査正本**: G0 §15+§16 / 2026-08-30 night-impl-handoff
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
## 2026-08-30

### 2026-08-30 夜（§16 実装ゲート・合図待ち）
- AI チーム点検: DeepSeek 条件付きGO→穴埋め後 yes相当。Kimi GO
- G0 **§16** 追加（listOnly 祖父・S0〜S5・スモーク後 deploy）。コード・deploy **なし**
- 次: 浜田の **実装の合図** → S0

### 2026-08-30 朝締め（実行予算 756 G0 → 今夜実装）
- 仕様のみ。コード・deploy **なし**。live 756 rev **318** 不変
- 正: G0 **§15** ＋ `chat-sessions/2026-08-30-jikkou-yosan-v2-night-impl-handoff.md`
- 今夜: §1〜11 全部＋工事原価管理タブ非表示。756継続。スライスA／別画面は廃案
- 朝の4hで今夜を測らない。浜田が言ったことは聞き直さない
- closeStatus: **closed**（朝区切り。day-close は今夜最終）


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



<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-08-30.md -->
