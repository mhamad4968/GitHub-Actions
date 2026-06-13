# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-13 JST — **セッション締め**（R19–R33 反映・handoff/bridge 同期済 `8b21807`）

## 凍結（毎セッション先頭）
| 禁止 | 許可 |
|------|------|
| 業務改善 ver.02 の **v1 再実装**（クローズ後の無断再開） | v1 完成条件外の任意（FAQその他・本番6段WF・RAG・Wordマニュアル） |
| 本番 WF 6段階への無断分割 | test_v3 WF 継続テスト |
| 評価スナップショット本番投入（未設計確認前） | ガイド doc 更新（完成条件外） |
| **記憶媒体台帳の kintone 作成**（ソフトウェア v1 目視前） | **ソフトウェア台帳 SPEC 実装**（浜田 GO 後） |

**次の1手**: **ソフトウェア管理台帳** kintone 作成（Space 21・694 型）— 浜田 **「ソフトウェア台帳 kintone 作成 GO」** → 目視 OK 後 **記憶媒体等台帳**
**業務改善 ver.02**: **2026-06-13 クローズ** — 699 rev **105** / 700 rev **139** / 713 rev **12** — 浜田確認済
**新レーン（Space 21）**: **ソフトウェア管理台帳** SPEC GO 済 → **浜田「ソフトウェア台帳 kintone 作成 GO」待ち** / **記憶媒体等台帳** SPEC GO 済（ソフト v1 後）
**ガバナンス**: **R19–R33 浜田 GO 済** — commit `4449977` push 済（`verify:cio-miss-reduction-governance` OK）
**壁時計試験**: `.cio/session-clock-mode.json` **`trialPaused: true`** — START.bat 不使用・sessionEnd の stopAllClock スキップ（PS フラッシュ切り分け）
**クローズ正本**: `data/cio-project-closures.json` / `npm run verify:checkpoint-project-closure`
**R13–R18**: **浜田 GO 済** — `docs/approved-changes/2026-06-11-rules-r13-r18-hamada-go.md`
**システム推進室ポータル**: **2026-06-11 完了**（712 — 5タブ・15リンク — 浜田 OK）
**ポータル未着手（手動）**: Space 48 スペース画面へ **712 リンク 1 つ**

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
**詳細履歴**: `chat-sessions/checkpoints/checkpoint-archive-2026-06-13.md`

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



## 2026-06-11 JST — **業務改善 700 表彰ランク（確定仕様）**

| 項目 | 内容 |
|------|------|
| **本日完了** | 承認経路 UI ＋ **表彰ランク**: 自動=WF正・最終≦自動・部長は自動Cのみ完結・注記文言 |
| **BUILD** | `2026-06-11-bi-rank-hint-message` rev **134** — 浜田 **正常動作 OK** |
| **正本** | `docs/plans/2026-05-23-business-improvement-proposal-spec.md` §Q-UX-06 |

---



## 2026-06-10 JST — **憲法 Phase 2-D 完了（§↔ジャンル機械リンク）**

| 項目 | 内容 |
|------|------|
| **本日完了** | `constitution-genre-catalog.json` 単一正本 / RULES-INDEX 自動節 / sync+verify 連鎖 / `18-ai-team-read-map` 索引ポインタ追記 |
| **AIチーム** | DeepSeek **GO** + `5038` stamp + `verify:cio-four-ai-governance` 全通過 |
| **Git** | `576090f` push 済 |
| **正本** | `docs/plans/2026-06-10-constitution-phase2d-team-proposal.md` |
| **触らない** | AGENTS.md § 本文 / constitution.mdc 手編集 |

---




## 2026-06-10 JST — **新規システム導入ヒアリング記録（Space 48）**

| 項目 | 内容 |
|------|------|
| **本日完了** | 710 DB + 711 ダッシュ・一覧 + ヒアリングモーダル + **印刷 A4 2枚** — 浜田 **目視 OK** |
| **BUILD** | 710=`2026-06-10-new-system-intro-db-block-ui` rev **5** / 711=`2026-06-10-new-system-intro-dash-print-a4-v2` rev **4** |
| **正本** | `docs/plans/2026-06-10-new-system-intro-hearing-spec.md` |
| **入口** | [711](https://jbis-kintone.cybozu.com/k/711/) |

---




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-13.md -->
