# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-28 18:45 JST — 756 U37（定義及び品名見切れ緩和）LIVE rev**155**。依頼者レビューは**明日(7/29)**。

**Git**: **`441012e8`** = `origin/main` — push 済

**本日状態（要約）**: **東海支店iPad** DB**769**/Dash**770** M1–M7 完了・浜田目視OK。SPEC 確定版。App **756** LIVE rev**155** BUILD `name3-wide-title`（U37見切れ緩和）。確認パック送付 **完了扱い**。依頼者レビュー＝**7/29**。RAG aide / LOTO7。720/721 非触。

**継続メモ**:
1. 東海iPad — 運用観察（中継 bat・tokai 保存時同期）
2. **756**: 依頼者レビュー **7/29**。メール確認の未回答＝回収後 → **7/29夜に報告見込み**（回収前に聞かない）
3. RAG aide / LOTO7 観察。**新アプリ**＝指示後

**GO待ち**: 新アプリ＝相談・GO後のみ。**確認パック送付は載せない（完了）**。756依頼者回答の取り込み＝**7/29夜以降（回収後）**。

**次の1手**: 浜田指示待ち（新アプリ作成の相談可）。

**案内規律（浜田 2026-07-28）**: **完了済の件を GO待ち／次の1手／質問に出さない**（履歴ログに残っていても現行待ちと混同禁止。浜田の勘違い防止）。

**調査正本**: 東海iPad SPEC確定版・769/770。756 SPEC U35–U38 rev156。確認パック `…confirm-pack-pre-0727.md`＝送付不要確定。RAG aide runbook。LOTO7 B+C。

**観測期間**: **H9/△2**: metricsEligibleAfter=**2026-07-18** · reviewDate=**2026-07-25** · early GREEN/降格 **禁止**

**運用メモ**: 経営会議7月度完了。品質ゲート `push-deploy-quality-gates-v2.md` · Lifecycle v2 · closures=9。

**688**: heat-closed以外触らない · **674**: 購入先OK · **736**: 触らない · **756/757/758**: LIVE rev156・U37/U38済／R-11済／残R-12/13（依頼者確認中） · **712**: deploy禁止

## クローズ済み（`data/cio-project-closures.json` — 9件）
業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

## 保留・その他の制約
| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | 8/3 問い合わせまで実PC配信禁止 |
| **736** | 現行版保持・Ver.02 後も触らない |
| **756/757/758** | LIVE rev156（pane-tint／U37+U38）・R-11済／残R-12/13（確認中）・Excel |
| **712** | 削除済 — deploy 禁止 |
## セッション切替後の自律復元（Lifecycle v2 鏡像）
**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
**禁止（本中断）**: stash pop／force push／旧756 customize再deployで今日の UI を潰す＝**先祖返り禁止**。env `JIKKOU_YOSAN_V2_BUILD` は build 前に消す。deploy後は同一セッションで R63 commit。735/736書込禁止。
**凍結ゾーンpad**: rev156・U37/U38・LOTO7 B+C・RAG aide — minChars≥2800・行数≤50。確認パック＝送付不要確定。完了済をGO待ちに載せない。
<!-- archive: chat-sessions/checkpoints/checkpoint-archive-2026-07-22.md -->

## 2026-07-28

### 2026-07-28 夕（756依頼者レビュー日程）
- 浜田: [756](https://jbis-kintone.cybozu.com/k/756/) 依頼者レビューは**明日(7/29)**
- メール確認事項の未回答は回答回収後、**明日の夜に報告できる見込み**
- 回収前・レビュー前に未回答を催促しない。結果取り込みは 7/29 夜以降

### 2026-07-28 夕（確認パック待ち取消＋案内規律）
- 浜田「もういい」— 7/27確認パック送付待ちを取消（7/26実装確認OKで充足）
- 浜田「終わってることは聞かない」— **完了済を GO待ち／質問に出さない**を checkpoint 正本化
- HANDOFF-HUMAN / handoff-log / パック正本を同期して commit/push

### 2026-07-28 夕（東海iPad・セッションCLOSE）
- **東海支店iPad台帳**: DB **769** / Dash **770**（Space32/thread34）。M1–M7・浜田目視OK
- SPEC **確定版** `docs/plans/2026-07-28-tokai-ipad-ledger-kintone-spec.md`（`df9b6485` push 済）
- 中継: `docs/runbooks/tokai-ipad-sync-relay.md` / Desktop bat。720/721 非触
- セッション締め: close-git（本エントリ）

### 2026-07-28 WAKE（ブリーフィング）
- Desktop AI緊急用 **00〜36** 通読・理解報告済。憲法先読みパック E1 mandatory_reads 済
- health-check **100%** / MCP registry 26 / probe **6/6** / GHA 直近 success・open PR/Issue なし
- freeze preamble **51→≤50** 是正＋rollup 空行圧縮の恒久対応
- DeepSeek §50-3-8（ブリーフィング監査）実施済。新アプリは指示後

## 2026-07-26

### 2026-07-26 夕（本セッション CLOSE）
- **756**: U35（着手日＞竣工日・ヘッダ警告／版確定不可）rev**153** → U36（取引先リストのみ）rev**154** LIVE。SPEC草案 U3/U4/U35/U36 同期済（先行 commit）
- **夕反省GO**: R63 dirty block / medal mismatch exit1 / #CON-01/02 等実装・push済（`e6e6eef4` 系）
- **RAG aide 試行**: AIチーム 1–2週・正本 `docs/runbooks/rag-constitution-aide-trial.md`・判定は CIO 委任。`mcp.json` rag を Windows 正本 `/mnt/c/.../kintone-ai-lab` に再ターゲット（**MCP再起動要**）
- 確認パック DOCX レビュー（施工部向け・1件ずつ）継続メモのみ

### 2026-07-25 夜（前セッション）
- **756**: C16列幅 / U27・U33空白視覚 / U26-2 datalist / U34スクロール維持 → LIVE rev**125** `preserve-scroll`（浜田確認OK）
- **LOTO7**: B+C（walk-forward・アンサンブル再設計・対極戦略）。KPI=平均一致/P(k≥4)。`external/loto7/`をGit正本化
- **反省改善 P1–P7**: BUILD/UI deploy前検査、締めメタ1commit、Lifecycle生成、UI受入3行、LOTO7 Git化、報告全文軽量化を実装
- 次: 明日756微調整 / ~~7/27確認パック送付~~ → **送付不要確定（7/28）**

### 2026-07-25 夕（セッション終了準備）
- BUILD=`2026-07-25-ver02-project-days-nichi` rev**120** — C13手入力氏名／C14一時保存・版確定／C15工期日数N日
- 直前BUILD: `header-save-btns` rev119 → `project-days-nichi` rev120
- 確認パック・SPEC C13–C15 同期済。次: ~~7/27送付（浜田GO）~~ → **送付不要確定（7/28）**

### 2026-07-25 午後（7/27準備）
- BUILD=`2026-07-25-ver02-blockno-nav` rev**117** — C5固定レール・U32内訳№ジャンプ・浜田OK
- 確認パック: `docs/plans/2026-07-25-jikkou-requester-confirm-pack-pre-0727.md`（~~送付は7/27以降~~ → **送付不要確定 7/28**）
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
