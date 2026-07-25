# 2026-07-25 セッション反省 改善P1–P7（浜田 全件承認）

## 決定

- P1: App756 deploy前に source `@JY_V2_BUILD` と bundle `const BUILD` を機械突合する。
- P2: datalist配線とスクロール保持を最小UIスモークとしてdeploy前に検査する。
- P3: 締め時のcheckpoint＋handoffを1つのメタcommitへ集約し、off-by-oneを意図した1世代に固定する。
- P4: checkpoint Lifecycle必須トークンは手編集せず、正本テンプレから生成・検証する。
- P5: UI実装前に「操作・見た目・非該当」の受け入れ3行と主要操作1回ずつのスモークを固定する。
- P6: LOTO7コードは `external/loto7/` をGit正本、Desktopを実行ミラーとする。
- P7: CEO最低基準全文の再掲は締め・GO仰ぎだけ。通常応答は§1四行、通常報告はV2＋A1までとする。

## 機械化

- `npm run verify:jikkou-v2-build-tag`
- `npm run verify:jikkou-v2-ui-smoke`
- `npm run cio:checkpoint:render-lifecycle`
- `npm run loto7:sync-to-desktop` / `npm run loto7:verify-sync`
- `npm run cio:report-verify-response`（通常報告）
- `npm run cio:close-report-verify-response`（締め・GO）

## 完了条件

対象スクリプトの構文検査、App756 Phase4c、LOTO7 smoke、CEO hooks E2E、checkpoint handoff、Desktop同期、Git cleanをすべて通す。
