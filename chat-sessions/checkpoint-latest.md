# 復元チェックポイント（最新）
**最終更新**: 2026-08-08 09:45 JST — 薄い統合（Desktop 37）+ 今日の総確認・是正。
**次の1手**: 夜セッションで完了通知配線を実施する。
**Git**: （薄い統合 commit 後に同期）
**closeStatus**: open
**8月提案レーン（空月）**:
| # | 内容 | 状態 |
|---|------|------|
| ① | 依頼効率化 v0.2（Step0〜V2-3） | **済** |
| ② | MCP月次パック + DEL-3 | **済** |
| V2-N | 完了通知 | **今夜** |
| ③ | 憲法形骸化点検（G0）+ **薄い統合** | **済** · Desktop `37` · 大統合は見送り |
| ④ | B-MDFLOW 薄い版（G0） | **済** · フル実装は見送り |
| — | 経営会議資料 | **8/13まで触らない** |
**制約（workではない · score では constraint）**:
- SKYSEA配信・GPO・SG **しない**（xlsx完了登録依頼時のみ）
- 閉済9件 / 688 heat外 / 677–679 / 712 deploy / 736 **触らない**
- 新アプリ＝相談・GO後のみ
**本日状態（要約）**:
- 2026-08-08: request-compose v0.2 · MCP月次 · DEL-3 · **薄い統合 Desktop37** · score constraint 反映
- Index OPEN default: 利用中 + $id desc
- Shared JBIS warn+note on save
- SKYSEA xlsx mark 完了 147（date 2026-08-07 / handler 濱田）
- SKYSEA UI: personal-only; exact pc_name hard-block; assist skip when field not editable
- SKYSEA対応一覧: dept summary + tbody + exclude 4 depts
- 夕反省GO実装済（2026-08-07）
- GitHub EOD: constitution-gates + kintone-customize-deploy 直近成功
### 本日アクティブ（BUILD/rev — 2026-08-07）
| App | BUILD | rev |
|-----|-------|-----|
| **674** | `2026-08-07-674-skysea-exclude-4-depts` | **292** |
| **719** | `2026-08-03-wifi-ssid-dash-employee-only-print` | **14** |
| **721** | `2026-08-03-jr-ipad-dash-print-filter-surf` | **15** |
| **683** | `2026-08-02-683-print-page2-break-v24` | **112**（維持） |
| **756** | `2026-08-02-ver02-actual-visual-readability` | **318**（維持） |
**674 live fileKey**: `15480b94-cee0-44ba-b0e0-f9c0b2acab78`
**継続メモ**:
1. **SKYSEA**: 手動台帳 **active**。配信レーン **なし**（schedule 2026-08-07 改訂）。AI定常＝**xlsx等の完了登録依頼時のみ**。GPO・SG追加禁止。
2. **674**: rev292 exclude-4-depts。対応一覧 dept summary + tbody fix + 4 dept exclude 済。
3. **夕反省GO（2026-08-07）**: S-UI-WHERE / S-DOM-SCOPE / 用語辞書 / `cio:deploy-ready:674` / `cio:eod:github` 反映済。
3. **719/721**: closed-v1 微小 UI／印刷は明示依頼で再開可（O-CLOSED-01）。
**GO待ち**: 新アプリ＝相談・GO後のみ。
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
| **SKYSEA** | **active（2026-08-07）** — 手動台帳運用可・remote deploy 凍結。**実PC配信・GPO・SG追加はしない** |
| **736** | 現行版保持・Ver.02 後も触らない |
| **756/757/758** | LIVE rev318。OMIT残なし。MANUAL_ONLY維持 |
| **712** | 削除済 — deploy 禁止 |
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md`
**クローズ正本**: `data/cio-project-closures.json` / **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`
## セッション切替後の自律復元（Lifecycle v2 鏡像）
**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-08-07

### 2026-08-07 夜（本日最終締め）
- Index OPEN default: 利用中 + $id desc
- Shared JBIS warn+note on save
- SKYSEA xlsx mark 完了 147（2026-08-07 / 濱田）
- SKYSEA UI: personal-only; exact pc_name hard-block; assist skip when field not editable
- SKYSEA対応一覧: dept summary table + tbody fix + exclude 4 depts
- 674 deploy rev292 BUILD=`2026-08-07-674-skysea-exclude-4-depts` fileKey `15480b94-cee0-44ba-b0e0-f9c0b2acab78`
- GitHub EOD: constitution-gates + kintone-customize-deploy 直近30 runs 全成功




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




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-08-07.md -->

