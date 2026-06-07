# 復元チェックポイント（最新）
<!-- このファイルは「チャットが無くても今どこまで進んだか」を残す。正本（.cursor/rules・kintone-apps.md・CLAUDE.md）と矛盾したら正本を優先し、このファイルを更新すること。 -->

## 凍結（毎セッション先頭）
| 禁止 | 許可 |
|------|------|
| 本番 WF 6段階への無断分割 | ガイド執筆・背景デザイン・仕様 doc 更新 |
| 評価スナップショット本番投入（未設計確認前） | test_v3 WF 継続テスト |

**次の1手**: **2026-06-08** ガイド **申請編** 本文 + Q-GUIDE-07 スクショ（3〜5）— Hamada 確認後 deploy
**実装OK**: 2026-06-06 浜田 → Phase 4b–5 **E2E OK**（2026-06-07 確認）
**はじめに**: **2026-06-07 完了**（699 rev39 v13d — Hamada OK）

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
| **Git** | `605d883` + `ce4d9a8`（本締め handoff） |
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

**Q-GUIDE 進捗**: Q-GUIDE-09 はじめに ✅ / Q-GUIDE-07 申請編スクショは **6/8** / 評価編 **6/9** / FAQ 後日

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

**最終更新**: 2026-06-07 (Sun) JST — **699 はじめに完了 rev39**・commit `ce4d9a8`・次=6/8 申請編ガイド+スクショ
