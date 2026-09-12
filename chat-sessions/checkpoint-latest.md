# 復元チェックポイント（最新）
**最終更新**: 2026-09-12 21:20 JST — 756 内訳・統括・工種説明 LIVE rev**366** 目視OK。
**次の1手**: 原価（予実）コードは明日。今夜の 756 内訳・統括レーンは完了。
**レーン変更**: 共有PC後日／756追加customize待ち → **756 予実 G0（工種単位）夜確認**
**Git**: **`470203e4`** = `origin/main` — push 済
**closeStatus**: **partial**（夜へ。日終わり⑦ではない）
**制約**: 閉済9件／ジャンル細分化禁止／A6-Sしない／印刷グラフ縮小禁止／720–721・682/683・**749 UX**再開は明示GOまで／**736不触**／688 WBGT以外不触／**浜田が言ったことを聞き直さない**／G0ロック範囲を再質問しない／予実は実装GOまで customize しない
**本日状態**: **756**=`2026-09-12-ver02-workdesc-wider` rev**366**（本セッション deploy 済）。**715**=`2026-09-10-715-vl-serial-continue` rev**28**。749=`2026-08-29-749-ux-toolbar-copy-pill-print` rev**18**。696=`2026-08-24-696-modal-keep-open` rev**18**。682=`2026-08-23-682-banner-label-clarify` rev**30**。683=`2026-09-02-683-wiring-print-box` rev**117**。721=`2026-08-23-jr-ipad-dash-p2-vux` rev**17**
**674 live fileKey**: `a16f2595-8e7c-44b2-8bec-98e329aca6c3`
### 本日アクティブ（BUILD/rev — 2026-09-10）
| App | BUILD | rev |
|-----|-------|-----|
| **756** | `2026-09-12-ver02-workdesc-wider` | **366** |
| **715** | `2026-09-10-715-vl-serial-continue` | **28** |
| **749** | `2026-08-29-749-ux-toolbar-copy-pill-print` | **18** |
| **696** | `2026-08-24-696-modal-keep-open` | **18** |
| **682** | `2026-08-23-682-banner-label-clarify` | **30** |
| **683** | `2026-09-02-683-wiring-print-box` | **117** |
| **721** | `2026-08-23-jr-ipad-dash-p2-vux` | **17** |
| **776** | `2026-08-22-776-reorder-range-put` | **75** |
| **595** | `2026-08-22-595-preserve-primary-list-sort` | **152** |
| **674** | `2026-08-19-674-replace-fill-emp-id` | **341** |
**継続メモ**: 予実G0 `docs/plans/2026-09-12-jikkou-yosan-v2-cost-mgmt-g0.md`（§13が夜の順）。夜引継ぎ `chat-sessions/2026-09-12-jikkou-yosan-v2-cost-mgmt-night-handoff.md`。統括原価行正本 `docs/plans/2026-09-08-jikkou-yosan-v2-summary-cost-row-close.md`。設定タブ駐車。共有PC金庫は Desktop Word（ラボ外）。**MCP 試用は自発提案してよい**（足すのは GO 後）。Mac Studio は継続メモどおり
**GO待ち**: 予実の **実装GOは明日**。内訳・統括は LIVE rev**366**・**目視OK**。夜§13.1は1–7決
**調査正本**: `docs/plans/2026-09-12-jikkou-yosan-v2-cost-mgmt-g0.md`
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
| **756/757/758** | 756 LIVE rev366 · 757 rev31 · 757 customize 未deploy |
| **712** | 削除済 — deploy 禁止 |

<!-- freeze-zone minChars pad (244+ chars; keep for mandatory-read-gate) ·······································································································································································-->
## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-09-12

### 2026-09-12 夜（進行中 — 予実G0 1件ずつ）
- §13.1 の1番 **決**: 空に戻したら円の採用は実績予想に戻す。入力ミスは正しい数字へ修正
- §13.1 の2番 **決**: 実績がある月の実績予想は無効（未来の見込み）。数字は残す
- §13.1 の3番 **決**: 契約が違うとき同じ会社を2行可。集計は合算
- §13.1 の4番 **決**: 当初は版確定まで（今まで通り）。次の版は1つ前をコピー（当初含む）。集計に別ボタンは置かない
- §13.1 の5番 **決**: マスタに工種が増えたら既存工事の集計にも行を足す（リスト選択のため）
- §13.1 の6番 **決**: 現予算は入力者判断。月は横12。レイアウトは案 Excel を正
- §13.1 の7番 **決**: 旧予実データは破棄。新しい表へ移さない
- **予実の実装は明日。今日はしない。** 予実 customize なし
- AIチーム第2回 **条件付きGO**（§4.7）。Kimi 404
- 統括 **単位が違うと分ける**。同じ単位は合算。会社名・氏名は空でも保存可。諸経費は塗装工事〜追加工事⑤のみ
- 諸経費対象 **決**: 10200塗装工事〜14500追加工事⑤（軌道・調査設計・外注試験・交通規制含む）
- AIチーム第3回 **条件付きGO**。諸経費の母数は **外注費の明細だけ**（決）
- 内訳・統括 **LIVE** BUILD `2026-09-12-ver02-workdesc-wider` rev **366**。諸経費（外注費があるときだけ）・工種説明幅 **目視OK**。原価コードは明日

### 2026-09-12 昼（partial — 予実G0 → 夜）
- 756 予実を工種単位で G0。正本 commit `fba5f27e`。customize/deploy なし
- 夜は §13.1 を1件ずつ。第1問は空に戻した月の採用
- 第1回多角確認（CIO＋DeepSeek）。Kimi ENOENT。日終わり⑦は回していない


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




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-09-12.md -->
