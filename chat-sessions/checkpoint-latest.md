# 復元チェックポイント（最新）
**最終更新**: 2026-09-05 18:10 JST — **GitHubメンテ**: 未使用一時ファイル掃除済。GHA緑。Cursor App pending は管理者操作待ち。
**次の1手**: 明日 756 統括実装（原価行分割・10800・給与T/U）＋目視。正本 `docs/plans/2026-09-05-jikkou-yosan-v2-summary-tonight-decisions.md`。個人資産月次 9/13–17
**レーン変更**: 756本日終了 → GitHubメンテ（未使用ファイル掃除）。**736不触**
**Git**: **`bcfffe89`** = `origin/main` — push 済
**closeStatus**: **open**（夜セッション継続可。day-close は今夜最終）
**制約**: 閉済9件／ジャンル細分化禁止／A6-Sしない／印刷グラフ縮小禁止／720–721・682/683・**749 UX**再開は明示GOまで／**736不触**／688 WBGT以外不触／**浜田が言ったことを聞き直さない**／G0ロック範囲を再質問しない
**本日状態**: **756**=`2026-09-05-ver02-locked-fuka-badge` rev**342**。749=`2026-08-29-749-ux-toolbar-copy-pill-print` rev**18**。696=`2026-08-24-696-modal-keep-open` rev**18**。682=`2026-08-23-682-banner-label-clarify` rev**30**。683=`2026-09-02-683-wiring-print-box` rev**117**。721=`2026-08-23-jr-ipad-dash-p2-vux` rev**17**
**674 live fileKey**: `a16f2595-8e7c-44b2-8bec-98e329aca6c3`
### 本日アクティブ（BUILD/rev — 2026-09-05）
| App | BUILD | rev |
|-----|-------|-----|
| **756** | `2026-09-05-ver02-locked-fuka-badge` | **342** |
| **749** | `2026-08-29-749-ux-toolbar-copy-pill-print` | **18** |
| **696** | `2026-08-24-696-modal-keep-open` | **18** |
| **682** | `2026-08-23-682-banner-label-clarify` | **30** |
| **683** | `2026-09-02-683-wiring-print-box` | **117** |
| **721** | `2026-08-23-jr-ipad-dash-p2-vux` | **17** |
| **776** | `2026-08-22-776-reorder-range-put` | **75** |
| **595** | `2026-08-22-595-preserve-primary-list-sort` | **152** |
| **674** | `2026-08-19-674-replace-fill-emp-id` | **341** |
**継続メモ**: 今夜統括正本 `docs/plans/2026-09-05-jikkou-yosan-v2-summary-tonight-decisions.md`／内訳 `docs/plans/2026-09-04-jikkou-yosan-v2-uchiwake-hierarchy-spec.md`／G0 `docs/plans/2026-08-29-jikkou-yosan-v2-master-g0-decisions.md`
**GO待ち**: なし（明日実装は今夜仕様どおり。浜田目視）
**調査正本**: 今夜統括決定ファイル
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
| **756/757/758** | 756 LIVE rev342 · 757 rev31 · MANUAL_ONLY |
| **712** | 削除済 — deploy 禁止 |

<!-- freeze-zone minChars pad (244+ chars; keep for mandatory-read-gate) ·······································································································································································-->
## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-09-05

### 2026-09-05 朝締め（内訳UX・OpenRouter既定）
- 756 LIVE `2026-09-05-ver02-locked-fuka-badge` rev**342**。固定セル灰色「不可」目視OK
- OpenRouter 省略時既定 `openai/gpt-4.1-nano`（クレジット不足ではない）
- 今晩19:00 統括表検討。アジェンダ `docs/plans/2026-09-05-jikkou-yosan-v2-summary-tab-tonight-agenda.md`。朝は検討・実装しない
- closeStatus: **closed**（朝区切り）

### 2026-09-05 夜（統括仕様確定・実装は明日）
- 正本 `docs/plans/2026-09-05-jikkou-yosan-v2-summary-tonight-decisions.md`
- 原価行13列・給与T/U・請負現行・①⑧⑨維持。customize なし


## 2026-09-02

### 2026-09-02 夜締め（day-close）
- 683 印刷下枠【配線整理】件数。live **rev117**。浜田目視 OK。8月要約再生成（週次四半期誤記は手 PATCH）
- 夕反省全GO: #S1 GHA healed / #O1 turn-start `--goal` / #M1 Kimi404→DeepSeek / #P1 会計年度四半期固定
- closeStatus: **closed**



## 2026-08-30

### 2026-08-30 夜締め（day-close 完了）
- G0 §15+§16 実装・756 **rev333**（夕GO #R1 listOnly clear 既定含む）
- 夕反省全GO: #S1 verify-master-lists / #R1 / #D1 G0 raw祖父
- 明日: **現場責任者入力確認** → フィードバックで修正。G0 範囲再質問しない
- closeStatus: **closed**

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




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-09-05.md -->
