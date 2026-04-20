# フィールドコードの正本（エクスポート運用）

目的: AI/人間ともに「フィールドコード取り違え」をゼロにする。

## 正本の優先順位（このリポ）

1. `kintone-ai-lab/kintone-apps.md`（現状の正本。履歴・補足がまとまっている）
2. `npm run app:fields -- <appId> --markdown`（実アプリから取得する最新）
3. （導入するなら）このリポに保存する **エクスポート**: `kintone-ai-lab/fields/<appId>.fields.md` / `kintone-ai-lab/fields/<appId>.fields.json`

## エクスポートの形（おすすめ）

- `kintone-ai-lab/fields/594.fields.md`
- `kintone-ai-lab/fields/627.fields.md`

または JSON 版（ツール互換）:

- `kintone-ai-lab/fields/594.fields.json`
- `kintone-ai-lab/fields/627.fields.json`

## ルール

- AI はフィールドコードを推測しない。
- フィールド参照が絡む実装では、着手前に正本（上の順）を読み、矛盾があれば先に解消する。

