# checkpoint アーカイブ（2026-06-12）

> rollup from checkpoint-latest.md — 2 sections

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

