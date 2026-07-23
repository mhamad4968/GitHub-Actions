# Ver.02 UI クロム不変条件（#R-UI-01/02/03・#R-SPEC-01）

**制定**: 2026-07-23（浜田 GO・夕反省全件承認）  
**証跡**: `docs/approved-changes/2026-07-23-evening-reflection-hamada-go.md`  
**SPEC**: `docs/plans/2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md` §6.2  
**チェックリスト**: `docs/runbooks/jikkou-yosan-v2-chrome-accept-checklist.md`

## #R-UI-01 — sticky 祖先の overflow-x:hidden 禁止

`.jy2-sticky-top`（または fixed 化した操作バー）の祖先に `overflow-x:hidden` を置いてはならない。  
横はみ出しは **`overflow-x:clip`**、または **表ラッパのみ** `overflow-x:scroll`。

対象祖先の例: `#jy2-host` / `.jy2-shell` / gaia 枠 / `body.jy2-detail-shell` 系。

**機械**: `npm run verify:jikkou-v2-chrome-css`（#S-UI-01）

## #R-UI-02 — th/td の display 変更禁止

列見出しの装飾は **内側** `.jy2-th-stack` のみ。`th`/`td` 自体を `display:flex|grid` にしてはならない。

**機械**: 同上（#S-UI-02）

## #R-UI-03 — 光学中央とバナー幅の分離

letter-spacing / margin 補正で字を中央に寄せるとき、**同時に** `.jy2-sheet-title` の `width`/`max-width` を縮めてはならない（別変更・明示レビュー）。

## #R-SPEC-01 — UI と SPEC 同一ターン

`customize/jikkou-yosan-v2-app1/desktop.ui.js` を変えた作業差分には、必ず  
`docs/plans/2026-07-19-jikkou-yosan-ver02-redesign-spec-draft.md`（§6.2 または該当 U/D）を含める。

**機械**: `npm run verify:jikkou-v2-ui-spec-same-turn`
