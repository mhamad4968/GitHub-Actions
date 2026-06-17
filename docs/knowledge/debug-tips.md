# デバッグ知恵ナレッジベース（Kimi 自動ストック）

> **自動追記**: `npm run cio:session:export-handoff` 実行時（15ターン解体）に Kimi 職分で抽出・マージ  
> **構造**: 前提 / 手順 / 禁止 / exit（4要素必須）  
> **正本**: 第9層 — 引っ越し時デバッグ知恵自動ストック

---

## [2026-06-13] 業務改善 v1 クローズ — 陳腐化警告（R19 / TSB-038）

**前提**: `data/cio-project-closures.json` — business-improvement **closed-v1**（2026-06-13）
**手順**: 次手は **checkpoint 先頭** + bridge（**項番 -0 で合意**）。`cio:morning:ready -- --project business-improvement` は pre-implement **スキップ**
**禁止**: 本ファイル内 **2026-06-12 以前**の「**案B1**」「**Q-SCHED-03 を次手**」を **現行 nextTask** として引用・再開
**exit**: `npm run verify:checkpoint-project-closure` OK

---

<!-- CIO-DEBUG-TIPS:AUTO -->
## [2026-06-17] 595 emp_id 空 → 714/716 POST 400（R50）

**前提**: App **714/716** の `emp_id` は必須。595 に `emp_id` 未付番の社員を dash から POST すると **400 Bad Request**
**手順**: `customize/595/desktop.js` で submit 時自動付番（`applyEmpIdOnSubmit595`）／715・717 で保存前ガード／既存は `node scripts/assign-emp-id.mjs`
**禁止**: 設計 doc のみ更新して customize 未 deploy
**exit**: 595 新規保存で `emp_id` 付与・715 新規登録が 200

## [2026-06-17] Windows live-schema UV_HANDLE_CLOSING（R53）

**前提**: Windows ネイティブ Node で `verify:kintone-live-schema` 後にプロセス異常終了することがある
**手順**: 出力が OK なら `SKIP_CIO_LIVE_SCHEMA_GUARD=1` で deploy（`docs/runbooks/windows-governance-ops.md`）
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

