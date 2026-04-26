# App 674 — SKYSEA 標準 GROUP 化（2026-04-28）

## 依頼

- SKYSEA 関連 4 フィールドをグループ **SKYSEA処理用**（`skysea_system_meta`）に収容。通常は閉じる。浜田以外は触らない・見ない。

## 実施（kintone）

1. `npm run pc-ledger:674:add-skysea-group-preview` — GROUP 追加 → preview deploy **revision 15**
2. `npm run pc-ledger:674:layout-skysea-group` — レイアウトで 4 件をグループ内へ → **revision 16**
3. `npm run deploy:674` — customize `BUILD=2026-04-28-skysea-group-ui-v0.1` → **revision 17** / fileKey `1f1119b7-6617-49f8-91f7-a3a19edb76c2`
4. `npm run revision:snapshot -- --app=674 --label=skysea-group-2026-04-28`
5. `field-spec:diff` — **44/44**
6. `npm run kintone:test` — **9/9**
7. `npm run smoke:quiet` — **9/9**

## customize 要点（2026-04-28 夕方 方針変更）

- **当初**: ログイン allowlist で浜田のみ表示（`BUILD=v0.1`）。
- **現在**: アカウント部寄りのため **権限のあるユーザーは全員表示・編集可**（`BUILD=v0.2`）。**運用で触るのは浜田のみ**は **周知**で担保。

- グループは初期閉（`setGroupFieldOpen(..., false)`）。

## リポ

- 正本: `docs/plans/2026-04-21-new-pc-ledger-spec.md` §4.2.3a
- Day4 手順書 §2.7・合計 44 フィールド
- スクリプト: `pc-ledger-674-add-skysea-group-preview.mjs` / `pc-ledger-674-skysea-group-layout.mjs`
