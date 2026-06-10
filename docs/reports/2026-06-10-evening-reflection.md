# 2026-06-10 — AI 失敗と憲法・ルール更新案

> **スコープ**: `docs/runbooks/evening-reflection-scope.md`（AI 失敗 + **ミス削減**アップデート案のみ）

（明日の作業・案件・UAT 手順は対象外。機能の未実装リストも書かない。）

---

## AI の失敗

| # | 失敗 | 同日対応 |
|---|------|----------|
| F1 | Phase 2-D sync 初回で PowerShell `&&` 連結 → 即失敗（作業中断に見えた） | `;` + `$LASTEXITCODE` に切替 |
| F2 | `constitution:extract-genres` 再実行で genre md が LF 化 → pre-commit EOL NG | node で CRLF 一括復元後 commit |
| F3 | Phase 2-D commit/push 後、Desktop `AI緊急用` 同期が同一ターンで未実施 | 本締めで `desktop:sync-and-verify` |
| F4 | 1 日に kintone 6 app + PC メンテ + 憲法 Phase 2-D とレーンが混在し handoff 要約が長文化 | checkpoint 先頭に Phase 2-D 行を追加 |

---

## 憲法・ルール更新案

### R7 — 憲法・索引変更後は Desktop 同期を同一ターン必須

**提案**: `docs/constitution/` または `RULES-INDEX` / `28-CONSTITUTION-GENRE-MAP` を触ったコミットでは、push 前に **`npm run desktop:sync-and-verify`** を必須。`16-amendment-process.md` の儀式 sync と同列。

**防ぐ失敗**: F3  
**正本候補**: `docs/runbooks/cio-four-ai-governance.md` チェックリスト 1 行追加

---

### R8 — Windows ネイティブ shell 向けコマンド例の統一

**提案**: runbook / AI 向け手順で PowerShell 既定時は **`;`** または **`cmd /c`** を例示。`&&` は bash/WSL 専用と明記。

**防ぐ失敗**: F1  
**正本候補**: `WORKFLOW.md` または `docs/runbooks/pc-stack-windows.md`

---

### R9 — `constitution:extract-genres` 後の EOL 自動復元

**提案**: extract スクリプト末尾で `docs/constitution/*.md` を CRLF 出力に固定（pre-commit 前に LF 化しない）。

**防ぐ失敗**: F2  
**正本候補**: `scripts/extract-constitution-by-genre.mjs` の `writeFileSync` 前正規化

---

### R10 — 6/9 承認済み R1–R6 の実装優先度（再掲・承認待ち）

**提案**: workdays レーン（687/688）向け deploy ゲート（R1 UI grep / R3 BUILD 同期 / R4 calc-test 同梱）を **kintone 年次レーン着手前** に 1 本化。Phase 2-D 完了後の次の「機械ゲート」候補。

**防ぐ失敗**: 6/9 の F1–F4 再発  
**正本候補**: `docs/runbooks/workdays-deploy-checklist.md`（R6 案の具体化）

---

## 承認待ち

| ID | 概要 | 推奨 |
|----|------|------|
| R7 | Desktop 同期同一ターン | **GO 推奨**（低コスト・高効果） |
| R8 | PowerShell コマンド例 | **GO 推奨** |
| R9 | extract CRLF 固定 | **GO 推奨** |
| R10 | workdays deploy ゲート | **6/11 前に可否判断** |
| R1–R6 | 6/9 夕反省から継続 | 未承認分は明日以降 |

---

## 意図的に書かないもの

- 6/11 Q-SCHED-03 の作業手順
- 706–711 の機能追加・FAQ
- npm audit `xlsx` 対応（別途）
