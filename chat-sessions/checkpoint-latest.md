# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-11 JST — **700 表彰ランク確定** ＋ **ポータル 712**（浜田 OK）

## 凍結（毎セッション先頭）
| 禁止 | 許可 |
|------|------|
| 本番 WF 6段階への無断分割 | ガイド執筆・背景デザイン・仕様 doc 更新 |
| 評価スナップショット本番投入（未設計確認前） | test_v3 WF 継続テスト |

**次の1手**: **朝イチ項番 -0** でレーン合意（年次 **Q-SCHED-03** / 業務改善残 / 手動作業）
**実装OK**: 2026-06-06 浜田 → Phase 4b–5 **E2E OK**（2026-06-07 確認）
**はじめに**: **2026-06-07 完了**（699 rev39 v13d — Hamada OK）
**申請編**: **2026-06-08 完了**（699 rev70 — Hamada OK）
**評価編**: **2026-06-09 完了**（699 rev87 — Hamada OK）
**不適合台帳**: **2026-06-10 完了**（706/707 — Hamada 目視 OK）
**外部ITチェック**: **2026-06-10 完了**（708/709 — Hamada 目視 OK・印刷 A4 v2）
**新規システム導入ヒアリング**: **2026-06-10 完了**（710/711 — Hamada 目視 OK・印刷 A4 2枚）
**憲法 Phase 2-D**: **2026-06-10 完了**（`576090f` — genre catalog + §↔ジャンル sync/verify — AGENTS 未変更）
**仕様追記**: **Q-ACL-01** — 699/700 に **人事部のみ** 閲覧権付与（浜田判断・浜田責任）
**業務改善 700**: **2026-06-11** 承認経路・**表彰ランク確定** — BUILD `2026-06-11-bi-rank-hint-message` rev **134**（浜田 正常 OK）
**業務改善 699**: **2026-06-11** フォント特大 — BUILD `2026-06-11-bi-font-xlarge-23px` rev **88**
**システム推進室ポータル**: **2026-06-11 完了**（712 — 5タブ・15リンク・別タブ — 浜田 OK）
**ポータル未着手**: Space 48 スペース画面へ **712 リンク 1 つ**（kintone UI 手動）

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


## 2026-06-10 JST — **外部 IT サービス導入チェックシート（Space 48）**

| 項目 | 内容 |
|------|------|
| **本日完了** | 708 DB + 709 ダッシュ・一覧 + チェック表モーダル + **印刷 A4** — 浜田 **目視 OK** |
| **BUILD** | 708=`2026-06-10-external-it-checksheet-db-block-ui` rev **5** / 709=`2026-06-10-external-it-checksheet-dash-print-a4-v2` rev **5** |
| **正本** | `docs/plans/2026-06-10-external-it-checksheet-spec.md` |
| **入口** | [709](https://jbis-kintone.cybozu.com/k/709/) |

---


## 2026-06-10 JST — **不適合管理台帳 kintone 化（Space 48）**

| 項目 | 内容 |
|------|------|
| **本日完了** | 706 DB + 707 ダッシュ作成・customize deploy・浜田 **目視 OK** |
| **BUILD** | 706=`2026-06-10-nonconformance-db-block-ui` rev **5** / 707=`2026-06-10-nonconformance-dash-v1` rev **4** |
| **正本** | `docs/plans/2026-06-10-nonconformance-ledger-spec.md` |
| **次** | FAQ なし・印刷 v1 後回し（SPEC §5.4） |

---


## 2026-06-09 JST — **699 ガイド「評価編」完了**

| 項目 | 内容 |
|------|------|
| **本日完了** | 699 **評価編** 本文＋スクショ（Q-GUIDE-07）— 浜田 OK |
| **699** | BUILD `2026-06-09-bi-guide-eval-screenshots-complete` **rev87** |
| **正本** | handbook §5.3 / spec Q-GUIDE-07 |
| **次** | **6/11** 年次 Q-SCHED-03 / **6/13** Q-MANUAL-01 |

---


---

## セッション切替後の自律復元（圧縮ミラー・rollup 後）

**cold-start 優先**: `docs/handoff/latest-session-bridge.json` + 本ファイル先頭80行 + `.cursor/skills/kintone-session-bootstrap/SKILL.md`  
**索引**: `data/cio-project-lanes.json` / `data/cio-rules-topic-index.json`

**項番 -1**: Desktop **`00-NEW-SESSION-STARTER_yyyymmdd.txt` 全文貼付推奨**（`chat-sessions/NEW-SESSION-STARTER.md` 同内容）  
**項番 -0**: 浜田 **OK が返るまで** 項番 0・本題の副作用に **着手しない**（§41 一問）  
**項番 0**: リポルートで **`npm run session:bootstrap`** — **Read より前**に `verify:constitution-handoff` → `mandatory-read-gate.mjs` → `verify:session-clock-health` → `session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync`  
**項番 0.9**: 合意と checkpoint が食い違うときだけ §41 再確認  
**0b Desktop**: `C:\Users\mhamada202408224\Desktop\AI緊急用` — `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync` / **`23-AI緊急用-README.txt`**  
**壁時計**: `SESSION-CLOCK.md` / `SESSION-SPLIT-REMINDER.md` / `session:clock:set` / `session:clock:watch` / `session:split-check`  
**§35-6 / §35-7 / HANDOFF-AI-FIVE-BLOCKS / TSB-031**: 削除・日終わり sync は浜田確認または §41  
**詳細履歴**: `chat-sessions/checkpoints/checkpoint-archive-2026-06-11.md`

再開時は `chat-sessions/handoff-log.md` 末尾（2026-06-11 最終締め）と `SESSION-CLOSE-REPORT-20260611.txt` も参照。新 Chat 第1ターンは `npm run verify:session-handoff-integrity -- --import` 推奨。

<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-10.md -->
