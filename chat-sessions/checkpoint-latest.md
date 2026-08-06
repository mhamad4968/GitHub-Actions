# 復元チェックポイント（最新）
**最終更新**: 2026-08-06 20:24 JST — SKYSEA 手動台帳 **浜田目視OK**（個人・保管/廃棄/取消除外）。リモート配信は凍結継続。
**次の1手**: （任意）旧 SKYSEA 4フィールド（status/checked_at/install_log/target_flag）を削除するか非表示のままにするか — 浜田判断待ち。実配信・GPO・SGメンバ追加はしない。
**Git**: **`04c521a3`** 系 push 済（exclude-storage 含む）
**本日状態（要約）**: 674 JBIS max+1 済。SKYSEA 手動台帳＝運用開始可（BUILD `2026-08-06-674-skysea-exclude-storage` / rev **279**）。目視OK。
### 本日アクティブ（BUILD/rev — 2026-08-06）
| App | BUILD | rev |
|-----|-------|-----|
| **674** | `2026-08-06-674-skysea-exclude-storage` | **279** |
| **719** | `2026-08-03-wifi-ssid-dash-employee-only-print` | **14** |
| **721** | `2026-08-03-jr-ipad-dash-print-filter-surf` | **15** |
| **683** | `2026-08-02-683-print-page2-break-v24` | **112**（維持） |
| **756** | `2026-08-02-ver02-actual-visual-readability` | **318**（維持） |
**継続メモ**:
1. **SKYSEA**: 手動インストール＋674台帳 **目視OK・運用可**。配信・GPO・SG追加禁止。旧4フィールド扱い＝任意判断待ち。
2. **674**: 採番 max+1 済。SKYSEA 一覧＝680並び・リスト表示・行切替・印刷修正済。
3. **719/721**: closed-v1 微小 UI／印刷は明示依頼で再開可（O-CLOSED-01）。
**GO待ち**: 新アプリ＝相談・GO後のみ。旧 SKYSEA 4フィールド削除＝任意。

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
| **SKYSEA** | **active（2026-08-06）** — **手動台帳 目視OK・運用可**（個人・保管/廃棄/取消除外）。旧4フィールド扱い任意。**実PC配信・GPO・SG追加はしない** |
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


