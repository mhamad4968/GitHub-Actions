[§1-2-3 ティア判定: L2] 756統括3点を実装し LIVE deploy まで完了した報告
【適用憲法】AGENTS.md §35-7 preflight→deploy / every-turn-rules-confirm.mdc §1・§M-2 / 2026-09-05 統括正本 / G0ロック（736・予実作り直し・688非WBGT不触）
[🎖️ 本セッション割当] CIO=Opus4.8 | Composer=実装 | DeepSeek=§50-3-8 | Kimi=review
[ルール確認] data/cio-rule-entry-points.json E1 / chat-sessions/constitution-first-read-pack/00-ORDER.txt / 01-report-gate.txt / 02-cio-second-reviewer.txt / 03-minimum-m-baseline.txt / 04-hooks-pipeline.txt / 05-full-refs.txt / 06-abcd-v2-runbooks.txt / chat-sessions/checkpoint-latest.md / chat-sessions/session-starter-parts/part-A-constitution-kernel.md / chat-sessions/desktop-ai-emergency-read-pack/18-重要確認.txt / docs/session-report-checklist.md / .cursor/rules/every-turn-rules-confirm.mdc / docs/plans/2026-09-05-jikkou-yosan-v2-summary-tonight-decisions.md / MCP定義検証: OK active=22 disabled=0｜ragPath=OK｜チャット経路=Cursor MCP（CLI未疎通）

実装は段階どおり最後まで進め、LIVE に載せました。以降の確認は浜田が1項目ずつで大丈夫です。

**LIVE 756** BUILD `2026-09-06-ver02-summary-split-13col` rev **344** / fileKey `8e3f3f44-f869-40c3-a2f0-badce2323e4a`
**756 form** サブテーブル3列（会社名・氏名・原価行キー）を preview POST のあと form deploy（rev 342→343→JS 344）
**757** customize は未 deploy。内訳10800の明細2件だけ UPDATE（#348 種別、#631 費目）

入ったもの:
1. 総括原価行はブロック1行ではなく、費目×種別×会社×氏名で分割。施工だけ諸経費・法定福利を別行。ジャンプはこれまでどおりブロックID。備考は `summary_row_key`
2. 13列（種別・材料・会社名・氏名は自動。備考だけ入力）。印刷も同じ表
3. 給与 名称=T11 / 氏名=U32 の listOnly。空白警告は停止。リスト外の既存値は残す
4. 10800 費目「仮設機械経費」＋種別「仮設材･鉄道器材レンタル」（システム工種名「鎌ヶ谷資材使用料」は維持）
5. 請負・①⑧⑨・予実タブは触っていない

テスト: `scripts/lib/jikkou-yosan-v2/*.test.mjs` 258件中 256 pass。残2は phase2 の単位カタログ（COMMON_UNITS と JSON の短い単位列）で、今回の3フィールド追加とは無関係。UI smoke / chrome-css / deploy ゲートは通過。

[§50-3-8] 実施済: deepseek（GO。空セル「－」と給与旧動作フラグはCIO拒否済みのまま）
Kimi: #M1 404のため本ターンの長文レビューは未実施（DeepSeekで代替）

Git: R63 の customize + kintone-apps.md + cio-live-builds は **未コミット**（浜田が commit と言ったら切る）。エディタ分割の `8bfc33a7` も未 push。

目視は1個ずつ:
1. 総括「原価行」が内訳の費目・種別で複数行に割れているか。同じブロックの№ジャンプ
2. 会社名・氏名列が出て、氏名は労務系だけ値があるか
3. 備考を書いて一時保存→再表示で同じ行に残るか
4. 給与の名称・氏名が▼選択か。空白警告が出ないか
5. 内訳10800の費目／種別が仮設機械経費／仮設材･鉄道器材レンタルか
6. 印刷に13列（会社・氏名含む）が出るか
7. ①⑧⑨と請負が以前と同じか

□ A 先頭4行（every-turn §1 と同一ラベル）
□ A1 ダブルチェック（誰と・結果）着手前 DeepSeek GO・検証締め DeepSeek GO。Kimiは404で未実施
ダブルチェック要約: DeepSeek 着手前GO、検証締めもGO。Kimiは§50-3-8スキップ理由 #M1 404
□ A2 行動前 §1b: G0ロック範囲を守り 756/757データのみ。方針は統括正本3点を最後まで実装
□ A3 複数回自己見直し
【見直し1】deploy SUCCESS・10800 PUT 2/2・フィールド form SUCCESS と本文の BUILD/rev が一致
【見直し2】§1四行・V2七行・□A1・DeepSeek行を確認
【見直し3】不可逆は form deploy と JS deploy と App2 PUT。CEO検収は目視7項。再発条件は R63 未コミットのまま次アプリへ進まないこと
□ B [仕様状態: 今夜正本どおり実装済] [検証2者: 本体+DeepSeek]
□ C [§50-3-8] 実施済: deepseek
□ D kintone 破壊級: フィールド dry-run→apply、10800 dry-run（2件）→apply。GOは前ターンの「最後まで実装」
□ E〜I （該当なし: 締め・Desktop整理・不可逆削除なし）
□ R54 deploy 済み未コミット: 756 BUILD 2026-09-06-ver02-summary-split-13col rev344
□ R63 deploy → 即 commit: 未実施（本ターンは報告のみ。commit は浜田指示待ち）
□ R68 （該当なし: 所属・拠点並び）

【セッション報告チェックシート】
CHECKSHEET_VERSION: 2
CHECKSHEET_OK: yes
SECOND_REVIEWER: deepseek
SPEC_TOUCHED: yes
DESTRUCTIVE_OPS: kintone-PUT(2), form-deploy:756(1), deploy:756(1)
DRY_RUN_TO_APPLY_GAP: >=1-turn
