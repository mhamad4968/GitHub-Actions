# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-20 JST — **VPN v1.2 push 済・予実管理（677–679）保留登録**

## クローズ済み（`data/cio-project-closures.json` — 無断 v1 再開禁止）

| レーン | 状態 | クローズ日 | 正本 |
|--------|------|------------|------|
| **業務改善提案 ver.02**（697–713） | closed-v1 | 2026-06-13 | `docs/reports/2026-06-13-business-improvement-completion.md` |
| **社内 Wi-Fi SSID**（718/719） | closed-v1 | 2026-06-14 | `docs/reports/2026-06-14-wifi-ssid-completion.md` |
| **JR iPad 台帳**（720/721） | closed-v1 | 2026-06-15 | `docs/reports/2026-06-15-jr-ipad-ledger-completion.md` |
| **VPN アカウント**（733/734） | closed-v1 | 2026-06-17 | `docs/reports/2026-06-17-vpn-account-completion.md` |

**業務改善のみ継続可**（浜田 2026-06-20）: **業務改善提案レーン**の軽微対応・完成条件外（FAQその他・本番6段WF・RAG・Wordマニュアル）。**v1 再実装は禁止**。

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688 保留** | 工事稼働日数ダッシュ — **クローズではない**。再開は浜田相談時のみ。BUILD `2026-06-19-688-print-rounding-fix` rev **34** |
| **予実管理 保留** | 部署予実 **677/678/679** — **クローズではない**。来週 **運用等ヒアリング**後に再開。deploy・仕様変更・未コミット作業は **触らない**（浜田 2026-06-20） |
| 本番 WF 6段階 | 無断分割禁止 — test_v3 WF 継続テストのみ |
| 評価スナップショット | 未設計確認前の本番投入禁止 |

**次の1手**: **予実管理（677–679）保留** — 来週ヒアリング待ち。実行予算書（735/736）は別レーン（浜田指示待ち）。688 は保留のまま触らない  
**Git**: `7f422ff` — VPN v1.2 push 済  
**688 本番**: `2026-06-19-688-print-rounding-fix` rev **34** — **保留**（2026-06-20 浜田指示。6/19 施工主報告印刷対応済・CLOSED 表記は訂正）  
**監査**: `npm run cio:audit:session-builds:strict` — repo=ledger=live **6/6 OK**（先祖返りなし）  
**R21–R24**: **浜田 GO 反映済** — `docs/approved-changes/2026-06-18-rules-r21-r24-hamada-go.md`
**Space 56 進行中**: **実行予算書作成支援ツール　ver.01** — App **735/736** — **BUILD=`2026-06-20-jikkou-yosan-list-dates`** rev **38**
**R34–R40**: **浜田 GO 反映済** — `docs/approved-changes/2026-06-14-rules-r34-r40-hamada-go.md`
**作業領域**: C:\ 重複 clone 削除済 / 正本 clone のみ / `verify:windows-canonical-paths` OK
**Space 21 完了**: **ソフトウエア管理台帳 v1** — App **714/715** — **2026-06-14 浜田目視 OK**
**Space 21 完了**: **記憶媒体等管理台帳 v1** — App **716/717** — **2026-06-14 浜田目視 OK**
**Space 21 完了**: **社内 Wi-Fi SSID 管理 ver.1** — App **718/719** — **2026-06-14 浜田目視 OK**
**Space 34 完了**: **JRシステム用 iPad 管理台帳 ver.1** — App **720/721** — **2026-06-15 浜田目視 OK**
**Space 48 完了**: **VPNアカウント台帳** — App **733/734** — **2026-06-20 v1.2 完了**（3ドメイン・674連携・リネーム）
**ガバナンス（第12/13層）**: **A1–C4 + 674 live-schema + 許容ギャップ運用化** — commit **`6a37e1d` push 済** / `verify:cio-four-ai-governance` OK / `hooks:install` 済（浜田端末）
**許容（機械監視）**: **640** deploy 未接続（`verify:kintone-accepted-gaps`）/ **generations** post-commit amend + git マージ監査
**新レーン（Space 21）**: なし（v1 台帳3本とも CLOSED — 次は別 SPEC / 浜田 GO）
**壁時計試験**: `.cio/session-clock-mode.json` **`trialPaused: true`** — START.bat 不使用・sessionEnd の stopAllClock スキップ（PS フラッシュ切り分け）
**クローズ正本**: `data/cio-project-closures.json` / `npm run verify:checkpoint-project-closure`
**R13–R18**: **浜田 GO 済** — `docs/approved-changes/2026-06-11-rules-r13-r18-hamada-go.md`
**システム推進室ポータル**: **2026-06-11 完了**（712 — 5タブ・15リンク — 浜田 OK）
**ポータル未着手（手動）**: Space 48 スペース画面へ **712 リンク 1 つ**

## セッション切替後の自律復元（圧縮ミラー）

**cold-start 優先**: `docs/handoff/latest-session-bridge.json` + 本ファイル**先頭凍結表** + `.cursor/skills/kintone-session-bootstrap/SKILL.md`  
**クローズ正本**: `data/cio-project-closures.json` — `npm run verify:checkpoint-project-closure`

**項番 -1**: Desktop **`00-NEW-SESSION-STARTER_yyyymmdd.txt` 全文貼付推奨**（`chat-sessions/NEW-SESSION-STARTER.md` 同内容）  
**項番 -0**: 浜田 **OK が返るまで** 項番 0・本題の副作用に **着手しない**（§41 一問）  
**項番 0**: リポルートで **`npm run session:bootstrap`** — **Read より前**に `verify:constitution-handoff` → `mandatory-read-gate.mjs` → `verify:session-clock-health` → `session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync`  
**項番 0.9**: 合意と checkpoint が食い違うときだけ §41 再確認  
**0b Desktop**: `C:\Users\mhamada202408224\Desktop\AI緊急用` — `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync` / **`23-AI緊急用-README.txt`**  
**壁時計**: `SESSION-CLOCK.md` / `SESSION-SPLIT-REMINDER.md` / `session:clock:set` / `session:clock:watch` / `session:split-check`  
**§35-6 / §35-7 / HANDOFF-AI-FIVE-BLOCKS / TSB-031**: 削除は §35-6 / §41。**日終わり（R17 必須）**: `npm run cio:session:close-git`  
**詳細履歴**: `chat-sessions/checkpoints/checkpoint-archive-2026-06-15.md`

---

---

---

## 2026-06-17 JST — **595 emp_id / 715・717 利用者 UI / PCキッティング BOM**

| 項目 | 内容 |
|------|------|
| **595** | 627 連携削除 rev **92** / emp_id 自動付番 rev **93** — **浜田 OK** |
| **715** | emp_id ガード + 利用者チップ→社員検索 rev **13** — **浜田 OK** |
| **717** | 715 同型利用者絞り込み rev **8** — **浜田 OK** |
| **PCキッティング** | `kitting-run.ps1` + UTF-8 BOM 修復 + START.bat 更新 — キッティング PC コピー済 |
| **②インストール** | `（新）キッティングセット` USB 配置済 — **明日試験** |
| **Git** | working tree **dirty**（deploy 済み・未 push） |
| **夕反省** | `docs/reports/2026-06-17-evening-reflection.md` — **R49–R54 承認待ち** |

---



## 2026-06-17 JST — **VPNアカウント管理台帳 v1 完成（クローズ）**

| 項目 | 内容 |
|------|------|
| **判定** | 一覧・採番・集計（アコーディオン・34所属・0口表示）・印刷・検索クリア — **浜田目視 OK** |
| **BUILD** | 733=`2026-06-16-vpn-account-db-block-ui-mutations` rev **5** / 734=`2026-06-16-vpn-account-dash-license-all-depts` rev **12** |
| **正本** | `docs/reports/2026-06-17-vpn-account-completion.md` |
| **再開条件** | 浜田 GO + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除 |

---




## 2026-06-15 JST — **JRシステム用 iPad 管理台帳 ver.1 v1 完成（クローズ）**

| 項目 | 内容 |
|------|------|
| **判定** | 一覧・2 系統採番・集計アコーディオン・A4 印刷・検索クリア — **浜田目視 OK** |
| **BUILD** | 720=`2026-06-15-jr-ipad-db-block-ui-mutations` rev **5** / 721=`2026-06-15-jr-ipad-dash-search-clear` rev **8** |
| **正本** | `docs/reports/2026-06-15-jr-ipad-ledger-completion.md` |
| **Excel** | **運用終了**（kintone のみ正本） |
| **再開条件** | 浜田 GO + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除 |

---





## 2026-06-14 JST — **R34–R40 ガバナンス + ESLint CI 修正（セッション締め）**

| 項目 | 内容 |
|------|------|
| **背景** | Wi-Fi push 後 `kintone-customize-deploy` ESLint 赤（bundle 型 719） |
| **ESLint** | `qrcode-vendor.js` / bundle `desktop.js` ignore、`desktop.src.js` に `QRCode` global |
| **R34–R40** | Windows 正本パス / CLOSED 前 lint / customize registry / 死ショートカット / runbook CI / 四半期スキャン |
| **CI** | **`694c5a4`** — constitution-gates + kintone-customize-deploy + cursor-env-gates **success** |
| **正本** | `docs/runbooks/kintone-project-close-gate.md` / `data/windows-canonical-paths.json` / `data/kintone-customize-path-registry.json` |

---





---


## 2026-06-19 JST — **688 施工主報告印刷 + 関連 Kintone 本日対応（クローズ）**

| 項目 | 内容 |
|------|------|
| **688** | `2026-06-19-688-print-rounding-fix` rev **34** — 施工主報告用印刷（5セクション）・足場風速日数丸め・印刷フッター削除 |
| **595** | `2026-06-19-595-dept-picker-680` rev **96** — 680 所属候補モーダル |
| **674** | `2026-06-19-674-detail-hide-sidebar` rev **243** — 詳細画面右サイドバー非表示 |
| **721** | `2026-06-19-jr-ipad-dash-lifecycle-toggle` rev **12** — 有効/廃止トグル |
| **734** | `2026-06-19-vpn-dash-license-month-compare` rev **13** — ライセンス前回確定比較 |
| **720** | フォーム rev **7** — 新規採番時下書き必須緩和（customize BUILD 不変） |
| **733** | snapshot_month / snapshot_json 追加（フォーム rev **7**） |
| **CI修復** | 削除済 668 を portfolio BUILD 監査対象から除外 |
| **正本** | `docs/plans/2026-06-13-construction-workdays-excel-20260613.md` §9 / JR・VPN・PC台帳 改定履歴 |
| **判定** | 施工主報告印刷・丸め・空白ページ修正まで本番対応済（浜田 OK）— **2026-06-20 表記訂正: CLOSED → 保留**（`data/cio-project-closures.json` holds） |
| **再開条件** | 浜田から再度相談があった場合のみ |

---


<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-19.md -->
