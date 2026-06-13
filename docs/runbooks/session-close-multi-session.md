# 1 日複数セッションの締め（C3 / 2026-05-31 承認）

**制定**: 2026-05-31（浜田 GO）

## 問題

午前に `SESSION-CLOSE-REPORT-YYYY-MM-DD.txt` を書いたあと、夕方に作業が続くと **締め正本・handoff・checkpoint がずれる**。

## ルール

| ファイル | 1 日 2 回目以降の更新 |
|----------|------------------------|
| **`SESSION-CLOSE-REPORT-YYYY-MM-DD.txt`** | **最終締めターンで上書き**（§4 夜追記で足すのではなく、**その日の最終版 1 本**に統一） |
| **`handoff-log.md`** | **末尾に 1 ブロック追加**のみ（朝ブロックは残す） |
| **`checkpoint-latest.md`** | **先頭に「夜・最終締め」表を追加**（古い表は下へ） |
| **`docs/reports/YYYY-MM-DD-evening-reflection.md`** | **その日 1 本**（夕方 1 回作成・更新） |

## AI 手順（最終締め）

1. 当日の作業を **SESSION-CLOSE-REPORT に反映**（上書き or §4 統合後に冗長 § を削除して 1 本化）
2. handoff **末尾 1 ブロック** / checkpoint **先頭 1 表**
3. 夕反省（26）作成 → `verify:evening-reflection-scope`
4. **先祖返りガード + commit → pull --rebase → push**（B1/B4）— `npm run cio:session:close-git -- --execute --message "…"`
5. `npm run verify:session-close-git-warn`（close-git 内包可）
6. `npm run desktop:sync-and-verify`

## 関連

- B4: `verify:session-close-git-warn`（未 push も NG）
- C1/C2: `18-重要確認.txt` — LITE のみ・sync 前 Notepad 警告
