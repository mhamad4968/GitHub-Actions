# kintone 破壊系操作（DELETE・全件入替）— 運用メモ

**2026-05-06**: 浜田 CEO 承認。Cursor 常時想起: **`.cursor/rules/kintone-destructive-rest-guard.mdc`**（`alwaysApply: true`）。

## 手順（省略禁止）

1. **dry-run**（または **既定が dry-run のスクリプト**）で対象の **`$id`・見出し**を出す。
2. その出力を **チャットに貼る**。
3. ユーザーから **「この一覧で削除 GO」**（または同等の明示）を得る。
4. **`--apply` 付き**など、スクリプトが定める **本番フラグ**でだけ実行する。

## 681 メタ章削除（実装済み）

- **一覧表示のみ**: `npm run pc-ledger:quick-guide:prune-meta`（DELETE しない）
- **本番 DELETE**: `npm run pc-ledger:quick-guide:prune-meta:apply`（**GO 後**）

## 参照

- `chat-sessions/desktop-ai-emergency-read-pack/18-SESSION-ONE-REPORT-2026-05-06.md`（経緯・反省）
- `AGENTS.md` **§41**（データ破壊境界）
