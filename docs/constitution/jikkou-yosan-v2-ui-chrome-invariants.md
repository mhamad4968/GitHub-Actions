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

## #R-PERF-01 — 構造変更の再描画予算（2026-07-31 浜田承認）

行追加・削除・列追加など **DOM 構造を変える UI** を入れる同一ターンで、次を満たすこと。

1. **見積もり**: 想定操作で **click / 同期 rerender が 500ms を超えるか**を口頭またはメモで明示する。  
2. **既定**: 全表 `rerender` は禁止寄り。**ブロック単位 / dirty-only / rAF 延期**のいずれかを先に選ぶ。  
3. **超える場合**: その場で「翌日・新チャットで本直し」と区切る（応急のみ当日可）。

**証跡例**: 2026-07-31 操作＋／－ → click 1〜2s Violation → `…excel-struct-raf` 応急。

## #R-EXCEL-UI-01 — Excel 列＋UI 専用列（2026-07-31 浜田承認）

Excel 原価管理明細に無い列を足してよい条件:

| 条件 | 内容 |
|------|------|
| 列名 | 短い日本語（例: **操作**）。Excel 列名の改名・吸収はしない |
| 位置 | Excel データ列の直後など、意図が分かる場所 |
| 保存 | 構造変更は **一時保存 → App757**。「予実を保存」では構造を書かない旨を UI に残す |
| 不変 | App758 keys / save / pivot 形状を変えない |

チャットの言い換えだけで Excel 列を勝手に増やさない（浜田 Excel 正本ロック）。

## #R-VIOLATION-01 — Chrome Violation 運用（2026-07-31 浜田承認）

| 種類 | 扱い |
|------|------|
| `show.js` 等 kintone 本体 | 報告のみ・こちらでは直さない |
| click / 同期 handler **≥ 500ms**（自前 customize） | **当日止め or 応急**＋本直しを handoff に残す |
| Forced reflow / rAF **≥ 100ms** が連続 | 本直し候補。障害ではないが放置禁止 |
| 文言 | 「Violation = 即障害」と浜田に誤解させない。閾値と次手を1行で言う |

## #R-SESSION-4H-DEPLOY — 4h 超 deploy 硬拒否（2026-07-31 浜田承認）

`SESSION-CLOCK.md` 経過 **≥ 4h** のとき `deploy:*` は **機械拒否**（`cio-deploy-preflight-guard`）。  
緊急のみ `SKIP_CIO_SESSION_CLOCK_DEPLOY=1` ＋チャットに浜田 GO 1 行。  
止め役の口頭硬拒否: **「4h超・新チャットのみ。deploy/実装はしない」**。

