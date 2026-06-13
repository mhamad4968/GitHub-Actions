# 2026-06-13 — AI 失敗とルール更新案

> **スコープ**: `docs/runbooks/evening-reflection-scope.md`（AI 失敗 + **ミス削減**アップデート案のみ）

---

## AI の失敗

| # | 失敗 | 再発原因 |
|---|------|----------|
| F1 | 浜田「では終わります」に **引継ぎ（checkpoint / export / Desktop sync）を先出ししなかった** | セッション締めトリガーが憲法化されているが、**AI が能動実行する習慣が弱い** |
| F2 | **社員単位リスト・印刷**が SPEC 確定後の後追い（浜田「言い忘れ」） | 台帳 Q&A に **一覧/印刷/フィルタの確認項目がテンプレ化されていない** |
| F3 | PowerShell 一瞬フラッシュ — **da1d299 後も残存** | hotpath 修正のみ。**sessionEnd の npm execSync** と **stopAllClock 内 PS** が対象外 |
| F4 | 壁時計 `trialPaused` 試験パッチ・**SPEC 2 本が未 commit** のまま締め直前 | SPEC 確定日の **close-git 習慣が未固定** |
| F5 | PS 原因説明で **handoff と壁時計が混在**し、浜田の「壁時計では？」への初回回答が散漫 | 切り分け手順（試験停止→観察）を runbook 化前に口頭だけ |

---

## ルール更新案 — **承認待ち**

| ID | 概要 | 反映先（案） | 期待効果 |
|----|------|--------------|----------|
| **R19** | **台帳 SPEC Q&A テンプレ** — 確定前に必ず確認: ①対象範囲 ②1レコード粒度 ③識別子 ④595 ⑤**支店/営業所/社員の一覧・印刷** ⑥廃止/削除 | `docs/runbooks/kintone-ledger-spec-qa-checklist.md`（新規）+ software/storage SPEC 冒頭参照 | F2 再発防止 |
| **R20** | **sessionEnd handoff** — `execSync('npm run …')` を **`runNpmScriptSync`（windowsHide）** に置換 | `.cursor/hooks/session-end-autopilot.mjs` | F3 一部解消 |
| **R21** | **manual-desktop 時 sessionEnd で stopAllClock しない**（Composer 終了で壁時計を切らない）。**Cursor 完全終了時のみ**停止、または Desktop STOP 委任 | `session-end-autopilot.mjs` + `session-clock-cursor-lifecycle.md` | F3 本体（壁時計） |
| **R22** | **stopAllClock の PS 掃除**を **taskkill / node 直叩き**に置換（PS 不要経路） | `scripts/lib/session-clock-process.mjs` | F3 保険 |
| **R23** | **セッション締め AI 手順** — 浜田「終わり」系発話で **checkpoint → handoff-log → export-handoff → desktop sync** を **先に実行**してから返答 | `.cursor/rules/` または `evening-reflection-scope.md` 追記 | F1 再発防止 |
| **R24** | **SPEC 確定日** — `docs/plans/*-spec.md` 追加・試験フラグ変更は **同日 close-git**（未 push 可・commit 必須） | `cio-four-ai-governance.md` または verify 追加 | F4 再発防止 |
| **R25** | **trialPaused** — 試験終了条件と **恒久設定（R21/R22）への昇格手順**を runbook 1 節 | `docs/runbooks/session-clock-cursor-lifecycle.md` | 試験の迷子防止 |
| **R26** | **返答スコープ分離** — 改善案/チェック結果に「明日やること」を混ぜない | `evening-reflection-scope.md` + `session-close-execute-first.mdc` | F11 |
| **R27** | （R33 に統合）ヘルスチェックターン runbook | `cio-health-check-turn.md` | チェック混乱 |
| **R28** | debug-tips **同日見出し dedupe** | `cio-debug-tips-stock.mjs` | F10 |
| **R29** | win-hidden-spawn **runtime smoke**（npm-cli 経路） | `verify-win-hidden-spawn-hotpaths.mjs` | F8 |
| **R30** | health-check **回帰 fixture** | `verify-health-check-regression.mjs` | F6/F7 |
| **R31** | **bridge gitHead 意味固定** + close-git bridge 単独 commit | governance + `cio-handoff-export-validate.mjs` | F9 |
| **R32** | **PS フラッシュ切り分け runbook** | `windows-spawn-flash-triage.md` | F5 |
| **R33** | **「チェックして」標準チェーン** | `cio-health-check-turn.md` | 本ターン混乱 |

---

## 承認済み

| ID | 承認日 | 備考 |
|----|--------|------|
| **R19–R33** | 2026-06-13 | 浜田一括 GO — 反映: runbook / rules / verify / close-git / spawn |

（夕反省初版 R19–R25 + 新規 R26–R33 を含む）

---

## 承認待ち

（なし — 2026-06-13 一括 GO 済）

---

## 意図的に書かないもの

- 明日の kintone 作成手順（項番 -0）
- ソフトウェア台帳フィールド詳細（正本: SPEC）
