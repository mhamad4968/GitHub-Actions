# approved-changes/ — 夕反省承認 → 朝適用キュー

夕反省サイクル（§44）でユーザー承認した提案を JSON で保存し、翌朝 06:00 cron が `apply-approved-changes.mjs` で自動実施する。

## ディレクトリ構造

```
docs/approved-changes/
├── README.md                    ← このファイル
├── <YYYY-MM-DD>/                ← 日付フォルダ（適用予定日）
│   └── <id>.proposal.json      ← 個別の提案
├── pending/                     ← Phase 4 (version-up) が積む待機中
├── processed/<YYYY-MM-DD>/     ← 適用済み（移動先）
└── rejected/                    ← 却下分（記録のみ）
```

## カテゴリ

| カテゴリ | 用途 | 自動実施可？ |
|---|---|---|
| **R** | ルール改善（AGENTS.md / WORKFLOW.md / RULES-INDEX.md 編集）| ✅ |
| **S** | スクリプト改善（`scripts/*.mjs` の改修）| ✅ |
| **D** | ドキュメント追記 / 修正 | ✅ |
| **C** | customize コード改修（`customize/<id>/desktop.js`）| ✅（**deploy は除く**）|
| **K** | kintone API 操作（フィールド追加・レコード更新等）| ❌ 自動禁止・手順案内のみ |
| **V** | 依存パッケージ更新（version-up が積む）| ✅（minor）/ ❌（major は manual_only）|

## proposal.json スキーマ

### 共通フィールド

| キー | 必須 | 説明 |
|---|---|---|
| `id` | ✅ | 識別子（例: `R1`, `S1`, `V1` 等）|
| `category` | ✅ | R / S / D / C / K / V |
| `type` | ✅ | `run_command` / `string_replace` / `file_write` |
| `note` | ⚪ | 人間向け説明 |
| `manual_only` | ⚪ | true なら `apply-approved-changes` がスキップ（手順案内のみ）|
| `created_at` | ⚪ | ISO8601 timestamp |

### type: `run_command`

| キー | 必須 | 説明 |
|---|---|---|
| `command` | ✅ | bash で実行するコマンド |

**安全装置**:
- `ALLOW_COMMANDS` allowlist（npm/node/npx/cp 等）
- `DENY_COMMANDS` denylist（deploy/purge/reset/clear:*:apply 等）
- 1 日 25 件上限（K と manual_only はカウント外）

### type: `string_replace`

| キー | 必須 | 説明 |
|---|---|---|
| `target` | ✅ | リポジトリ相対パス |
| `old_string` | ✅ | 置換前の文字列（一意でなければエラー、`replace_all: true` 必須）|
| `new_string` | ✅ | 置換後 |
| `replace_all` | ⚪ | true なら全置換 |

実行前に `target.backup.<timestamp>` で自動バックアップ。

### type: `file_write`

| キー | 必須 | 説明 |
|---|---|---|
| `target` | ✅ | リポジトリ相対パス（**既存ファイルは拒否**）|
| `content` | ✅ | ファイル本文 |

## 運用フロー

```
夕（人間ユーザーが「まとめて」「反省」と発話）
   ↓
AI: scripts/evening-reflect.mjs で雛形生成
   ↓
AI: 改善提案 #R1 #S1 #D1 ... を表で提示
   ↓
ユーザー: 「#R1 承認 / #S1 却下」と返答
   ↓
AI: docs/approved-changes/<明日>/<id>.proposal.json 作成
   ↓
（翌朝 06:00 WSL cron）
   ↓
apply-approved-changes.mjs 実行
   ↓
適用結果を朝ブリーフィング先頭の「## 📋 昨夜承認分の自動実施結果」に表示
   ↓
適用済み proposal は processed/<日付>/ へ移動
```

## 重複防止

`apply-approved-changes` は実行前に `processed/<日付>/<id>.proposal.json` の存在を確認し、あれば skip する。
`version-up` は `pending/` `<日付>/` `processed/` `rejected/` を全走査して同 `package:version` の重複提案を作らない。

## 関連

- AGENTS.md §44 夕反省サイクル
- AGENTS.md §46 朝ルーチン Phase 0 (apply-approved-changes)
- `scripts/evening-reflect.mjs` 雛形生成
- `scripts/apply-approved-changes.mjs` 適用実行
- `scripts/version-up.mjs` V カテゴリ自動生成
