# 復元チェックポイント（最新）
**最終更新**: 2026-08-15 09:30 JST — 朝セッション締め（715 目視OK）。
**次の1手**: 項番 -0（夜は別アプリ改善。715は完了・再着手しない）。
**レーン変更**: 715 ソフトウエア台帳（完了） → 夜は別アプリ（浜田指示）
**Git**: **`5a822ab9`** = `origin/main` — push 済
**closeStatus**: closed
**8月レーン**: ①依頼効率化v0.2済 / ②MCP月次+DEL-3済 / **V2-N完了通知=実装済** / ③薄い統合Desktop37済 / ④B-MDFLOW薄い済 / 経営会議ネタレーン確定＋**8月度レポート本体=完了**
**制約**: 閉済9件／688 heat外／677–679／712 deploy／736触らない／新アプリ=相談・GO後のみ／**SKYSEA=案件外**／所属正本680は今後改修時のみ
**本日状態**: 08-15 朝締め。夜は別アプリ。day-closeしない。
### 本日アクティブ（BUILD/rev — 2026-08-15）
| App | BUILD | rev |
|-----|-------|-----|
| **715** | `2026-08-15-715-list-dept-680-sync` | **24** |
| **714** | `2026-06-14-software-ledger-db-block-ui-mutations` | **5** |
| **674** | `2026-08-13-674-inventory-hist-type` | **328** |
| **694** | `2026-08-11-694-edit-kind-row-inline` | **24** |
**715 live fileKey**: `c196e66a-51bb-4798-bde3-115cb6b13266`
**継続メモ**: 715 目視OK完了。714は閲覧のみ。所属は680を今後活用（動いている他アプリは触らない）。
**GO待ち**: 新アプリ＝相談・GO後のみ。夜の対象アプリは浜田指示。
**調査正本**: `docs/plans/2026-06-13-software-ledger-kintone-spec.md`
**運用**: 品質ゲート · Lifecycle v2 · closures=9 · 688 heat外 · 736触らない · 712 deploy禁止 · `verify:retired-app-refs`
## クローズ済み（`data/cio-project-closures.json` — 9件）
業務改善697–713 / Wi-Fi718–719 / JR iPad720–721 / VPN733–734 / トータルネット737–738 / 複合機741–742 / **NAS748–749** / **ML750–751** / **Kintoneアカウント752–753** — **closed-v1**
## 保留・その他の制約
| 状態 | 内容 |
|------|------|
| **688** | WBGT 以外触らない |
| **677–679** | 触らない |
| **SKYSEA** | **案件外**（2026-08-10）— 手動インストール。kintone登録は浜田指示時のみ |
| **736** | 現行版保持・触らない |
| **756/757/758** | LIVE rev318 · MANUAL_ONLY |
| **712** | 削除済 — deploy 禁止 |
**品質ゲート**: `docs/runbooks/push-deploy-quality-gates-v2.md` · **クローズ正本**: `data/cio-project-closures.json` · **Lifecycle v2**: `docs/runbooks/session-lifecycle-v2.md`

<!-- freeze-zone minChars pad (25+ chars; keep for mandatory-read-gate) -->
## セッション切替後の自律復元（Lifecycle v2 鏡像）
**正本** `docs/runbooks/session-lifecycle-v2.md` | **WAKE** `npm run cio:session:cold-start`
**項番 -1** Desktop `C:\Users\mhamada202408224\Desktop\AI緊急用` **`00-NEW-SESSION-STARTER_yyyymmdd.txt`** **貼付推奨** | **項番 -0** **OK が返るまで** **着手しない** | **項番 0** **`npm run session:bootstrap`**（**Read より前** `verify:constitution-handoff` / `mandatory-read-gate.mjs` / `verify:session-clock-health` / `session-starter:sync-desktop` / `verify:desktop-ai-emergency-sync`）| **項番 0.9** | **日終わり** `cio:session:close-git` / `23-AI緊急用-README.txt` / `SESSION-CLOCK.md` / `session:clock:set` / `session:clock:watch` / `session:split-check` / `SESSION-SPLIT-REMINDER.md` / §35-6 / §35-7 / `HANDOFF-AI-FIVE-BLOCKS` / TSB-031
**L2** bootstrap NG → `NEW-SESSION-STARTER.md` 6 部（1 回）| **CLOSE** export-handoff → sync-desktop → clock:clear → close-git | **bootstrap 3c** `verify:session-close-git-warn` 1 行報告必須（OK/NG）| **履歴** `chat-sessions/checkpoints/checkpoint-archive-YYYY-MM-DD.md`
## 2026-08-15

### 2026-08-15 朝（715 完了・セッション締め）
- **715** ソフトウエア管理台帳ver.1: 可読性／バージョン表示／社員番号非表示／絞り込み既定閉じ／リスト所属を680（施工部含む）／2列／整理後39件同期 → BUILD=`2026-08-15-715-list-dept-680-sync` rev **24** → **浜田目視 OK**
- **714** 閲覧のみ維持（save/delete ブロック）。書き込みは715のみ
- 所属正本は **680**（今後の改修時）。動いている他アプリは問題なければ触らない
- 夜は別アプリ改善（対象は浜田指示）。715は再着手しない
- closeStatus: **closed**（朝セッション締め。day-closeしない）


## 2026-08-13

### 2026-08-13 朝（経営会議レポート完了・夜セッションで認識同期）
- **8月度経営会議 情報セキュリティレポート**: 浜田仕上げ OK。台帳 `2026-08-meeting-202607-report` `status=completed` / `hamadaConfirmed=2026-08-13`。commit `21311515`
- 表紙日付は 2026年8月19日。来月ベースはこのファイル
- checkpoint の GO待ち「レポート本体」を削除（R19・浜田指摘）

### 2026-08-13 夜（本題固定）
- 前セッションクローズの「AIチーム運用」を今夜メインに固定（G0・先進的意見込み）
- 順: いまできること → これから作る仕組み → 優先3つ。実装しない
- 合意: 枠は杓子定規にしない／監査は見る用1枚／月次は下書きパック・ネタは浜田渡し
- 型実装: `cio:ops:frame` / `cio:ops:audit-sheet` / `cio:keiei:draft-pack`（WAKE 必須化しない）
- 最終締め自発: `cio:day-close -- --until-pause`（①②③ GO待ち）→ GO後 `--after-go`

### 2026-08-13 夜（本日最終締め）
- 夕反省全GO: `cio-ops-2026-08-13-evening-improvements`（MCP-2/CON-1見送り）
- #S1 eod cancelled 分類／#D2 674 live 同期／day-close 自発
- closeStatus: **closed-day**



## 2026-08-11

### 2026-08-11 夜（本日最終締め）
- **674**: 買替（596廃止→台帳次番／clone POST／edit+HW／SKYSEA削除条件）・棚卸（履歴正本・latest内部）・IME datalist → rev **327**
- **694**: 印刷／編集 kind 行 → rev **24**
- 夕反省全GO: `cio-ops-2026-08-11-evening-improvements`（clone/IME/retired/ahead）
- AI緊急用: wipe→tip再構築・verify OK／as-built SPEC §1.6〜1.9
- closeStatus: **closed-day**




<!-- 古い履歴: chat-sessions/checkpoints/checkpoint-archive-2026-08-15.md -->
