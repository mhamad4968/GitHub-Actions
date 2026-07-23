# 夕反省 — 2026-07-23

正本スコープ: `docs/runbooks/evening-reflection-scope.md`（失敗＋ミス削減案のみ）

**レーン文脈**: Ver.02 App756 UI レビュー連鎖・SPEC 追記・締め・GitHub 確認  
**LIVE 締め時点**: BUILD=`2026-07-23-ver02-fixed-action-menu` rev90

## §1 失敗（事実）

| ID | 事実 | 再発条件 |
|----|------|----------|
| **F1** | 表の横はみ出し対策で祖先に `overflow-x:hidden` を入れた結果、CSS 仕様どおり `overflow-y` が `auto` 化し **`position:sticky` の操作バーが縦スクロールで消えた**。736 は親に hidden を置かないのに、Ver.02 だけ containment を強くしすぎた | 横スクロール確保のために sticky 祖先へ `overflow-x:hidden` を足す（`clip`／表ラッパ限定を検討しない） |
| **F2** | F1 の根因を最初に特定せず、**sticky top 補正・バナー配置・gap 消し**など症状パッチを連打した。最終的に `fixed`＋spacer で収束したが、往復 deploy が多い | 「sticky が効かない」時に祖先 overflow を最初に点検しない |
| **F3** | 見出し視認性のため `th` を flex 化したところ **table-cell が壊れ列が縦崩れ／見出しクリップ**。内側スタック（`.jy2-th-stack`）へ戻すまで複数回 | 表ヘッダの見た目改善で `display` を table-cell 以外に変える |
| **F4** | シート見出しの光学中央のため帯を `width:auto` にしたところ **表題図形が不自然に小さくなった**。中央寄せと帯幅を同一変更に混ぜた | letter-spacing 補正とバナー外形を同時にいじる |
| **F5** | 横スクロールが **ズーム100%で出ない／タブ切替後に消える／総括・内訳でも切れる** を順に直し、強制幅同期・タブ再測を後付けした。最初から「親幅閉じ込め＋子だけ scroll＋表示後に測る」を一式で置かなかった | 広い表の hscroll を「とりあえず overflow」だけで済ませる |
| **F6** | 予実の月列・自動タグ・フッタ中央寄せ・金額幅・消化率右端クリップ・原価計行欠落など、**見た目指摘を1件ずつ deploy**した。クロム受け入れチェックリストが無く浜田レビューが回帰試験になった | UI レビュー前に §6.2 相当のチェック表を持たない |
| **F7** | 画面変更のたびに「そのターンで SPEC 更新」規律があるのに、**§6.2／U31／D-78 など大量の UI 確定を締め直前まで書面化しなかった**。実装先行・SPEC 後追い | LIVE 見た目変更を「後でまとめて書く」 |
| **F8** | deploy 同期後も `kintone-apps.md` の **fileKey がレジストリと不一致**のまま残った（BUILD/rev は合って fileKey だけ旧） | fileKey を目視せず BUILD 文字列だけ見て同期完了とする |
| **F9** | セッション締め後も **checkpoint が 7/22 文言のまま**・bridge `gitHead` が tip の祖父止まり。GitHub 確認時に発覚してから直した。締め＝checkpoint 更新が自動化されていなかった | close-git／export を「Git だけ」で済ませ本文を更新しない |
| **F10** | PowerShell で bridge／handoff を書くとき **encoding／ConvertTo-Json** で文字化けリスクが出た。また `cio:session:export-handoff --help` が **help でも本体実行**し、nextTask を古い checkpoint 文で上書きしかけた | Windows 手書き JSON・壊れた CLI フラグ解釈を疑わず使う |
| **F11** | （同日午前系）タブ構成・率ラベル等で **SPEC↔LIVE ずれが監査で発覚**し S1–S3／同一ターン SPEC 修正が必要になった。画面を触った直後に書面を動かさなかった蓄積 | UI 変更と SPEC 行の同時 diff を省略する |
| **F12** | UI 修正の commit 粒度は細かすぎ（症状1件＝1 commit×多数）、一方 **SPEC・checkpoint は粗く遅れる**。品質の置き場が逆 | 「コードは即細かく、文書は後でまとめて」 |

## §2 行動（次から変えること）

| ID | 内容 |
|----|------|
| **A1** | sticky／fixed が消える・ずれるときは **最初に祖先の computed overflow** を見る。`hidden` 禁止・横は `clip` または表ラッパのみ scroll（§6.2 実装メモ遵守） |
| **A2** | 表まわりの CSS は **th/td の display を変えない**。装飾は内側ラッパのみ |
| **A3** | バナー／字間／中央寄せは **外形サイズとテキスト光学補正を分離**して変更する |
| **A4** | 広い表を触るターンは最初から **親幅閉じ込め＋子 scroll＋activate/resize 再測**をセットで入れる |
| **A5** | App756 の見た目 deploy 前に **クロムチェックリスト**（固定メニュー・表題帯・hscroll・見出しタグ・フッタ・予実月列／消化率端・原価計）を自己消化してから浜田に出す |
| **A6** | 見た目変更の **同一ターンで SPEC（§6.2／U*／D*）を更新**してから次の UI 指摘に進む |
| **A7** | deploy 後は `cio-live-builds.json` と `kintone-apps.md` の **BUILD・rev・fileKey 三点照合** |
| **A8** | 締めは tip と **checkpoint 本文＋bridge.gitHead＋handoff Git 行**を揃える。export は `--help` に頼らず明示フラグのスクリプトだけ使う |
| **A9** | handoff JSON は **UTF-8 明示の node スクリプト**で書く（PowerShell ConvertTo-Json 手書き禁止） |

## §3 ルール・脚本（承認待ち）

| ID | 種別 | 提案 | 根拠 | 状態 |
|----|------|------|------|------|
| **#R-UI-01** | ルール | Ver.02 App1 の sticky／固定クロム祖先に **`overflow-x:hidden` 禁止**。横は `clip` または表ラッパ `overflow-x:scroll` のみ。違反はレビュー差し戻し | F1/F2 | **GO・実装済** |
| **#R-UI-02** | ルール | 表ヘッダの見た目変更で **`th`/`td` の `display` 変更禁止**（内側スタックのみ可） | F3 | **GO・実装済** |
| **#R-SPEC-01** | ルール | App756 のユーザー可視 UI 変更は **同一ターンで redesign SPEC（最低 §6.2 または該当 U/D）更新**しないと次の UI タスク禁止（既存「同一ターン SPEC」の運用強化） | F7/F11/F12 | **GO・実装済** |
| **#S-UI-01** | 脚本 | `verify:jikkou-v2-chrome-css` — sticky 祖先セレクタに `overflow-x:hidden` が残っていたら exit 1 | F1 | **GO・実装済** |
| **#S-UI-02** | 脚本 | 同上 — `th`＋`display:flex|grid` で exit 1 | F3 | **GO・実装済** |
| **#S-SYNC-01** | 脚本 | deploy 後 verify で **kintone-apps.md の fileKey ＝ cio-live-builds.json** を必須化 | F8 | **GO・実装済** |
| **#D-CLOSE-02** | 規律 | 締め完了判定に **checkpoint「最終更新」日付＝当日** と **bridge.gitHead∈{HEAD, parent}** を必須 | F9 | **GO・実装済** |
| **#S-HANDOFF-01** | 脚本 | `cio-session-export-handoff.mjs` は未知引数／`--help` だけで **本体副作用禁止** | F10 | **GO・実装済** |
| **#R-UI-03** | ルール | 光学中央・字間変更時、**バナー幅（min/max/width）を同時に縮めない** | F4 | **GO・実装済** |

**GO 証跡**: `docs/approved-changes/2026-07-23-evening-reflection-hamada-go.md`  
**実装**: 同セッション完了（pre-commit / pushGate / deployGate756 / constitution-gates）。

## 検証

- `npm run verify:evening-reflection-scope`（本ファイル）
- `npm run test:evening-improvements-2026-07-23`
- 当日 tip の GitHub Actions（constitution-gates / cursor-env-gates）success 確認済
