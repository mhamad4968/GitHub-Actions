# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-19 JST — **SKYSEA現況突合・ライセンス確認完了**

**Git**: **`3d888c81`** = `origin/main` — push 済

**本日状態**: SKYSEA全件ExcelとApp 674をPC名・利用者で読取突合し、名称修正・旧PC削除を浜田が整理。管理画面ライブ値はライセンス171/301、Windows164。利用中・個人266台、未導入候補117台、全台導入後は保守的に288/301・残13。羽柴さん2台目 `KS0248-202305` はSKYSEA導入済み・App 674登録待ち。

**次の1手**: **2026-07-19夜、システム推進室向け各自タスク管理kintoneアプリの要件ヒアリング**。アプリ作成は2026-07-20。SKYSEAは8月本格着手だが、8/3問い合わせ・回答前の実PC配信禁止を維持。

**GO待ち**: H9 / △2 最終判定は **2026-07-25 のみ**（本日は判定不可）。夕反省 #S1〜#S3/#R1〜#R2 は承認・反映済み。

**観測期間**: ~~憲法 Round-3 · rules-opt §18~~ **CLOSED 2026-07-15**。**H9/△2**: metricsEligibleAfter=**2026-07-18** · reviewDate=**2026-07-25** · early GREEN/降格 **禁止**（ops lock 2026-07-15）

**運用メモ**: **経営会議資料 2026年7月度 — 完了**（浜田 2026-07-15 確認 · DOCX mtime 2026-07-12 · 対象=6月セキュリティレポート）。正本 `C:\tmp\資料作成\【2026年7月度経営会議資料】2026年06月情報セキュリティレポート.docx`。**次月まで新規作成不要**。フロー維持: MCP `shiryo-sakusei` ready · `mcp/shiryo-sakusei-mcp/SPEC.md` · 依頼書 `docs/依頼書テンプレート.txt`

**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` · **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md` · **クローズ正本**: `data/cio-project-closures.json`

**688 本番**: BUILD=`2026-07-13-688-heat-closed` rev **90** — 気象ヘルプ・猛暑日オプション折りたたみ · 浜田目視 OK（GHA push 後 rev90 記録）

**674 本番**: BUILD=`2026-07-17-674-note-search-checkbox` rev **262** — Excel 出力復旧（SheetJS bundle）· 明示チェックボックスによる備考あり全件／キーワード検索 · 浜田目視 OK

**699 本番**: BUILD=`2026-07-17-manual-evaluation-email` rev **132** — 現行挙動に整合したマニュアル · 未評価件数付き評価者アクション · 空の「その他」非表示

**700 本番**: BUILD=`2026-07-17-hide-wf-test-dept` rev **170** — 提案件名 · 3段階通知 · 汎用 Assignee 通知なし · 定期リマインドなし · WF テスト部署 admin 限定

**736 本番**: BUILD=`2026-07-12-736-ui-backlog-02-col-resize` rev **186** — 現行版を保持。ver.02 は依頼者 Excel 受領後に再設計し、本日は実装・deploy なし。
**746/747 本番**: DBフォーム rev **8** / Dash BUILD=`2026-07-18-jre-chub-account-dash-v8-edge-autofill-fix` rev **14** — 署名代行対象・利用再開・湾岸工事所・Edge旅券情報保存の誤認抑止。**浜田目視 OK（2026-07-18）**。

## クローズ済み（`data/cio-project-closures.json` — 9件）

業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**

## 保留・その他の制約

| 状態 | 内容 |
|------|------|
| **688** | WBGT UI 折りたたみ完了（rev90）· **それ以外触らない** |
| **677–679** | 触らない |
| **SKYSEA** | 7/19 現況突合完了（plan §11）· live 171/301、Windows164 · App 674個人266、未導入候補117 · 全台後288/301（残13）· 8/3 SKY社問い合わせ · 8月本格着手 · 回答前の実PC配信禁止 |
| **736** | 現行版を保持 · ver.02 は依頼者 Excel 受領後に再設計 · 本日実装/deploy なし |
| **712** | 削除済 — deploy 禁止 |

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`

## 2026-07-19 本日完了サマリー

| 項目 | 内容 |
|------|------|
| **SKYSEA突合** | `C:\tmp\Skysea` の全件ExcelとApp 674を読取突合。個人/共有・サーバーを分離し、名称不一致・旧PC・台帳未登録を浜田確認で整理 |
| **PC台帳** | 利用中・個人266台。2台持ちもPCレコード単位ですべて導入対象。羽柴さん2台目は今後登録し267台想定 |
| **ライセンス** | 管理画面171/301、Windows164。未導入候補117台を全台追加して288/301、残13の保守的見込み |
| **成果物** | `C:\tmp\Skysea\SKYSEA-PC台帳突合_20260719_ライセンス確認済.xlsx`（元Excel・kintoneはAIから更新なし） |
| **次案件** | 7/19夜にシステム推進室タスク管理kintoneアプリをヒアリング、7/20に設計・作成・テスト |

## 2026-07-18 本日完了サマリー

| 項目 | 内容 |
|------|------|
| **RAG** | 正本ミラー drift 修復 · staged pre-commit + GitHub Actionsゲート追加 |
| **kintone棚卸** | AIチーム管理75 IDだけを月次監査 · 現役63/63・削除済み12/12でOK · 一般部門アプリは比較対象外 |
| **旧アプリ** | 594/626/627/638/639/651/652/653/667/668/681/712のlive不在を正本化 · 主要deploy経路へ安全栓 |
| **SKYSEA** | 前段90項目をplan §11へ確定 · 8/3問い合わせ · 9月段階展開 · 10/30完了目標 · 実装は8月GO後 |
| **GitHub** | Actions主要ゲート成功 · mainはlinear/force-push禁止/deletion禁止 · required checksは互換性評価済み、現行direct-push締め維持のため設定変更なし |
| **夕反省** | F1〜F5を記録 · 改善案#S1〜#S3/#R1〜#R2は浜田承認・反映済み |


## 2026-07-17 本日完了サマリー

| 項目 | 内容 |
|------|------|
| **App 674** | Excel 出力と備考検索を修正 · 浜田目視 OK |
| **App 699** | マニュアルを現行 apply/list/evaluation/notification 挙動へ整合 · rev 132 |
| **App 700** | 通知明確化 · WF テスト部署 admin 限定 · rev 170 |
| **業務改善** | Apps 697/698/699/700/713 のシステム側運用準備 OK · 正本群と closure ledger 同期 |
| **承認済み改善** | evening help 無副作用化 · readiness正本照合 · verifier準拠report draft生成を実装・回帰検証 |
| **GitHub/health** | Actions 最新10件 success · PR 0 · issue 0 · health score 100% |
| **依存関係** | npm audit high 5件を既知リスクとして記録 · package 変更なし |



## 2026-07-15 本日完了サマリー（ops）

| 項目 | 内容 |
|------|------|
| **憲法/rules-opt** | 正式クローズ済 · H9/△2 は 7/25（early GREEN 禁止） |
| **MCP** | mintlify DEL追認 · cyber-news DEL-2 正式クローズ · 再注入ガード |
| **F1/A6** | dormant false-positive 修正 · R44 Git 同期 |
| **△18** | profile --dry-run/--apply 同時禁止（仕様 v3.2） |
| **Cold誤適用** | bak復元済 · disabled=0 · gate 6/6 |



<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-07-18.md -->
