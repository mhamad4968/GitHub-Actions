# 2026-06-17 — AI 失敗とルール更新案（承認待ち）

> **スコープ**: `docs/runbooks/evening-reflection-scope.md`（AI 失敗 + **ミス削減**アップデート案のみ）

---

## AI の失敗

| # | 失敗 | 同日対応 |
|---|------|----------|
| F1 | 595 保存後に **削除済み App 627** へ REST 連携 → 保存後アラート | 627 呼び出し削除・674/714/716 のみに修正 deploy rev **92** |
| F2 | 595 に **emp_id 自動付番**が customize 未実装 → 714 POST **400** | `applyEmpIdOnSubmit595` 追加 + 既存7件バックフィル deploy rev **93** |
| F3 | 715 利用者チップが **全社員分**表示（40名超） | 社員検索絞り込み UI に変更 deploy rev **13** |
| F4 | 717 も同様の利用者チップ UX | 715 同型に揃え deploy rev **8** |
| F5 | PCキッティング **UTF-8 BOM なし**配布 → PS 5.1 構文解析連鎖エラー | `kitting-run.ps1` 追加・START.bat 経由・`add-bom.ps1` 強化 |
| F6 | `templates/pc-kitting` に **（新）キッティングセット無し** → 運用混乱 | README 明記済。USB 資産はリポ外である旨を handoff に追記 |
| F7 | Windows で `verify:kintone-live-schema` 後 **UV_HANDLE_CLOSING** クラッシュ | deploy 時 `SKIP_CIO_LIVE_SCHEMA_GUARD=1` で回避（根本原因未潰し） |
| F8 | 本日分 kintone 修正が **main 未コミット**のままセッション締め | 翌セッションで `cio:session:close-git` 要 |

---

## ルール更新案 — **浜田 GO 済（2026-06-17 夜）**

| ID | 概要 | 実装 |
|----|------|------|
| **R49** | kintone アプリ削除時 downstream/registry チェックリスト | `docs/runbooks/kintone-app-retire-checklist.md` |
| **R50** | 595 emp_id customize 必須 + dash POST 400 ガード | `docs/emp-id-js-account-design.md` §2 |
| **R51** | 台帳 dash 利用者 UI — 社員検索絞り込み SPEC 標準 | software / storage-media ledger spec §9 |
| **R52** | PCキッティング BOM + kitting-run 配布 runbook | `docs/runbooks/pc-kitting-deploy.md` |
| **R53** | Windows live-schema UV クラッシュ回避 | `docs/runbooks/windows-governance-ops.md` |
| **R54** | 締め時 deploy 済み未コミットを 19 レポート必須 | `20-SESSION-REPORT-CHECKLIST.txt` |

正本: `docs/approved-changes/2026-06-17-rules-r49-r54-hamada-go.md`

---

## 意図的に書かないもの

- 明日の PCキッティング試験手順の詳細
- 次レーン・第1手の宣言
