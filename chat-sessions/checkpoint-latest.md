# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-12 JST（夜）— **736 UI-BACKLOG-02 浜田確認 OK**

**Git**: **`70ef82da`** = `origin/main` — push 済

**次の1手**: **7/13〜** — **UI-BACKLOG-03** ブロック選択 DD 仕様確認（**7/13–7/14** · implement **7/16** · **NO-GO 可**）— 浜田 **スケジュール通りで GO**

**GO待ち**: 憲法正式クローズ — 観測後（≈7/25）· rules-opt §18 ACK

**観測期間（≈7/25 再確認）**: 憲法 Round-3 · rules-opt §18 ACK · turn-start △2 — **正式クローズ宣言は今日やらない**

**運用メモ**: 経営会議資料 — 作成日「作成したい」→ 依頼書テンプレ貼付 → 記入。**MCP `shiryo-sakusei` ready**（Cursor 再起動済）· 正本 `mcp/shiryo-sakusei-mcp/SPEC.md` · 依頼書 `docs/依頼書テンプレート.txt`

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` · **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md` · **クローズ正本**: `data/cio-project-closures.json`

**688 本番**: BUILD=`2026-07-11-688-dirty-banner-fix` rev **85** — 浜田目視 OK

**736 本番**: BUILD=`2026-07-12-736-ui-backlog-02-col-resize` rev **185** — **UI-BACKLOG-02 完了**

## 本日完了サマリー（昼）

| 項目 | 内容 |
|------|------|
| **shiryo-sakusei MCP** | `mcp/shiryo-sakusei-mcp/` · SPEC · 依頼書テンプレ · commit `9e2b18e8` |
| **経営会議資料運用** | `C:\tmp\資料作成\依頼書テンプレート.txt` · 作成日テンプレ貼付→記入フロー確立 |
| **MCP 有効化** | Cursor 再起動 · `user-shiryo-sakusei` **ready** 確認済 |
| **セッション締め** | checkpoint/handoff · Desktop sync · handoff bridge 整合 · push `2f05b02c` |
| **夜レーン予定** | 736 UI-BACKLOG-02 列幅ドラッグ §41 · 体制更新 verify 不具合があれば修正 |

## クローズ済み（`data/cio-project-closures.json` — 9件）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688** | WBGT 完了 · **それ以外触らない** |
| **677–679** | 触らない |
| **SKYSEA** | 8/1 再計画 · 7月着手禁止 |
| **736** | §9.6 凍結 · **UI-BACKLOG-02 7/12** |
| **712** | 削除済 — deploy 禁止 |

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`  
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031  
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-07-12 昼セッション完了

| 項目 | 内容 |
|------|------|
| **shiryo-sakusei MCP** | `mcp/shiryo-sakusei-mcp/` · SPEC · 依頼書テンプレ · commit `9e2b18e8` push 済 |
| **経営会議資料運用** | `C:\tmp\資料作成\依頼書テンプレート.txt` · 作成日テンプレ貼付→記入フロー確立 |
| **MCP 有効化** | Cursor 再起動 · `user-shiryo-sakusei` **ready** 確認済 |

## 2026-07-12 朝（WAKE）

checkpoint 凍結ゾーン修復（`d00a2fdc`）· cold-start OK

## 2026-07-11 F0 改善（浜田全承認 · 実施済）

| ID | 内容 |
|----|------|
| #R-GO-BOUNDARY-01 | charter / 18-重要確認 / AGENTS — 確認A·G0·G2 分離 |
| #R-REQUEST-COMPOSE-02 | compose runbook/spec — OK後≠実装 |
| #D-GO-COMPOSE-MAP-01 | Desktop 36 段階対応表 |
| #S-COMPOSE-PHASE-01 | `--phase investigate\|implement` |
| #R-688-DEPLOY-01 | 実装GO後 · 688 deploy 必須 |

記録: `docs/approved-changes/2026-07-11-evening-f0-improvements-hamada-go.md`
