# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-25 21:00 JST — 夜枠 CLOSE。反省改善P1–P7実装済。明日=756微調整。

**Git**: **`a04cfc47`** = `origin/main` — push 済

**本日状態（要約）**: App **756** LIVE=`2026-07-25-ver02-preserve-scroll` rev**125**（浜田確認済）。反省改善P1–P7実装済。LOTO7 B+C は `external/loto7/` がGit正本、Desktopは実行ミラー。735/736書込禁止。

**継続メモ（次セッション -0）**:
1. **明日（優先）**: [App756](https://jbis-kintone.cybozu.com/k/756/) 再確認して微調整
2. **7/27（lab）**: 確認パック送付（浜田「送ってよい」後）。正本 `docs/plans/2026-07-25-jikkou-requester-confirm-pack-pre-0727.md`
3. LOTO7: 運用観察（`external/loto7/backtest_report.py`／抽選後 fetch）。追加改修は依頼時

**GO待ち**: 確認パック送付＝浜田一言。リストJSON追記＝依頼者回答 or 浜田GO。

**次の1手**: 明日=756 再確認・微調整。lab次=7/27確認パック送付。

**調査正本**: SPEC C16/U26-2/U33/U34・BUILD preserve-scroll rev125。LOTO7: `docs/plans/2026-07-25-loto7-bc-improvement-spec.md` + `external/loto7/`。

**観測期間**: **H9/△2**: metricsEligibleAfter=**2026-07-18** · reviewDate=**2026-07-25** · early GREEN/降格 **禁止**

**運用メモ**: 経営会議資料7月度は完了。品質ゲート `docs/runbooks/push-deploy-quality-gates-v2.md` · Lifecycle v2 · `data/cio-project-closures.json`。

**688**: heat-closed 以外触らない · **674**: 購入先OK · **736**: 触らない · **756/757/758**: UI本日OK・残R-11/12/13・Excel · **712**: deploy禁止

## クローズ済み（`data/cio-project-closures.json` — 9件）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | 8/3 問い合わせまで実PC配信禁止 |
| **736** | 現行版保持・Ver.02 後も触らない |
| **756/757/758** | LIVE rev125（preserve-scroll）・明日微調整・残R-11/12/13・Excel |
| **712** | 削除済 — deploy 禁止 |
## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
**禁止（本中断）**: stash pop／force push／旧756 customize再deployで今日の UI を潰す＝**先祖返り禁止**。env `JIKKOU_YOSAN_V2_BUILD` は build 前に消す。deploy後は同一セッションで R63 commit。735/736書込禁止。
**凍結ゾーンpad**: 7/27準備・rev125・LOTO7 B+C — minChars≥2800 維持。

<!-- archive: chat-sessions/checkpoints/checkpoint-archive-2026-07-22.md -->

## 2026-07-25

### 2026-07-25 夜（本セッション）
- **756**: C16列幅 / U27・U33空白視覚 / U26-2 datalist / U34スクロール維持 → LIVE rev**125** `preserve-scroll`（浜田確認OK）
- **LOTO7**: B+C（walk-forward・アンサンブル再設計・対極戦略）。KPI=平均一致/P(k≥4)。`external/loto7/`をGit正本化
- **反省改善 P1–P7**: BUILD/UI deploy前検査、締めメタ1commit、Lifecycle生成、UI受入3行、LOTO7 Git化、報告全文軽量化を実装
- 次: 明日756微調整 / 7/27確認パック送付

### 2026-07-25 夕（セッション終了準備）
- BUILD=`2026-07-25-ver02-project-days-nichi` rev**120** — C13手入力氏名／C14一時保存・版確定／C15工期日数N日
- 直前BUILD: `header-save-btns` rev119 → `project-days-nichi` rev120
- 確認パック・SPEC C13–C15 同期済。次: 7/27送付（浜田GO）

### 2026-07-25 午後（7/27準備）
- BUILD=`2026-07-25-ver02-blockno-nav` rev**117** — C5固定レール・U32内訳№ジャンプ・浜田OK
- 確認パック: `docs/plans/2026-07-25-jikkou-requester-confirm-pack-pre-0727.md`（送付は7/27以降）
- SPEC: C5/U32 更新済。working tree は本更新コミットで同期


### 756 LIVE（目視OK詳細）
- BUILD=`2026-07-25-ver02-actual-right-10px` rev**103** fileKey=`61178d0c-7268-4147-a3da-885cbeed3ee0`
- 文字サイズC11 / 表題余白 / 右端罫線 / スクロール / 予実ヘッダ縦sticky禁止 / 右息抜き10px（6→左+4。2pxは逆で不採用）
- SPEC: `docs/plans/2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md` §6.2・§20.4 再送注記
- customize: `customize/jikkou-yosan-v2-app1/desktop.ui.js` → `desktop.js`

### 依頼者メール
- 再送済（浜田）。下書き: `docs/plans/2026-07-25-jikkou-yosan-ver02-requester-meeting-email-draft.md`
- 7/27口頭＋メール回答。名称規格1/2＋工種別切替一覧を明記済

### 674 / 環境
- 購入先JSON: `scripts/data/pc-ledger-674-add-purchase-fields.json`
- DeepSeek: `scripts/mcp-deepseek-v4/` · `verify:deepseek-mcp-v4`
- handoff末尾: `### 2026-07-25 08:25 JST — セッション中断（夕方再開）`
