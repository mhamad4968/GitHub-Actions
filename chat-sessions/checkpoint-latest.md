# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-14 JST — **R34–R40 ガバナンス + ESLint CI 緑 + C:\ 作業領域整理完了**

## 凍結（毎セッション先頭）
| 禁止 | 許可 |
|------|------|
| 業務改善 ver.02 の **v1 再実装**（クローズ後の無断再開） | v1 完成条件外の任意（FAQその他・本番6段WF・RAG・Wordマニュアル） |
| **社内 Wi-Fi SSID 718/719 の v1 再実装**（クローズ後の無断再開） | v2 候補（PC 台帳連携・ゲスト Wi-Fi 等 — 浜田 GO 後） |
| 本番 WF 6段階への無断分割 | test_v3 WF 継続テスト |
| 評価スナップショット本番投入（未設計確認前） | ガイド doc 更新（完成条件外） |

**次の1手**: **浜田指示待ち** — Space 21 台帳 v1 **3本 CLOSED**。**次レーンは浜田 GO + 項番 -0 合意**
**Git**: **`694c5a4`** = `origin/main` — CI **constitution-gates / kintone-customize-deploy / cursor-env-gates すべて success**
**R34–R40**: **浜田 GO 反映済** — `docs/approved-changes/2026-06-14-rules-r34-r40-hamada-go.md`
**作業領域**: C:\ 重複 clone 削除済 / 正本 clone のみ / `verify:windows-canonical-paths` OK
**Space 21 完了**: **ソフトウエア管理台帳 v1** — App **714/715** — **2026-06-14 浜田目視 OK**
**Space 21 完了**: **記憶媒体等管理台帳 v1** — App **716/717** — **2026-06-14 浜田目視 OK**
**Space 21 完了**: **社内 Wi-Fi SSID 管理 ver.1** — App **718/719** — **2026-06-14 浜田目視 OK**
**ガバナンス（第12/13層）**: **A1–C4 + 674 live-schema + 許容ギャップ運用化** — commit **`6a37e1d` push 済** / `verify:cio-four-ai-governance` OK / `hooks:install` 済（浜田端末）
**許容（機械監視）**: **640** deploy 未接続（`verify:kintone-accepted-gaps`）/ **generations** post-commit amend + git マージ監査
**新レーン（Space 21）**: なし（v1 台帳3本とも CLOSED — 次は別 SPEC / 浜田 GO）
**壁時計試験**: `.cio/session-clock-mode.json` **`trialPaused: true`** — START.bat 不使用・sessionEnd の stopAllClock スキップ（PS フラッシュ切り分け）
**クローズ正本**: `data/cio-project-closures.json` / `npm run verify:checkpoint-project-closure`
**R13–R18**: **浜田 GO 済** — `docs/approved-changes/2026-06-11-rules-r13-r18-hamada-go.md`
**システム推進室ポータル**: **2026-06-11 完了**（712 — 5タブ・15リンク — 浜田 OK）
**ポータル未着手（手動）**: Space 48 スペース画面へ **712 リンク 1 つ**

---

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

## 2026-06-14 JST — **第12/13層ガバナンス A1–C4 + 674 live-schema + 許容ギャップ運用化**

| 項目 | 内容 |
|------|------|
| **範囲** | A1 handoff / A2 MCP matrix / A3 deploy live-schema guard / B1–B5 registry・portfolio・generations / C1–C4 MCP×CLI・月次 portfolio |
| **674** | `resolveCustomizeDirsForApp` + registry `relatedAppFieldsFrom` + 596 静的台帳 — `verify:kintone-live-schema --app 674` OK |
| **許容** | **640** deploy 未接続 → `data/kintone-accepted-gaps.json` + `verify:kintone-accepted-gaps` / **generations** → pre-commit dry-run + post-commit amend |
| **正本** | `kintone-apps.md` SOP / `docs/runbooks/cio-periodic-ops-schedule.md` / `docs/faq-apps-640-641.md` |
| **Git** | **`6a37e1d`** push 済 / `main = origin/main` |
| **次回朝** | `npm run cio:morning:ready`（**`--project business-improvement` 不要** — v1 クローズ済） |

---


## 2026-06-13 JST — **R19–R33 ミス削減ガバナンス（浜田 GO 反映）**

| 項目 | 内容 |
|------|------|
| **承認** | 夕反省 R19–R25 + 新規 R26–R33 **一括 GO** |
| **正本** | `docs/reports/2026-06-13-evening-reflection.md` / `docs/runbooks/cio-four-ai-governance.md` |
| **主要** | `session-close-execute-first.mdc`（R23/R26）/ `windows-spawn-flash-triage.md`（R32）/ `kintone-ledger-spec-qa-checklist.md`（R19） |
| **Git** | `4449977` feat(governance) — **push 済** / `verify:cio-spec-close-git` OK |

---



## 2026-06-13 JST — **ソフトウェア/記憶媒体台帳 SPEC + 壁時計試験**

| 項目 | 内容 |
|------|------|
| **本日完了（意見交換）** | ソフトウェア台帳 SPEC 確定（識別3スロット・595・支店/営業所/社員リスト・印刷） |
| **SPEC** | `docs/plans/2026-06-13-software-ledger-kintone-spec.md`（R19 runbook 参照追記済） |
| **記憶媒体 SPEC** | `docs/plans/2026-06-13-storage-media-ledger-kintone-spec.md`（A–D+F・1物理1レコード・ソフト v1 後に実装） |
| **実装順** | ① ソフトウェア DB+Dash → 目視 OK → ② 記憶媒体 |
| **壁時計** | `trialPaused: true` — PS フラッシュ切り分け試験中（R21/R22/R25 runbook 反映済） |
| **Git** | SPEC + 試験パッチ + npm-cli spawn 修正 — **commit/push 済**（`4324f8f`〜`4449977`） |

---



## 2026-06-13 JST — **業務改善 ver.02 v1 完成（クローズ）**

| 項目 | 内容 |
|------|------|
| **判定** | 申請・評価・**年次集計**・ガイド UX（C案）まで動作確認済 — **v1 クローズ可** |
| **BUILD** | 699=`2026-06-13-bi-guide-lists-first-accordion` rev **105** / 700=`2026-06-13-bi-completion-date` rev **139** / 713=`2026-06-13-bi-annual-redirect-guide` rev **12** |
| **正本** | `docs/reports/2026-06-13-business-improvement-completion.md` |
| **締め** | `chat-sessions/SESSION-CLOSE-REPORT-20260613.txt` |
| **再開条件** | 浜田 GO + checkpoint「次の1手」更新 + `data/cio-project-closures.json` 解除 |

---

## セッション切替後の自律復元（圧縮ミラー・2026-06-13 復元）

**cold-start 優先**: `docs/handoff/latest-session-bridge.json` + 本ファイル**先頭凍結表** + `.cursor/skills/kintone-session-bootstrap/SKILL.md`  
**索引**: `data/cio-project-lanes.json` / `data/cio-rules-topic-index.json`  
**クローズ正本**: `data/cio-project-closures.json` — 業務改善 ver.02 **v1 クローズ済**（2026-06-13）。`npm run verify:checkpoint-project-closure`

**項番 -1**: Desktop **`00-NEW-SESSION-STARTER_yyyymmdd.txt` 全文貼付推奨**（`chat-sessions/NEW-SESSION-STARTER.md` 同内容）  
**項番 -0**: 浜田 **OK が返るまで** 項番 0・本題の副作用に **着手しない**（§41 一問）  
**項番 0**: リポルートで **`npm run session:bootstrap`** — **Read より前**に `verify:constitution-handoff` → `mandatory-read-gate.mjs` → `verify:session-clock-health` → `session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync`  
**項番 0.9**: 合意と checkpoint が食い違うときだけ §41 再確認  
**0b Desktop**: `C:\Users\mhamada202408224\Desktop\AI緊急用` — `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync` / **`23-AI緊急用-README.txt`**  
**壁時計**: `SESSION-CLOCK.md` / `SESSION-SPLIT-REMINDER.md` / `session:clock:set` / `session:clock:watch` / `session:split-check`  
**§35-6 / §35-7 / HANDOFF-AI-FIVE-BLOCKS / TSB-031**: 削除は §35-6 / §41。**日終わり（R17 必須）**: `npm run cio:session:close-git -- --execute --auto-stage --message "…"`（R20 — desktop sync 内包。正本: 18 R20 / HANDOFF 先頭）
**詳細履歴**: `chat-sessions/checkpoints/checkpoint-archive-2026-06-14.md`

再開時は `chat-sessions/handoff-log.md` 末尾と `chat-sessions/SESSION-CLOSE-REPORT-20260613.txt`。業務改善再開は **浜田 GO + closures 解除** のみ（R19）。

---




## 2026-06-11 JST — **システム推進室ポータル（App 712）**

| 項目 | 内容 |
|------|------|
| **本日完了** | タブ型ポータル・サブテーブルリンク設定・seed 15 件・別タブで開く — 浜田 **OK** |
| **BUILD** | `2026-06-11-space48-portal-v3` rev **24** |
| **正本** | `docs/plans/2026-06-11-space48-portal-spec.md` |
| **入口** | [712](https://jbis-kintone.cybozu.com/k/712/) |
| **API 注意** | サブテーブル DD は選択肢キー **日本語必須** |

---





<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-14.md -->
