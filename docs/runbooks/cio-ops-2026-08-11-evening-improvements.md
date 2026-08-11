# CIO Ops — 2026-08-11 夕反省改善（浜田全対応）

> 正本パッケージ。**08-10 ops は上書きしない**（併存）。上位: `docs/runbooks/session-lifecycle-v2.md`。  
> GO: `docs/approved-changes/2026-08-11-evening-reflection-hamada-go.md`  
> 仕様: `docs/plans/2026-08-11-evening-improvements-spec.md`  
> 674 詳細: `docs/runbooks/pc-ledger-674-replace-clone-post.md`  
> IME: `docs/runbooks/kintone-input-ime-datalist.md`

## T1 / R3 / OPS-1 — 複製 POST DoD

複製→POST の前に次を満たす（純関数正本: `scripts/lib/kintone-record-clone-post.mjs`）:

1. システム型・コード除外（`RECORD_NUMBER` / `RECORD_ID` / CREATOR 等）
2. 必須 DROP_DOWN を空にしない（初期値を明示）
3. 空の DATE / DATETIME / TIME / NUMBER は送信省略
4. 遷移先（edit/show）と直後に埋める必須をセット（T2）

## T2 / ORG-1 — 作成後遷移

実装前に浜田へ **1行**: 「作成後は edit / show のどちら？」を取る。黙って show にしない。

## T3 — フラグ＝状態

バナー／バッチを立てる前に「条件フィールド＝利用者に見える意味」を1行書く。例: SKYSEA 削除待ちは `skysea_manual_done === 完了` のときのみ。

## T4 / R4 — IME

datalist／サジェスト付き input は composition 中に `list` 更新・再描画しない。正本: `docs/runbooks/kintone-input-ime-datalist.md`。

## T5 / OPS-3 / CON-3 — push 区切り

機能完了単位で `git status` が **ahead** なら **push → CI 緑確認**までを区切りとする。未 push＝検証ゼロ（運用違反）。

## R1 — 674 買替

手順・除外・必須・SKYSEA・採番（596 禁止）は `pc-ledger-674-replace-clone-post.md`。

## R2 / ORG-2 / RULE-2 — 退役アプリ

- テナント削除・統廃合と **同ターン**で `retiredAppIds` 登録＋`verify:retired-app-refs` 緑。
- ゲートは **月次**に加え **pre-push** と **constitution-gates**（各パイプライン1回・順序独立）。

## OPS-2 — 棚卸（維持）

履歴＝正本、`latest_inventory_date`＝派生（内部メタ）。SPEC と矛盾させない。

## MCP-1 — 障害時の form 先読み

買替・クローンで API／必須エラーが出たら、コード修正前に **kintone / kintone-schema-mcp** で必須・型を確認する。

## MCP-2 / CON-1 — 見送り

- 新 MCP サーバー追加なし。
- AGENTS.md 大改訂なし（brief-card／薄い mdc のポインタのみ）。

## CON-2 — deploy 仮説

多段になりそうなときは `cio:preflight` の note に **仮説1行**（例:「POST は RECORD_NUMBER 除外のみ」）を書いて1仮説1 deploy を狙う。

## 針の保守（DeepSeek 盲点3）

`test-evening-improvements-2026-08-11.mjs` と `kintone-record-clone-post` 定数をリファクタしたら **同ターン**で needle を更新する。desktop.js の除外集合と lib 定数の一致を崩さない。
