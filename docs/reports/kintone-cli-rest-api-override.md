# `@kintone/rest-api-client` の `package.json` overrides

## 背景

- `@kintone/cli@1.19.2` は **`@kintone/rest-api-client@6.1.4` を固定**しており、その配下の **`axios@1.14.0`** が `npm audit` moderate の対象だった。
- **`npm audit fix --force` は使用しない**（CLI ダウングレード等の案内のため）。
- 対応: ルート **`package.json` の `overrides`** で **`@kintone/rest-api-client@6.1.6`**（`axios@1.15.0`）へ揃えた。

## overrides を外す条件

1. `npm view @kintone/cli@latest dependencies.@kintone/rest-api-client` が **`6.1.6` 以上**になっている（公式 CLI が吸い上げた）。
2. `overrides` ブロックを削除したうえで **`npm install`** → **`npm audit`** が **0 件**のままである。
3. **`npm run smoke:quiet`** が緑である。

上記を満たしたら **`overrides` を削除**し、本ファイルに **削除日**を 1 行追記してからコミットする。
