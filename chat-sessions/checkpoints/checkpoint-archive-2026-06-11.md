# checkpoint アーカイブ（2026-06-11）

> rollup from checkpoint-latest.md — 5 sections

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

