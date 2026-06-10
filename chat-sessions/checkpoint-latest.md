# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

**最終更新**: 2026-06-10 JST — Space 48 チェック系 706–711 目視 OK ＋ **憲法 Phase 2-D 完了**

## 凍結（毎セッション先頭）
| 禁止 | 許可 |
|------|------|
| 本番 WF 6段階への無断分割 | ガイド執筆・背景デザイン・仕様 doc 更新 |
| 評価スナップショット本番投入（未設計確認前） | test_v3 WF 継続テスト |

**次の1手**: **6/11** 年次 **Q-SCHED-03** 再整理 → **6/12–13** 新⑤実装 ＋ **Q-MANUAL-01**（Word）
**実装OK**: 2026-06-06 浜田 → Phase 4b–5 **E2E OK**（2026-06-07 確認）
**はじめに**: **2026-06-07 完了**（699 rev39 v13d — Hamada OK）
**申請編**: **2026-06-08 完了**（699 rev70 — Hamada OK）
**評価編**: **2026-06-09 完了**（699 rev87 — Hamada OK）
**不適合台帳**: **2026-06-10 完了**（706/707 — Hamada 目視 OK）
**外部ITチェック**: **2026-06-10 完了**（708/709 — Hamada 目視 OK・印刷 A4 v2）
**新規システム導入ヒアリング**: **2026-06-10 完了**（710/711 — Hamada 目視 OK・印刷 A4 2枚）
**憲法 Phase 2-D**: **2026-06-10 完了**（`576090f` — genre catalog + §↔ジャンル sync/verify — AGENTS 未変更）
**仕様追記**: **Q-ACL-01** — 699/700 に **人事部のみ** 閲覧権付与（浜田判断・浜田責任）

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

## 2026-06-09 JST — **工事稼働 687/688 + 反省会（R1–R6 承認済）**

<!-- 反省会スコープ: AI 失敗 + ルール案のみ。案件・UAT・明日 TODO は書かない。 -->

| 項目 | 内容 |
|------|------|
| **AI 失敗** | F1 月列ソート / F2 年列 ghost deploy / F3 BUILD ドリフト / F4 calc-test 未追随 / F5 締め文書混同 |
| **ルール実装** | R1 `workdays-verify-built-ui` / R2 calc-gate 月ソート / R3 `sync-kintone-apps-build` / R4 calc-gate / R5 `session-close-reflection-scope.md` / R6 `workdays-deploy-checklist.md` |
| **BUILD** | 687=`2026-06-09-687-workdays-excel-v1` / 688=`2026-06-09-688-workdays-excel-table-v5` |
| **詳細** | `docs/reports/2026-06-09-evening-reflection.md` / `SESSION-CLOSE-REPORT-20260609.txt` |

---


## 2026-06-07 JST — **追記締め（Q-ACL-01 人事部アクセス）**

| 項目 | 内容 |
|------|------|
| **本セッション** | 699/700 を人事部に一部見せる可否 → **付与 OK** → 仕様 **Q-ACL-01** 確定（閲覧のみ・浜田責任） |
| **正本** | spec §4.0.1 / handbook §2 / checklist |
| **kintone 操作** | アプリ権限付与は **浜田側**（仕様追記のみ commit） |
| **次** | **6/8** 申請編（変更なし） |

---


## 2026-06-07 JST — **最終締め（699 ガイド「はじめに」完了）**

| 項目 | 内容 |
|------|------|
| **本日完了** | 699 はじめに 4 小節（システムの説明 / ログイン / 申請〜完了 / 一覧の見方）文案・UI・Hamada OK |
| **699 UI** | 横メニュー＋クリックドロップダウン、章背景、見出しアイコン、ログイン状態バナー（共有・評価者・**提案を出す**太字） |
| **BUILD** | 699=`2026-06-07-bi-guide-v13d-banner-bold-both` **rev39** / 700=`2026-06-07-bi-proposal-apply-v33` rev118 |
| **正本** | spec Q-GUIDE-04/05/09、handbook §5、Q-GUIDE-09 はじめに完了 |
| **6/8** | **申請編**（入力項目・添付・申請ボタン + スクショ） |
| **6/9** | **評価編** |
| **後日** | その他 FAQ |
| **Git** | `605d883` + handoff commits + **Q-ACL-01** spec（本追記締め） |
| **締め** | `SESSION-CLOSE-REPORT-20260607.txt`（**最終**） |

---


## 2026-06-07 JST — **業務改善 Phase 4b–5 完走**

| 項目 | 内容 |
|------|------|
| **本日完了** | 697–700 Space5 / 申請UI applyDraft **v33** / 評価UI evalDraft / test_v3 WF / A→人間 / ガイド遷移 / 支店長判断 **OK** |
| **BUILD（午前）** | 700 rev118 / 699 v5g rev16 |
| **浜田確認** | 業務改善・アイデア提案・支店長判断 → **すべて OK** |
| **仕様** | `docs/plans/2026-05-23-business-improvement-proposal-spec.md` §11 |

---


## 2026-06-06 JST — **夜・最終締め**

| 項目 | 内容 |
|------|------|
| **本日完了** | **674** deploy 済 / **PCキッティング** ①② / **Cursor環境 Phase A〜E** / **Automations 4件** / **§4.7 修正** |
| **実装OK** | 浜田 2026-06-06 → `docs/handoff/implementation-ok-seal.json` |
| **締め** | `SESSION-CLOSE-REPORT-20260606.txt` |

---

## 参照（業務改善ガイド）

| 用途 | パス |
|------|------|
| 699 カスタマイズ | `customize/business-improvement-guide/desktop.js` |
| 700 申請 | `customize/business-improvement-proposal/desktop.js` |
| 仕様 | `docs/plans/2026-05-23-business-improvement-proposal-spec.md` |
| 実装ハンドブック | `docs/plans/2026-05-28-business-improvement-implementation-handbook.md` |
| 導入資料（ヒント） | `C:\tmp\業務改善\導入資料\` |
| live BUILD 台帳 | `data/cio-live-builds.json` / `kintone-apps.md` |
| 終了レポート | `chat-sessions/SESSION-CLOSE-REPORT-20260607.txt` |

**deploy 手順（699）**: `node scripts/cio-preflight-stamp.mjs --app 699 --note "..."` → `npm run deploy:699` → kintone 実機 Ctrl+F5

**Q-GUIDE 進捗**: Q-GUIDE-09 はじめに ✅ / **Q-ACL-01** ✅ / **申請編 ✅ 2026-06-08**（699 rev70）/ **評価編 ✅ 2026-06-09**（699 rev87）/ FAQ 後日 / **年次 Q-SCHED-03** 6/11〜13 + **Q-MANUAL-01**

<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-06.md -->

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
**詳細履歴**: `chat-sessions/checkpoints/checkpoint-archive-2026-06-06.md`

再開時は `chat-sessions/handoff-log.md` 末尾（2026-06-07 最終締め）と `SESSION-CLOSE-REPORT-20260607.txt` も参照。新 Chat 第1ターンは `npm run verify:session-handoff-integrity -- --import` 推奨。


<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-10.md -->
