# DB+Dash 新規台帳スキャフォールド（R-741-01）

> **承認**: 2026-06-22 浜田 GO（夕反省 A 一括）  
> **正本 runbook**: `docs/runbooks/db-dash-v1-launch.md`  
> **参照型**: Wi-Fi 718/719 · VPN 733/734 · 複合機 741/742

---

## いつ適用するか

Space 48 / Space 21 等で **データアプリ（DB）+ ダッシュ（台帳）** を新規作成するとき。  
1 レコード = 1 実体・DB は save/delete ブロック・日常 UI は Dash のみ。

---

## 必須 10 項チェックリスト

| # | 項目 | 正本 / コマンド |
|---|------|-----------------|
| 1 | 仕様書 Q&A 確定 + AI レビュー | `docs/plans/YYYY-MM-DD-*-kintone-spec.md` §15 |
| 2 | App ID 状態 JSON | `scripts/data/<slug>-app-ids.json`（**null 禁止** — `verify:kintone-app-ids`） |
| 3 | customize registry | `data/kintone-customize-path-registry.json` |
| 4 | DB block customize | `customize/<slug>-db/desktop.js`（718 型イベント網羅 + mobile） |
| 5 | Dash source + bundle | `desktop.src.js` → `npm run <slug>:bundle-dash`（SheetJS 系は eslint ignore） |
| 6 | preflight / deploy npm | `cio:preflight:<dbId>` / `deploy:<dbId>` / `deploy:<dashId>` を **create 成功時に package.json へ** |
| 7 | Excel 移行（該当時） | dry-run → apply。PW をログ出力しない |
| 8 | ACL | API 失敗時は **手動** — `docs/runbooks/kintone-acl-manual-space48-crud.md` |
| 9 | deploy 台帳 | `sync:kintone-apps-build` + `verify:cio-deploy-ledger-gate` + `rag:mirror:canonical-docs` |
| 10 | v1 CLOSED | completion.md + `data/cio-project-closures.json` + 仕様 M7 + Excel 廃止 2 段階 |

---

## kintone REST 必須パターン

- **複数レコード POST**: `records.json` の body は **`records: [{ field: { value } }]`**（`record` 単体は CB_VA01）
- **680 seed / マスタ追加**: 既存 seed スクリプトと同型。`verify:kintone-records-post-shape` で機械検査

---

## AI レビュー前（R-741-03）

DeepSeek 等に渡す前に **仕様確定項**（意図的仕様）表を添付する:

| 論点 | 確定仕様 |
|------|----------|
| PW 業者印刷 | Q18 GO — 拠点指定印刷は PW 含む |
| 一覧印刷 | Q20 — PW 除外 |
| xlsx | Q16 — 734 型（PW 含む場合あり） |
| REST 経 DB ブロック | Dash→DB REST が正ルート（DB UI ブロックは意図） |

---

## 関連

| 種別 | パス |
|------|------|
| ACL 手動 | `docs/runbooks/kintone-acl-manual-space48-crud.md` |
| Excel 廃止 | `docs/runbooks/excel-abandon-two-stage.md` |
| セッション締め | `.cursor/rules/session-boundary-close-gate.mdc`（R-741-04） |
| クローズ | `docs/constitution/23-project-closure-recognition-kernel.md` |
