# デバッグ知恵ナレッジベース（Kimi 自動ストック）

> **自動追記**: `npm run cio:session:export-handoff` 実行時（15ターン解体）に Kimi 職分で抽出・マージ  
> **構造**: 前提 / 手順 / 禁止 / exit（4要素必須）  
> **正本**: 第9層 — 引っ越し時デバッグ知恵自動ストック

---

---

## [2026-07-15] cio:mcp:profile — dry-run と apply 同時禁止

**前提**: Cold プロファイルを試すとき  
**手順**: `npm run cio:mcp:profile -- --profile governance --dry-run` のみ。本番は **736 後など明示 GO 後**に `--apply` 単体。  
**禁止**: `--dry-run --apply` 同時（旧実装は apply が勝ち誤本番化）。現在は **exit 2 で書込拒否**。誤適用したら即 `mcp.json.bak.<ISO>` から復元 → `cio:mcp:gate`。  
**exit**: dry-run は書込なし · 同時指定は exit 2 · disabled 一覧が空（通常運用）

---

## [2026-07-15] report-pipeline PENDING 残留 — SUPERSEDED 掃除（ops C2）

**前提**: `npm run report:pipeline-status` が `outcome: in_progress`（前回の「報告します」が未完了）のまま残っているとき  
**手順**: リポで `node --input-type=module -e "import { setOutcome } from './.cursor/hooks/report-pipeline-audit.mjs'; setOutcome('<correlationId>', 'SUPERSEDED', { reason: 'stale PENDING clear' });"` → 再実行で `SUPERSEDED` を確認。新報告ターンでは hooks が自動で前 PENDING を SUPERSEDED にする。  
**禁止**: `report-pipeline-current.json` を手で空にする／不正な SUCCESS 偽装。hooks 本体の安易な改変。  
**exit**: `npm run report:pipeline-status` が in_progress 以外（SUCCESS / SUPERSEDED / 記録なし）

---

## [2026-07-15] handoff-log / UTF-8 — PowerShell Set-Content 禁止（ops-day C1）

**前提**: `chat-sessions/handoff-log.md` ほか日本語・絵文字を含む引き継ぎ系ファイルを編集するとき  
**手順**: **Node スクリプト**（`fs.readFileSync` / `writeFileSync` · `cio:handoff:append-block` · 専用 patch スクリプト）で UTF-8 のまま更新する。Git 行の差し替えも node 固定。  
**禁止**: PowerShell `Set-Content` / `Out-File`（既定エンコーディングで **文字化け**）・雑な `-replace` 一括。壊したら **良い commit から復元**してからやり直す（上書き続き禁止）。  
**exit**: `git diff` で日本語が壊れないこと · `npm run verify:constitution-handoff`（対象時）OK

---

## [2026-07-10] kintone 新規 SUBTABLE — POST+revision 必須（GAIA_FC01 / #D1）

**前提**: preview で **新規** `SUBTABLE` / フィールドを追加するとき  
**手順**: `POST /k/v1/preview/app/form/fields.json` に `{ app, properties: { code: {...} }, revision }` — 正本 `scripts/workdays-add-fields-687.mjs`  
**禁止**: 未知 code を含む properties 全体 **PUT**（`GAIA_FC01 The field (code: wbgt_data) not found`）  
**exit**: patch 成功 → `preview/app/deploy.json` SUCCESS

---

## [2026-06-13] 業務改善 v1 クローズ — 陳腐化警告（R19 / TSB-038）

**前提**: `data/cio-project-closures.json` — business-improvement **closed-v1**（2026-06-13）
**手順**: 次手は **checkpoint 先頭** + bridge（**項番 -0 で合意**）。`cio:morning:ready -- --project business-improvement` は pre-implement **スキップ**
**禁止**: 本ファイル内 **2026-06-12 以前**の「**案B1**」「**Q-SCHED-03 を次手**」を **現行 nextTask** として引用・再開
**exit**: `npm run verify:checkpoint-project-closure` OK

---

## [2026-06-28] customize BUILD 命名 — UI-only は rev のみ（R-NAS-05）

**前提**: dash customize の `var BUILD` は kintone-apps 正本・デプロイ履歴のキー  
**手順**: **マイルストーン 1 本**（例 `2026-06-28-nas-ledger-dash-v1`）。列幅・記号・CSS 微調整は **preview revision のみ** — BUILD 名を増やさない  
**禁止**: UI 調整のたびに `-purchase-fields` 等の中間 BUILD を残す（NAS F6）  
**exit**: deploy SUCCESS + kintone-apps の BUILD 行がマイルストーン 1 本

---

## [2026-06-28] kintone DROP_DOWN 変更 → preview deploy 後 PUT（R-NAS-04 / TSB-041）

**前提**: preview API で DROP_DOWN の options を変更した直後、**deploy 前**に live `records.json` PUT  
**手順**: ① preview で fields PUT ② **`deployApp` / `npm run deploy:<id>`** ③ live PUT（records / settings）  
**禁止**: deploy 前の live PUT（CB_VA01 — NAS 748 status 変更 F4）  
**exit**: PUT 200 + 選択肢値が preview と live で一致

---

## [2026-06-22] kintone records.json POST — CB_VA01（R741 / D-741-01）

**前提**: `POST /k/v1/records.json` で 1 件追加するとき  
**手順**: body は `{ app, records: [{ field: { value } }] }` — **`record` 単体は NG**  
**禁止**: seed / add-master で `record: { ... }` パターン（680 マスタ F1）  
**exit**: `npm run verify:kintone-records-post-shape` OK

---

---

## [2026-06-23] 736 差分表示 — row_key と突合（App 736 / v2c）

**前提**: `recalcState` → `costLineFromCalcRow` が `row_key` を落とすと、差分で全行不一致（例: 削除53件）や小計行キー衝突（例: -10,750,000 誤表示）が起きる  
**手順**: ① `costLineFromCalcRow` で `row_key` 保持 ② `snapshotForDiff` でランダム UUID 付与禁止 ③ 突合は `scripts/jikkou-yosan-diff-core.mjs` の `structuralRowKey` + `pairTableRows`  
**禁止**: 差分比較前の `ensureRowKeysOnState`（比較元・現行で別 UUID になる）  
**exit**: 版2で材料1行のみ変更 → 削除0件・連携②のみ増減・⑧⑨ が ±同額

---

## [2026-07-10] 736 PH1e/PH1f — recalcState 集計コピー漏れ

**前提**: `recalcAll` で `calc` にだけセットした新フィールド（`spec_total_*` / `cost_budget_*` / `profit_budget_*`）  
**手順**: `recalcState` 内で `calc` → `state` に **同名フィールドをすべて代入**してから `renderSummary`  
**禁止**: calc だけ更新して UI が常に 0・警告非表示のまま deploy  
**exit**: 2623001 で仕様/原価の区分合計・赤警告・区分別サマリーが画面と一致

---

<!-- CIO-DEBUG-TIPS:AUTO -->
## [2026-07-18] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: exit 1 / high 5件であり、package 自動変更なし。 | npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda -->


## [2026-07-17] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: exit 1 / high 5件であり、package 自動変更なし。 | npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda -->


## [2026-07-15] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-14] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-13] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-12] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-11] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-10] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-09] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-08] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-07] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-06] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-07-05] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run verify:spec-progress-sync` → `npm run cio:session:cold-start` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run verify:spec-progress-sync` 新設（rules JSON · smoke 第17 · close-git commit  | npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`man -->


## [2026-07-04] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run session:bootstrap` → `npm run cio:session:cold-start` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run session:bootstrap` | npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`man -->


## [2026-07-03] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run pc-ledger:backfill-595-clear-retired-pc-links:apply` → `npm run mailing-list:move-space21` → `npm run cio:session:cold-start`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run pc-ledger:backfill-595-clear-retired-pc-links:apply`。メーリングリスト移設: `npm ru | npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`man -->


## [2026-07-02] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run pc-ledger:backfill-595-clear-retired-pc-links:apply` → `npm run mailing-list:move-space21` → `npm run cio:session:cold-start`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run pc-ledger:backfill-595-clear-retired-pc-links:apply`。メーリングリスト移設: `npm ru | npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / **`man -->


## [2026-07-01] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run verify:session-close-git-warn` → `npm run cio:session:cold-start` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: exit 1` — **次の1手** 1 行 | npm run verify:session-close-git-warn`** を実行し **Git 残件を 1 行報告**（項番 **3c**）。`sess | npm run cio:session:cold-start` -->


## [2026-06-30] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run verify:session-close-git-warn` → `npm run cio:session:cold-start` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: exit 1` — **次の1手** 1 行 | npm run verify:session-close-git-warn`** を実行し **Git 残件を 1 行報告**（項番 **3c**）。`sess | npm run cio:session:cold-start` -->


## [2026-06-29] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run verify:session-close-git-warn` → `npm run cio:session:cold-start` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: exit 1` ＋ **次の1手** 1 行 | npm run verify:session-close-git-warn`** を実行し **Git 残件を 1 行報告**（項目 **3c**）。`sess | npm run cio:session:cold-start` -->


## [2026-06-28] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-06-27] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-06-26] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-06-25] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:session:cold-start` → `npm run session:bootstrap` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->


## [2026-06-23] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run session:bootstrap` → `npm run cio:tool:route -- --intent "<要約>"`` → `npm run cio:session:cold-start`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run session:bootstrap`**。新規 kintone は **24-db-dash-scaffold-kernel** + `db-d | npm run cio:tool:route -- --intent "<要約>"` | npm run cio:session:cold-start` -->


## [2026-06-22] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:tool:route -- --intent "<要約>"`` → `npm run cio:session:cold-start` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:tool:route -- --intent "<要約>"` | npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda -->


## [2026-06-21] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:tool:route -- --intent "<要約>"`` → `npm run cio:session:cold-start` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:tool:route -- --intent "<要約>"` | npm run cio:session:cold-start` | npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `manda -->


## [2026-06-20] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts/tmp-*` 削除` → `npm run session:bootstrap` → `npm run cio:session:close-git`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts | npm run session:bootstrap`** — **Read より前**に `verify:constitution-handoff` → `ma | npm run cio:session:close-git` -->


## [2026-06-19] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready` → `npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts/tmp-*` 削除` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready | npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts | npm run session:bootstrap`** — **Read より前**に `verify:constitution-handoff` → `ma -->


## [2026-06-18] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts/tmp-*` 削除` → `npm run verify:checkpoint-project-closure` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts | npm run verify:checkpoint-project-closure` | npm run session:bootstrap`** — **Read より前**に `verify:constitution-handoff` → `ma -->


## [2026-06-17] 595 emp_id 空 → 714/716 POST 400（R50）

**前提**: App **714/716** の `emp_id` は必須。595 に `emp_id` 未付番の社員を dash から POST すると **400 Bad Request**
**手順**: `customize/595/desktop.js` で submit 時自動付番（`applyEmpIdOnSubmit595`）／715・717 で保存前ガード／既存は `node scripts/assign-emp-id.mjs`
**禁止**: 設計 doc のみ更新して customize 未 deploy
**exit**: 595 新規保存で `emp_id` 付与・715 新規登録が 200

## [2026-06-17] Windows live-schema UV_HANDLE_CLOSING（R53）

**前提**: Windows ネイティブ Node で `verify:kintone-live-schema` 後にプロセス異常終了することがある
**手順**: 出力が OK なら deploy 続行（**2026-07-06 GO #D-WIN-SCHEMA-01** — `cio-deploy-preflight-guard` が stdout OK を検知）。従来どおり `SKIP_CIO_LIVE_SCHEMA_GUARD=1` も可
**禁止**: 検証未実施のまま skip
**exit**: deploy 成功 + kintone-apps BUILD 行更新

## [2026-06-17] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run desktop:sync-and-verify` → `npm run cio:morning:ready` → `npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts/tmp-*` 削除`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run desktop:sync-and-verify` | npm run cio:morning:ready | npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts -->

## [2026-06-16] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run desktop:sync-and-verify` → `npm run cio:morning:ready` → `npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts/tmp-*` 削除`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run desktop:sync-and-verify` | npm run cio:morning:ready | npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts -->

## [2026-06-15] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run desktop:sync-and-verify` → `npm run cio:morning:ready` → `npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts/tmp-*` 削除`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run desktop:sync-and-verify`（checkpoint 更新後） | npm run desktop:sync-and-verify` | npm run cio:morning:ready -->

## [2026-06-14] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run desktop:sync-and-verify` → `npm run cio:morning:ready` → `npm run cio:repo:purge-temp -- --apply` — 一時 data / pending proposals / `scripts/tmp-*` 削除`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run desktop:sync-and-verify`（checkpoint 更新後） | npm run desktop:sync-and-verify` | npm run cio:morning:ready -->


## [2026-06-13] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run desktop:sync-and-verify` → `npm run verify:checkpoint-project-closure` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run desktop:sync-and-verify`（checkpoint 更新後） | npm run desktop:sync-and-verify` | npm run verify:checkpoint-project-closure` -->


## [2026-06-12] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run desktop:sync-and-verify` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run desktop:sync-and-verify` — 28 番 map 含む全 mirror 更新 | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->

## [2026-06-11] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run desktop:sync-and-verify` → `npm run session:bootstrap` → `npm run verify:session-handoff-integrity -- --import` 推奨。`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run desktop:sync-and-verify` — 28 番 map 含む全 mirror 更新 | npm run session:bootstrap`** — **Read より前**に `verify:constitution-handoff` → `ma | npm run verify:session-handoff-integrity -- --import` 推奨。 -->

## [2026-06-11] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run deploy:699` → `npm run desktop:sync-and-verify` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run deploy:699` → 実機確認 | npm run desktop:sync-and-verify` — 28 番 map 含む全 mirror 更新 | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->

## [2026-06-10] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready -- --project business-improvement` → `npm run deploy:699` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready -- --project business-improvement | npm run deploy:699` → 実機確認 | npm run deploy:699` → kintone 実機 Ctrl+F5 -->

## [2026-06-09] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready -- --project business-improvement` → `npm run deploy:699` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready -- --project business-improvement | npm run deploy:699` → 実機確認 | npm run deploy:699` → kintone 実機 Ctrl+F5 -->

## [2026-06-08] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready -- --project business-improvement` → `npm run deploy:699` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready -- --project business-improvement | npm run deploy:699` → 実機確認 | npm run deploy:699` → kintone 実機 Ctrl+F5 -->

## [2026-06-08] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready -- --project business-improvement` → `npm run deploy:699` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready -- --project business-improvement | npm run deploy:699` → 実機確認 | npm run deploy:699` → kintone 実機 Ctrl+F5 -->

## [2026-06-07] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready -- --project business-improvement` → `npm run deploy:699` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready -- --project business-improvement | npm run deploy:699` → 実機確認 | npm run deploy:699` → kintone 実機 Ctrl+F5 -->

## [2026-06-07] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready -- --project business-improvement` → `npm run deploy:699` → `npm run session:bootstrap`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready -- --project business-improvement | npm run deploy:699` → 実機確認 | npm run deploy:699` → kintone 実機 Ctrl+F5 -->

## [2026-06-07] 業務改善 — applyDraft / beforeunload / branch_delegate

**前提**: 700 申請UIはカスタム DOM。入力のたび `kintone.app.record.set()` すると標準フォームが dirty になり、REST 申請後のガイド遷移で「変更内容が保存されない可能性があります」が出る。評価UIは v30 で evalDraft 済みだったが申請UIは v33 まで未対応。
**手順**: `ui.applyDraftRec = cloneKintoneRec(getRec())` → `patchRec` / 社員検索 / 添付は draft のみ更新。申請時は `getApplyWorkingRec()` → REST PUT/POST。一時保存のみ `pushApplyDraftToForm()`。`branch_delegate` は起動時にフィールド型取得 — CHECK_BOX は空配列を送らない、DROP_DOWN は空文字。
**禁止**: 申請入力中の `setRec()`（下書き保存ボタン以外）。branch_delegate を `{ value: [] }` で CHECK_BOX 形式 PUT（`CB_IJ01` 400）。
**exit**: BUILD `2026-06-07-bi-proposal-apply-v33` でアイデア/業務改善申請→699 遷移に beforeunload なし。支店長判断 OK。

<!-- errors: CB_IJ01 Invalid JSON string (branch_delegate empty array) | beforeunload on guide navigate (apply setRec) -->


**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready -- --project business-improvement` → `npm run cio:morning:ready -- --project business-improvement` → 浜田 **実装OK** → 案B1 着手` → `npm run cio:morning:ready -- --project business-improvement` → **実装OK** → 案B1 |`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready -- --project business-improvement | npm run cio:morning:ready -- --project business-improvement` → 浜田 **実装OK** → 案B1 | npm run cio:morning:ready -- --project business-improvement` → **実装OK** → 案B1 | -->

## [2026-06-06] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready -- --project business-improvement` → `npm run verify:cio-env-upgrade` → `npm run doc-lane:security-report`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready -- --project business-improvement | npm run verify:cio-env-upgrade` ✅ | | npm run doc-lane:security-report` / `scripts/lib/docx_template_format.py` | -->

## [2026-06-06] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run cio:morning:ready -- --project business-improvement` → `npm run verify:cio-env-upgrade` → `npm run doc-lane:security-report`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run cio:morning:ready -- --project business-improvement | npm run verify:cio-env-upgrade` ✅ | | npm run doc-lane:security-report` / `scripts/lib/docx_template_format.py` | -->

## [2026-06-06] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run doc-lane:verify-v5-ch3-refs` → `npm run doc-lane:patch-v5-a3` → `npm run verify:cio-env-upgrade`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run doc-lane:verify-v5-ch3-refs`）+ `add_reading_guide.py` 修正。v5 読み方1行は **Wor | npm run doc-lane:patch-v5-a3`・`cio:doc-lane-gate` ラベル更新。 | npm run verify:cio-env-upgrade` ✅ | -->

## [2026-06-06] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run doc-lane:verify-v5-ch3-refs` → `npm run doc-lane:patch-v5-a3` → `npm run cio:morning:pre-implement -- --project business-improvement` → 浜田 **実装OK** → 案B1 着手`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run doc-lane:verify-v5-ch3-refs`）+ `add_reading_guide.py` 修正。v5 読み方1行は **Wor | npm run doc-lane:patch-v5-a3`・`cio:doc-lane-gate` ラベル更新。 | npm run cio:morning:pre-implement -- --project business-improvement` → 浜田 **実装OK -->

## [2026-06-06] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run doc-lane:verify-v5-ch3-refs` → `npm run doc-lane:patch-v5-a3` → `npm run doc-lane:security-report`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run doc-lane:verify-v5-ch3-refs`）+ `add_reading_guide.py` 修正。v5 読み方1行は **Wor | npm run doc-lane:patch-v5-a3`・`cio:doc-lane-gate` ラベル更新。 | npm run doc-lane:security-report` / `scripts/lib/docx_template_format.py` | -->

## [2026-06-06] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run doc-lane:verify-v5-ch3-refs` → `npm run doc-lane:patch-v5-a3` → `npm run doc-lane:security-report`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run doc-lane:verify-v5-ch3-refs`）+ `add_reading_guide.py` 修正。v5 読み方1行は **Wor | npm run doc-lane:patch-v5-a3`・`cio:doc-lane-gate` ラベル更新。 | npm run doc-lane:security-report` / `scripts/lib/docx_template_format.py` | -->

## [2026-06-06] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run doc-lane:verify-v5-ch3-refs` → `npm run doc-lane:patch-v5-a3` → `npm run doc-lane:security-report`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run doc-lane:verify-v5-ch3-refs`）+ `add_reading_guide.py` 修正。v5 読み方1行は **Wor | npm run doc-lane:patch-v5-a3`・`cio:doc-lane-gate` ラベル更新。 | npm run doc-lane:security-report` / `scripts/lib/docx_template_format.py` | -->

## [2026-06-06] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run doc-lane:verify-v5-ch3-refs` → `npm run doc-lane:patch-v5-a3` → `npm run doc-lane:security-report`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run doc-lane:verify-v5-ch3-refs`）+ `add_reading_guide.py` 修正。v5 読み方1行は **Wor | npm run doc-lane:patch-v5-a3`・`cio:doc-lane-gate` ラベル更新。 | npm run doc-lane:security-report` / `scripts/lib/docx_template_format.py` | -->

## [2026-05-31] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run session-starter:sync-desktop` → `npm run cio:session:export-handoff` → `npm run desktop:sync-and-verify`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run session-starter:sync-desktop` + verify 済。旧 `19-SESSION-ONE-REPORT-2026-0 | npm run cio:session:export-handoff` → `npm run desktop:sync-and-verify` | npm run guard:mirror`** で emergency-backup を最新化する -->

## [2026-05-31] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run session-starter:sync-desktop` → `npm run guard:mirror` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run session-starter:sync-desktop` + verify 済。旧 `19-SESSION-ONE-REPORT-2026-0 | npm run guard:mirror`** で emergency-backup を最新化する | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->

## [2026-05-31] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run session-starter:sync-desktop` → `npm run guard:mirror` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run session-starter:sync-desktop` + verify 済。旧 `19-SESSION-ONE-REPORT-2026-0 | npm run guard:mirror`** で emergency-backup を最新化する | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->

## [2026-05-31] セッション解体時知恵ストック

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run session-starter:sync-desktop` → `npm run guard:mirror` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run session-starter:sync-desktop` + verify 済。旧 `19-SESSION-ONE-REPORT-2026-0 | npm run guard:mirror`** で emergency-backup を最新化する | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit -->

