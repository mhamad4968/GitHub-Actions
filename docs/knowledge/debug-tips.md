# デバッグ知恵ナレッジベース（Kimi 自動ストック）

> **自動追記**: `npm run cio:session:export-handoff` 実行時（15ターン解体）に Kimi 職分で抽出・マージ  
> **構造**: 前提 / 手順 / 禁止 / exit（4要素必須）  
> **正本**: 第9層 — 引っ越し時デバッグ知恵自動ストック

---

<!-- CIO-DEBUG-TIPS:AUTO -->
## [2026-05-30] npm run session-starter:sync-desktop` + verify 済。旧 `19-SESSI

**前提**: 15ターン解体 export-handoff 時点の handoff-log / checkpoint / bug-latest / logs から Kimi 職分で自動抽出
**手順**: `npm run session-starter:sync-desktop` → `npm run guard:mirror` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-verify-response`＝`--require-ceo-block` `--strict-head` `--require-v2` `--require-a1` 既定）。実装: `scripts/cio-chat-report-selfcheck.mjs`。\r\n2. CIO 体制で取り組む\r\n本体単独完結 = 憲法違反（CEO 検収は第2者の代替にならない）\r\nDeepSeek / Kimi / OpenRouter のいずれかを 着手前に呼ぶ（事後監査は次善策）\r\nスキップ理由は 具体的に書く（「軽微」「minor」は実質空＝ hooks が warn 記録）\r\n3. 2 名以上のチェックを必ず行う（基本）\r\n仕様意味に触れる編集（customize/**／SPEC.md／ヒューリスティック JS+Py／本番 PUT）は 本体＋第2者 が下限\r\nSPEC_TOUCHED: yes のターンで SECOND_REVIEWER: deepseek|kimi|openrouter のいずれか必須\r\n該当外（純メタ・雑談）は SPEC_TOUCHED: no ＋ none(reason=純メタ) で OK\r\n・**適用範囲（CEO／2026-05-09）**: 上記 **CEO 最低基準ブロックの全行**は **すべての CIO 応答に含める条件**であ"` → `npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-verify-response`＝`--require-ceo-block` `--strict-head` `--require-v2` `--require-a1` 既定）。実装: `scripts/cio-chat-report-selfcheck.mjs`。\n2. CIO 体制で取り組む\n本体単独完結 = 憲法違反（CEO 検収は第2者の代替にならない）\nDeepSeek / Kimi / OpenRouter のいずれかを 着手前に呼ぶ（事後監査は次善策）\nスキップ理由は 具体的に書く（「軽微」「minor」は実質空＝ hooks が warn 記録）\n3. 2 名以上のチェックを必ず行う（基本）\n仕様意味に触れる編集（customize/**／SPEC.md／ヒューリスティック JS+Py／本番 PUT）は 本体＋第2者 が下限\nSPEC_TOUCHED: yes のターンで SEC"`
**禁止**: customize/deploy 凍結中の無断 save・上位憲法 §50-3-11 非置換違反・本体単独完結
**exit**: npm run verify:cio-mcp-registry && verify:cio-env-integrity exit 0 を最低合格線

<!-- errors: npm run session-starter:sync-desktop` + verify 済。旧 `19-SESSION-ONE-REPORT-2026-05-27.md` は archive へ退避。 | npm run guard:mirror`** で emergency-backup を最新化する | npm run cio:report-verify-response -- --file <下書き>`**（または `--stdin`）を **実行し exit 0 を確認**する（`package.json` の `cio:report-verify-response`＝`--require-ceo-block` `--strict-head` `--require-v2` `--require -->

