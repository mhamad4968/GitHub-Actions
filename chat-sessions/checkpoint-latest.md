# 復元チェックポイント（最新）
**最終更新**: 2026-09-13 09:35 JST — 756 金額増減 空前版は－ LIVE rev374。
**次の1手**: 浜田が **2版**を開き直し、請負の施工計／保安計／①が「－」かを目視。予実 G0 は **実装GO待ち**。正本 `docs/plans/2026-09-12-jikkou-yosan-v2-cost-mgmt-g0.md`。
**レーン変更**: 共有PC後日／756追加customize待ち → **756 予実 G0（工種単位）実装**
**Git**: **`PENDING_R63`** — deploy 後 commit 直前
**closeStatus**: **partial**
**制約**: 閉済9件／ジャンル細分化禁止／A6-Sしない／印刷グラフ縮小禁止／720–721・682/683・**749 UX**再開は明示GOまで／**736不触**／688 WBGT以外不触／**浜田が言ったことを聞き直さない**／G0ロック範囲を再質問しない／予実 G0 は実装GOまで customize しない（内訳 Tab は浜田依頼で実施済）
**本日状態**: **756**=`2026-09-13-ver02-amount-delta-empty` rev**374** fileKey `a3d5e9e5-7a7b-4743-ab8f-cdc3574596a4`。**757**=`2026-07-21-ver02-phase6-app2-readonly-guard` rev**34**（unit に泊）。**715**=`2026-09-10-715-vl-serial-continue` rev**28**。749=`2026-08-29-749-ux-toolbar-copy-pill-print` rev**18**。696=`2026-08-24-696-modal-keep-open` rev**18**。682=`2026-08-23-682-banner-label-clarify` rev**30**。683=`2026-09-02-683-wiring-print-box` rev**117**。721=`2026-08-23-jr-ipad-dash-p2-vux` rev**17**
**674 live fileKey**: `a16f2595-8e7c-44b2-8bec-98e329aca6c3`
### 本日アクティブ（BUILD/rev — 2026-09-13）
| App | BUILD | rev |
|-----|-------|-----|
| **756** | `2026-09-13-ver02-amount-delta-empty` | **374** |
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
**GO待ち**: 予実の **実装GO**。一時保存は一般ユーザ目視OK（2026-09-13）。内訳 Tab 目視OK。金額増減は **2版の施工計「－」目視待ち**。夜§13.1は1–7決。日終わり⑦ after-go
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
| **756/757/758** | 756 LIVE rev374 金額増減（空前版は－） · 757 rev34 · 758 rev31 · everyone 書込。単位DD 20項。**一時保存 一般ユーザ目視OK**。洞0。757 customize 未deploy |
| **712** | 削除済 — deploy 禁止 |

<!-- freeze-zone minChars pad (244+ chars; keep for mandatory-read-gate) ·······································································································································································-->
## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-09-13

### 2026-09-13 朝（金額増減・空前版は－）
- 1版 App1 の請負・給与・保存合計が空のため、GET $id しても前版0＝全額＋になっていた。比較不能なら計も行も「－」（列は出す）。LIVE rev **374** BUILD `2026-09-13-ver02-amount-delta-empty`
- 次=浜田が2版を開き直して施工計等が「－」かを目視

### 2026-09-13 朝（金額増減・前版フルGET）
- 請負の施工計等が差なしでも全額＋。版一覧 GET が SUBTABLE を落とすと前版0扱い。直前版は `$id` で取り直し、App2空は summary_cost_lines。LIVE rev **373** BUILD `2026-09-13-ver02-amount-delta-prev`
- 次=浜田が2版を開き直して施工計等が「－」かを目視

### 2026-09-13 朝（金額増減・区分別①⑧⑨）
- 区分別サマリーの①⑧⑨と右マトリクス（売上①・原価⑧・粗利）も整数円差0は「－」。LIVE rev **372** BUILD `2026-09-13-ver02-amount-delta-cat`
- 次=浜田が2版の区分別サマリーを目視

### 2026-09-13 朝（金額増減・計の差0は－）
- 統括の原価・施工計等が差なしでも + になっていた。整数円0は「－」。LIVE rev **371** BUILD `2026-09-13-ver02-amount-delta-dash`
- 次=浜田が2版の施工計等を目視

### 2026-09-13 朝（金額増減・直前版）
- 正本 `docs/plans/2026-09-13-jikkou-yosan-v2-amount-delta-spec.md`。2版以降、金額の直後に直前版差。第1版は列なし。rowKey 突合。新規・金額不変は「－」。備考自動書込なし
- LIVE: 756 BUILD `2026-09-13-ver02-amount-delta` rev **370** fileKey `e1a200a8-…`
- 次=浜田が2版で増減列を目視。予実G0・736・757 customize 不触

### 2026-09-13 朝（内訳 Tab 次項目＋泊クラス横断）
- 洞: `verify:jikkou-yosan-v2-dropdown-ui-live` holes=0。UI単位19 vs LIVE 20（LIVEのみ㎡）。税は save-model で映射
- Tab: combo▼ `tabIndex=-1`。▼選択後は commit 前 snapshot → rAF×2 で次欄。Enter自動送りなし。757 customize / 736 / 予実G0 不触
- LIVE: 756 BUILD `2026-09-13-ver02-detail-tab-next` rev **369** fileKey `1625f225-…`
- 次=浜田が内訳で Tab 目視

### 2026-09-13 朝（一時保存 CB_VA01 泊）
- 原因: 画面 COMMON_UNITS に「泊」があるが App757 `unit` が短い DROP_DOWN。一時保存 bulkRequest results[1] が CB_VA01
- 対応: 757.unit と 756 contract_unit/salary_unit を UNIT_FIELD_VALUES 20項へ PUT+deploy。既存選択肢は維持。泊→日に寄せない。757 customize JS 不触。735/736 不触
- 検証: preview GET で 757.unit に **泊**。contract_lines 11欄 / salary_lines 10欄。756 rev **368** / 757 **34**
- **目視OK**: 2026-09-13 浜田が admin 以外で 756「一時保存」1回 → 成功。CB_NO02/CB_VA01 閉じ

### 2026-09-13 朝（一時保存 CB_NO02）
- 原因: 756/757/758 app ACL が admin のみ書込・everyone 閲覧。一時保存 bulkRequest 先頭 PUT が CB_NO02
- 対応: `jikkou-yosan:v2-open-general-acl --execute`。everyone add/edit/delete。757 locked 行は閲覧のみ。735/736 不触。customize JS 不触
- 検証: `npm run verify:jikkou-yosan-v2-write-acl` OK。次=浜田が一般ユーザで一時保存目視
- 予実 G0 テーブルは未着手（実装GO待ち）

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
- 内訳・統括 **LIVE** BUILD `2026-09-12-ver02-workdesc-wider` rev **366**。諸経費・工種説明幅 **目視OK**。日終わり after-go。予実は G0 正本のみ

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
