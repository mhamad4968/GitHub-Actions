# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-29 20:15 JST — **セッション締め**。AI緊急用 最新同期。756 LIVE rev**167**。

**次の1手**: 756 明細展開を依頼者に見せて認識確認（違えば tag ロールバック）。新アプリは指示後。完了済を GO 待ちに出さない。

**Git**: `origin/main` 同期済（push 済・ahead 0 見込み）

**本日状態（要約）**: 確認資料クローズ（HOLD／一旦このまま）→要望実装。総括税列削除・工事原価管理属性列削減・**明細展開 Y12** LIVE。運用改善 A1–F3 規則化。ロールバック tag `backup/756-before-actual-detail-expand-2026-07-29`。

**継続メモ**:
1. **756**: 明細展開を**依頼者に見せて認識確認**（違えば tag ロールバック）。合っていれば残課題（セルクリア時 DELETE 等）検討
2. RAG aide 観察〜**8/9** 判定。東海iPad 運用観察。**新アプリ**＝指示後

**GO待ち**: 明細展開の依頼者確認結果。新アプリ＝相談・GO後のみ。

**案内規律（浜田 2026-07-28）**: **完了済の件を GO待ち／次の1手／質問に出さない**（履歴ログに残っていても現行待ちと混同禁止）。

**調査正本**: 756 SPEC Y12／P-41／`detail_row_key`。運用 `docs/runbooks/cio-ops-2026-07-29-hard-request-clarity.md`。GO `docs/approved-changes/2026-07-29-ops-improvements-hamada-go.md`。

**観測期間**: **H9/△2**: metricsEligibleAfter=**2026-07-18** · reviewDate=**2026-07-25** · early GREEN/降格 **禁止**

**運用メモ**: 品質ゲート · Lifecycle v2 · closures=9。難要望は親／子／入力単位／合計を4行合意（A1）。

**688**: heat-closed以外触らない · **674**: 購入先OK · **736**: 触らない · **756/757/758**: LIVE rev167・Y12明細展開／税列・属性列削減済 · **712**: deploy禁止

## クローズ済み（`data/cio-project-closures.json` — 9件）
業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

## 保留・その他の制約
| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | 8/3 問い合わせまで実PC配信禁止 |
| **736** | 現行版保持・Ver.02 後も触らない |
| **756/757/758** | LIVE rev167（actual-detail-expand-fix）・Y12／確認資料HOLD残・明日依頼者確認 |
| **712** | 削除済 — deploy 禁止 |

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-07-29

### 2026-07-29 夜（セッション締め）
- Desktop AI緊急用: 古いファイル削除相当の最新入替（`session-starter:sync-desktop` + verify）
- 確認資料クローズ → 要望実装（税列・属性列・明細展開）・ops 規則化・SPEC Y12 追記・push 済

### 2026-07-29 夜（756 明細展開 Y12）
- BUILD `actual-detail-expand` → fix `actual-detail-expand-fix` LIVE **rev167**
- App758 `detail_row_key` 追加。親＝内訳№合計／子＝明細入力
- ロールバック: `backup/756-before-actual-detail-expand-2026-07-29`

### 2026-07-29 夕（確認資料・要望）
- #REF!／工事原価管理方針／丸め・給与一旦このまま／コード整理HOLD
- 総括消費税率・金額税込削除／工事原価管理 消費税・単位・数量・金額・備考削除

### 2026-07-29 夜（運用改善）
- A1–F3 浜田全承認 → `cio-ops-hard-request-clarity.mdc` 等。憲法本文は未変更
