# 復元チェックポイント（最新）
**最終更新**: 2026-08-06 06:52 JST — **午前締め**。674 JBIS 次番=max+1 実装・SPEC同期・浜田目視 OK（個人 JBIS0351）。
**次の1手**: **~8/17 前後のSKY社回答待ち**（届いたら共有）。それまで実配信・GPO・SGメンバ追加しない。
**Git**: **`c1353ee4`** = `origin/main` — push 済（R44 parent）
**本日状態（要約）**: 674 個人/共有 JBIS **空き若番廃止→max+1**（BUILD `2026-08-06-674-jbis-max-plus-one` rev **266**・SPEC §4.3.1）。浜田確認 OK。SKYSEA は回答待ち継続。
### 本日アクティブ（BUILD/rev — 2026-08-06）
| App | BUILD | rev |
|-----|-------|-----|
| **674** | `2026-08-06-674-jbis-max-plus-one` | **266** |
| **719** | `2026-08-03-wifi-ssid-dash-employee-only-print` | **14** |
| **721** | `2026-08-03-jr-ipad-dash-print-filter-surf` | **15** |
| **683** | `2026-08-02-683-print-page2-break-v24` | **112**（維持） |
| **756** | `2026-08-02-ver02-actual-visual-readability` | **318**（維持） |
**継続メモ**:
1. **SKYSEA**: ~8/17 回答待ち。実PC配信は回答＋浜田 GO 後のみ。
2. **674**: 採番 max+1 完了（目視 OK）。新規 customize 依頼があるまで触らない。
3. **719/721**: closed-v1 微小 UI／印刷は明示依頼で再開可（O-CLOSED-01）。

**GO待ち**: なし（完了済を出さない）。新アプリ＝相談・GO後のみ。

**案内規律（浜田 2026-07-28）**: **完了済の件を GO待ち／次の1手／質問に出さない**。

**調査正本**: `docs/plans/2026-07-31-756-cost-mgmt-excel-table-structure-spec.md`（#R-EXCEL-UI-09〜14 / PLACE-01 / S-DEDUP-01）

**観測期間**: **H9/△2**: metricsEligibleAfter=**2026-07-18** · reviewDate=**2026-07-25** · early GREEN/降格 **禁止**

**運用メモ**: 品質ゲート · Lifecycle v2 · closures=9 · 表示面マトリクス（2026-08-03）。

**688**: heat-closed以外触らない · **674**: 購入先OK・採番max+1済 · **736**: 触らない · **756/757/758**: LIVE rev318 · **712**: deploy禁止

## クローズ済み（`data/cio-project-closures.json` — 9件）
業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

## 保留・その他の制約
| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | **active（2026-08-05）** — 問い合わせ済・回答待ち〜8/17。**実PC配信は回答＋GO後** |
| **736** | 現行版保持・Ver.02 後も触らない |
| **756/757/758** | LIVE rev318。OMIT残なし。MANUAL_ONLY維持 |
| **712** | 削除済 — deploy 禁止 |

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-08-06

### 2026-08-06 朝（午前締め）
- 674: JBIS/S-JBIS 次番=max+1（空き無視・9999除外・個人下限67）deploy rev266
- SPEC §4.3.1 / runbook / kintone-apps 同期・push（`9b0ee359`）
- 浜田目視: 個人 PC名 **JBIS0351** OK
- close-git / clock:clear（本締め）


## 2026-08-03

### 2026-08-03 夜（本日最終締め）
- 719: 社外禁止注記＝拠点印刷のみ（rev14）
- 721: 一覧印刷マルチ部署＋ヘッダー画面／モーダル（rev15）
- 夕反省全GO反映（A1–A3・S/O/M/C）・Desktop 最新入替・close-git／clock:clear


## 2026-08-02

### 2026-08-02 夜（本日最終締め）
- 683 印刷 v24＋ナレッジWAKE／夕反省全GO／Desktop sync
- close-git / clock:clear（本締め）

