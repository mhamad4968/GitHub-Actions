# 復元チェックポイント（最新）

<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

## 凍結（毎セッション先頭）

| 禁止 | 許可 |
|------|------|
| 本番 WF 6段階への無断切替 | ガイド執筆・背景デザイン・仕様/doc 更新 |
| 評価スナップショット本番投入（未設計確認前） | test_v3 WF 継続テスト |

**次回 1 手**: **今夜** ガイド **申請編** 本文 + **699/700 背景デザイン**（微調整はその場で）

**実装OK**: 2026-06-06 浜田 — Phase 4b–5 **E2E OK**（2026-06-07 確認）

---

## 2026-06-07 JST — **業務改善 Phase 4b–5 完走・締め**

| 項目 | 内容 |
|------|------|
| **本日完了** | 697–700 Space5 / 申請UI applyDraft **v33** / 評価UI evalDraft / test_v3 WF / A→人事 / ガイド遷移 / 支店長判断 **OK** |
| **BUILD** | 700=`2026-06-07-bi-proposal-apply-v33` rev118 / 699=`2026-06-07-bi-guide-v5g` rev16 |
| **浜田確認** | 業務改善・アイデア提案・支店長判断 — **すべて OK** |
| **今夜** | 申請編ガイド + 背景デザイン |
| **6/8** | 評価者編 |
| **6/9** | FAQ |
| **Git** | commit + push（本締め） |
| **締め** | `SESSION-CLOSE-REPORT-20260607.txt` |

---

## 2026-06-06 JST — **夜・最終締め**

| 項目 | 内容 |
|------|------|
| **本日完了** | **674** deploy 済／**PCキッティング** ①②／**Cursor環境 Phase A〜E**／**Automations 4件**／**§4.7 修正** |
| **実装OK** | 浜田 2026-06-06 — `docs/handoff/implementation-ok-seal.json` |
| **締め** | `SESSION-CLOSE-REPORT-20260606.txt` |

---

<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-06-06.md -->

---

## セッション切替後の自律復元（圧縮ミラー・rollup 後）

**cold-start 優先**: `docs/handoff/latest-session-bridge.json` + 本ファイル先頭80行 + `.cursor/skills/kintone-session-bootstrap/SKILL.md`  
**索引**: `data/cio-project-lanes.json` / `data/cio-rules-topic-index.json`

**項番 -1**: Desktop **`00-NEW-SESSION-STARTER_yyyymmdd.txt` 全文貼付推奨**（`chat-sessions/NEW-SESSION-STARTER.md` 同内容）  
**項番 -0**: 浜田 **OK が返るまで** 項番 0・本題の副作用に **着手しない**（§41 一問）  
**項番 0**: リポルートで **`npm run session:bootstrap`**（**Read より前**に `verify:constitution-handoff` → `mandatory-read-gate.mjs` → `verify:session-clock-health` → `session-starter:sync-desktop` → `verify:desktop-ai-emergency-sync`）  
**項番 0.9**: 合意と checkpoint が食い違うときだけ §41 再確認  
**0b Desktop**: `C:\Users\mhamada202408224\Desktop\AI緊急用` — `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync` / **`23-AI緊急用-README.txt`**  
**壁時計**: `SESSION-CLOCK.md` / `SESSION-SPLIT-REMINDER.md` / `session:clock:set` / `session:clock:watch` / `session:split-check`  
**§35-6 / §35-7 / HANDOFF-AI-FIVE-BLOCKS / TSB-031**: 削除・日終わり sync は浜田確認または §41  
**詳細履歴**: `chat-sessions/checkpoints/checkpoint-archive-2026-06-06.md`

**最終更新**: 2026-06-07 (Sun) JST — **Phase 4b–5 E2E OK**・commit `b8a2824`・今夜 申請編ガイド+背景デザイン
