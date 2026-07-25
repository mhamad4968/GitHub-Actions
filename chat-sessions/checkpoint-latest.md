# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-25 14:15 JST — ④DD Step1–3 済（単位・表記ゆれ・依頼者3問パック）。756 LIVE確認済。

**Git**: **`1ece9a64`** = origin/main — Step3 docs push 済

**本日状態（要約）**: ④DD Step3: 単位はVer.02 CONFIRMED正／735は月・kgのみ余剰。表記はExcel正・735はCD裏取り。依頼者向けは **確認3点のみ**（`docs/plans/2026-07-25-jikkou-requester-confirm-pack-pre-0727.md`）。送付は7/27以降。735/736書込禁止。

**継続メモ（次セッション -0）**:
1. ~~Step1–3（R-19/R-20/単位・表記・確認パック）~~ → **済**
2. 次: 浜田が確認パック目視OKなら送付待ち（7/27）。JSON追記は回答/GO後
3. Excel案件追加は依頼者データ待ち / H9 評価記録

**GO待ち**: 依頼者送付は **7/27以降**。リストJSON追記は回答 or 浜田GO後。

**次の1手**: 浜田が確認パックをざっと見て「送ってよい／直す」だけ判断。735/736 WRITE 禁止。

**調査正本**: `docs/plans/2026-07-25-jikkou-unit-and-kindlong-diff.md` および requester-confirm-pack-pre-0727（負担減・確認3点）。

**観測期間**: **H9/△2**: metricsEligibleAfter=**2026-07-18** · reviewDate=**2026-07-25** · early GREEN/降格 **禁止**

**運用メモ**: 経営会議資料7月度は完了（次月まで新規不要）。品質ゲート `docs/runbooks/push-deploy-quality-gates-v2.md` · Lifecycle v2 · クローズ正本 `data/cio-project-closures.json`。

**688**: heat-closed 以外触らない · **674**: 購入先OK · **736**: 触らない · **756/757/758**: UIクロム本日OK・残R-11/12/13・Excel · **712**: deploy禁止

## クローズ済み（`data/cio-project-closures.json` — 9件）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | 8/3 問い合わせまで実PC配信禁止 |
| **736** | 現行版保持・Ver.02 後も触らない |
| **756/757/758** | R-11/12/13・依頼者回答・Excel投入（UIクロム本日OK） |
| **712** | 削除済 — deploy 禁止 |

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`

**禁止（本中断）**: stash pop／force push／旧756 customize再deployで今日の UI（right-10px / rev103）を潰す＝**先祖返り禁止**。env `JIKKOU_YOSAN_V2_BUILD` は build 前に消す。deploy後は同一セッションで R63 commit。

<!-- archive: chat-sessions/checkpoints/checkpoint-archive-2026-07-22.md -->

## 2026-07-25

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
