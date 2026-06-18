# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-18 JST — **R21–R24 反映 + 736 担当説明準備**

## 凍結（毎セッション先頭）
| 禁止 | 許可 |
|------|------|
| 業務改善 ver.02 の **v1 再実装**（クローズ後の無断再開） | v1 完成条件外の任意（FAQその他・本番6段WF・RAG・Wordマニュアル） |
| **社内 Wi-Fi SSID 718/719 の v1 再実装**（クローズ後の無断再開） | v2 候補（PC 台帳連携・ゲスト Wi-Fi 等 — 浜田 GO 後） |
| **JR システム用 iPad 720/721 の v1 再実装**（クローズ後の無断再開） | v2 候補（694/674 連携・集計セル絞込 等 — 浜田 GO 後） |
| **VPN アカウント管理 733/734 の v1 再実装**（クローズ後の無断再開） | v2 候補（PC 台帳連携・廃止履歴 等 — 浜田 GO 後） |
| 本番 WF 6段階への無断分割 | test_v3 WF 継続テスト |
| 評価スナップショット本番投入（未設計確認前） | ガイド doc 更新（完成条件外） |

**次の1手**: **担当説明（736 イメージ確認）** — 先に `npm run jikkou-yosan:pre-demo-gate` → 仕様 §9 + Ctrl+Shift+R 目視  
**Git**: `3fec05d` + GHA `9a0d178` — pull 推奨  
**R21–R24**: **浜田 GO 反映済** — `docs/approved-changes/2026-06-18-rules-r21-r24-hamada-go.md`
**Space 56 進行中**: **実行予算書 v1** — App **735/736** — **BUILD=`2026-06-18-jikkou-yosan-v10-bidir-codes`** rev **29** — 2623001-001 検算 OK
**R34–R40**: **浜田 GO 反映済** — `docs/approved-changes/2026-06-14-rules-r34-r40-hamada-go.md`
**作業領域**: C:\ 重複 clone 削除済 / 正本 clone のみ / `verify:windows-canonical-paths` OK
**Space 21 完了**: **ソフトウエア管理台帳 v1** — App **714/715** — **2026-06-14 浜田目視 OK**
**Space 21 完了**: **記憶媒体等管理台帳 v1** — App **716/717** — **2026-06-14 浜田目視 OK**
**Space 21 完了**: **社内 Wi-Fi SSID 管理 ver.1** — App **718/719** — **2026-06-14 浜田目視 OK**
**Space 34 完了**: **JRシステム用 iPad 管理台帳 ver.1** — App **720/721** — **2026-06-15 浜田目視 OK**
**Space 48 完了**: **VPNアカウント管理台帳** — App **733/734** — **2026-06-17 浜田目視 OK**
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





## 2026-06-14 JST — **社内 Wi-Fi SSID 管理 ver.1 v1 完成（クローズ）**

| 項目 | 内容 |
|------|------|
| **判定** | 一覧・編集・A4 印刷（QR 付き）・印刷ヘッダー **(株）J-BISメンテナンス** — **浜田目視 OK** |
| **BUILD** | 718=`2026-06-14-wifi-ssid-db-block-ui-mutations` rev **5** / 719=`2026-06-14-wifi-ssid-dash-company-jbis` rev **7** |
| **正本** | `docs/reports/2026-06-14-wifi-ssid-completion.md` |
| **Excel** | **完全削除済**（2026-06-14 浜田報告）— kintone 正本のみ |
| **再開条件** | 浜田 GO + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除 |

---





<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-18.md -->
