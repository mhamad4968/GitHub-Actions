# プロジェクト完了・認識同期ガバナンス（浜田↔AI 事故防止）

**制定**: 2026-06-13（業務改善 v1 クローズ後の認識ズレ教訓）  
**階層**: **第3 runbook** — [`docs/constitution/00-rule-hierarchy.md`](../constitution/00-rule-hierarchy.md)  
**憲法カーネル**: [`docs/constitution/23-project-closure-recognition-kernel.md`](../constitution/23-project-closure-recognition-kernel.md)  
**TSB**: [`docs/troubleshooting.md`](../troubleshooting.md) **TSB-038**

## 目的（趣旨）

**浜田と AI チームの間で「まだやるべき」と「もう完了」の認識がズレると、誤着手・誤ブリーフィング・誤 GO 待ちが起きる。**  
正本は **kintone-apps.md / 完成サマリー / closures 登録** だが、**checkpoint・handoff・bridge・朝 ready** が追随しないと AI が古いレーンを復元する。

本 runbook は **完了の儀式** と **新セッション開始時の認識突合** を機械化する。

---

## 正本の優先順位（矛盾時）

| 優先 | 正本 | 役割 |
|------|------|------|
| 1 | `data/cio-project-closures.json` | **クローズ済み**プロジェクトの機械登録 |
| 2 | `docs/reports/*-completion.md` / `SESSION-CLOSE-REPORT_*.txt` | 完了の事実・BUILD |
| 3 | `kintone-apps.md`（該当セクションの状態行） | 本番 BUILD / rev |
| 4 | `chat-sessions/checkpoint-latest.md` 先頭 | **次の1手**・凍結（**追随必須**） |
| 5 | `chat-sessions/handoff-log.md` 末尾 | 直前合意の鏡像 |
| 6 | `docs/handoff/latest-session-bridge.json` | export-handoff の機械鏡像 |

**ルール**: 1〜3 が「完了」なのに 4 が「未完了の次手」を書いていたら **4 が誤り**。浜田の口頭認識と 1〜3 が一致するなら **checkpoint を直す**（AI が古い checkpoint を正としない）。

---

## A. プロジェクト v1 完了の儀式（CIO 必須・同一セッション）

成果物デプロイ・浜田目視 OK の **締めターン**で、次を **順に** 実施する（省略禁止）。

1. **完成サマリー** — `docs/reports/YYYY-MM-DD-<project>-completion.md`（判定: v1 完成 / クローズ可）
2. **SESSION-CLOSE** — `chat-sessions/SESSION-CLOSE-REPORT_YYYYMMDD.txt`（**明日の手順は書かない** — evening-reflection-scope 準拠）
3. **closures 登録** — `data/cio-project-closures.json` に `status: closed-v1`・`forbiddenNextTaskPatterns`・`completionReport`
4. **checkpoint 先頭更新** — `**最終更新**` を当日に / `**次の1手**` を「未確定（項番 -0）」または次レーン / **クローズ済みを明記**
5. **handoff 末尾 1 ブロック** — 完了 BUILD・正本パス・「再開条件: 浜田 GO」
6. **lanes 更新** — `data/cio-project-lanes.json` の `status: closed-v1`
7. **機械検証**（すべて exit 0）:
   ```powershell
   npm run verify:kintone-project-close-gate
   npm run verify:checkpoint-project-closure
   npm run verify:session-handoff-integrity -- --strict-staleness
   npm run cio:session:close-git -- --execute --auto-stage --message "…"
   ```
   **台帳 v1 専用 checklist**: [`kintone-ledger-v1-closure-checklist.md`](kintone-ledger-v1-closure-checklist.md)（R41）  
   **Windows PowerShell 標準形**: [`windows-governance-ops.md`](windows-governance-ops.md)（R48）  
   （`close-git` 内包: R19 pre-commit → commit → **export-handoff** → pull --rebase → push → **checkpoint `**Git**` 同期（R44）** → git-warn → **desktop:sync-and-verify**）

8. **締め完了** — 上記 `close-git` exit 0 = B1/B4 + R17 Desktop 同期まで完了（GO 待ち禁止）

---

## B. 新セッション・ブリーフィング開始時（CIO 必須）

朝 ready / 項番 -0 前 / 浜田へ「次手」を述べる **前**に:

1. `npm run verify:checkpoint-project-closure` — **NG ならブリーフィングで「次手」を述べない**。先に A の 4〜7 を実施
2. **3 系統突合**（チャットに 1 行ずつ）:
   - closures: クローズ済みか
   - kintone-apps: 状態行（例: `v1 完成`）
   - checkpoint 次の1手: クローズと矛盾しないか
3. **浜田の認識と矛盾**したら **§41 一問** — 「checkpoint が古い。〇〇は v1 クローズで合っていますか？」→ OK 後 **checkpoint を先に修正**
4. **`--project` が closures 済み**なら `cio:morning:pre-implement` は **案B1/compare-83 を走らせない**（実装済み）

---

## C. 再開条件（クローズ後にまた触る場合）

1. 浜田 **GO**（口頭またはチャット明示）
2. checkpoint **次の1手** を新フェーズに更新
3. `cio-project-closures.json` から該当を **解除**または `status: reopened` に変更（理由 1 行）
4. `verify:checkpoint-project-closure` → export-handoff → desktop sync

---

## D. 4AI 分担

| 役割 | 担当 |
|------|------|
| 儀式 A の 1〜8 | **CIO**（本体） |
| 盲点（再開・scope  creep） | **DeepSeek** §50-3-8（再開 GO 前） |
| 大量 diff 再開時 | **Composer** Subagent |
| 完了判定・GO | **浜田** |
| 機械検証 | **CIO** + `verify:*`（第2者の代替にならない） |

---

## E. 関連 npm

| コマンド | タイミング |
|----------|------------|
| `verify:checkpoint-project-closure` | 朝 ready / bootstrap / 締め / ブリーフィング前 |
| `cio:session:close-recognition-gate` | セッション締め一括 |
| `cio:briefing:recognition-gate` | 浜田へ次手・レーンを述べる直前 |
| `cio:project:close -- --show` | closures 登録確認 |
| `cio:morning:ready` | 内包 verify（自動） |

---

## F. R19 — 認識同期（2026-06-13 制定）

- セッション締めで **completion + closures + checkpoint + handoff** を **同一ターン**で揃えない → **締め未完**
- ブリーフィングで checkpoint のみ読んで **kintone-apps / closures を見ない** → **報告違反**
- クローズ済み `--project` で compare-83 / 案B1 を再実行 → **禁止**（朝 ready がスキップ）

正本追記: `18-重要確認.txt` / `cio-four-ai-governance.md` / `verify:cio-project-closure-governance`
