# 復元チェックポイント（最新）
<!-- 正本と矛盾したら正本を優先し、このファイルを更新すること。 -->
<!-- **案件 CLOSED** ≠ **セッション締め**。混同禁止 -->
**最終更新**: 2026-07-21 JST — **WAKE・ブリーフィング（New Chat）**。00〜36通読・health100%・MCP26/probe6/6・GHA success。web stale を再起動＋cold-start Phase6c／killWebOrphan 恒久化。Ver.02 仕様 CLOSED・依頼者回答待ち。実装は GO 後。

**Git**: **`bf1d262a`** = `origin/main` — push 済

**本日状態**: Ver.02 **総括・内訳・予実・版管理すべて CLOSED**（§7–§10・§21）。§7.1c 行操作帯ガード。依頼者へ確認メール送付済（R-*/RY-*・名称規格／取引先リスト＝R-19/20）。実装/deploy/App作成は浜田GO後。現行736 rev186 不変。SKYSEAは8/3問い合わせまで実装・GPO・本番配信なし。

**次の1手**: **浜田の指示待ち**（当日 -0）。候補のみ: 依頼者回答の取り込み／仕様再確認／実装可否の検討。実装着手は GO 後。

**GO待ち**: H9 / △2 最終判定は **2026-07-25 のみ**（本日は判定不可）。Ver.02 実装 GO は別途。夕反省 #R-SPEC-01 / #R-REQ-01 / #S-MCP-01 / #D-CLOSE-01 は **全部承認・反映済**（2026-07-20）。

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
| **736** | 現行版 rev186 保持 · Ver.02 Excel 受領済 · **総括+内訳+予実+版管理仕様 CLOSED** · 依頼者回答待ち · 実装/deploy は GO 後 |
| **712** | 削除済 — deploy 禁止 |

## セッション切替後の自律復元（Lifecycle v2 鏡像）

**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`

## 2026-07-20 昼完了サマリー（内訳）

| 項目 | 内容 |
|------|------|
| **内訳仕様** | U1–U30 / §8.5–8.6 CLOSED。スキャン `docs/plans/2026-07-20-jikkou-list-source-scan.md` |
| **要点** | №左・区分（取引先左）・データマスタ J/H/C・コンボ＋将来リスト・フルフッタ・小計/計・保存時クリーンアップ・3色全体 |
| **残置** | R-11/12/13（依頼者）。実装 GO なし |
| **次** | 依頼者回答待ち／仕様再確認（浜田 -0） |


## 2026-07-20 夜完了サマリー（予実・版管理・締め）

| 項目 | 内容 |
|------|------|
| **予実** | Y1–Y11 CLOSED。§9.0c RY・Excel突合 |
| **版管理** | V1–V13 CLOSED（AI無条件合意）。§10.0k |
| **行操作** | §7.1c 帯ガード CONFIRMED |
| **依頼者** | 確認メール送付済（回答待ち）。R-19/20 リスト整備含む |
| **夕反省** | `docs/reports/2026-07-20-evening-reflection.md` · 改善4件は承認待ち |



## 2026-07-19 本日完了サマリー

| 項目 | 内容 |
|------|------|
| **SKYSEA突合** | `C:\tmp\Skysea` の全件ExcelとApp 674を読取突合。個人/共有・サーバーを分離し、名称不一致・旧PC・台帳未登録を浜田確認で整理 |
| **PC台帳** | 利用中・個人266台。2台持ちもPCレコード単位ですべて導入対象。羽柴さん2台目は今後登録し267台想定 |
| **ライセンス** | 管理画面171/301、Windows164。未導入候補117台を全台追加して288/301、残13の保守的見込み |
| **成果物** | `C:\tmp\Skysea\SKYSEA-PC台帳突合_20260719_ライセンス確認済.xlsx`（元Excel・kintoneはAIから更新なし） |
| **次案件** | タスク管理アプリ案は取消。App 736 Ver.02 は受領Excel×現行Ver.01突合で仕様一問確定（実装は浜田GO後） |




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-07-20.md -->
