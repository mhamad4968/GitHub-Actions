# Git 状態の回復手順（2026-05-04 / interactive rebase 中断）

## いまの状態（CIO が確認済み）

- **`git status`**: `interactive rebase in progress; onto 1369c2a`。**`pick 699e22c`**（679 quick-manual コミットの再適用）**完了後**に **「editing a commit」で停止**している。
- **作業ツリー**: `git stash push` 済み。**`stash@{0}`** = `wip: rebase-interrupted 677-678-679 scripts`（`customize/677|678|679/desktop.js` と `scripts/sync-yojitsu-679-manual-desktop.mjs`・`yojitsu-678-set-manual-pointer-description.mjs`）。
- **§52-8**: Cursor の **`dangerous-shell-blocker`** が **`git rebase --continue`** をブロックする。**Cursor 内の Agent Shell では続行できない**。

## 回復手順（浜田または CIO が **Cursor 外のターミナル**で実行）

1. `cd ~/kintone-ai-lab`（または WSL のリポルート）
2. `git status` で **rebase 中**であることを再確認
3. **`git rebase --continue`**  
   - エディタが開いたら保存終了（メッセージは既存のままで可）
4. 成功後: **`git stash pop`**（競合したら手で解消）
5. `git status` → **`main` にチェックアウト**されているか確認。必要なら `git checkout main`
6. `git log -3 --oneline` で **履歴が一直線か**確認
7. リモートへ: **`git push origin main`**（reject 時は `git pull --rebase` の方針を浜田と相談。**force push は禁止**）

## 代替（続行が難しい場合のみ・**高リスク**）

- **`git rebase --abort`**: rebase 開始前の **`main`（`orig-head` = 699e22c 付近）**へ戻る。**この後 `389e0fc` / `530d363` を `cherry-pick` で戻す**必要がある可能性（`git reflog` で確認）。**浜田 GO 必須**。

## 679 台帳転記（デプロイ直後 1 行）

- **`npm run deploy:679` の標準出力**に **revision** と **fileKey** が出る → **`kintone-apps.md` の「変更履歴」表**に **1 行追加**。
- **`var BUILD`**: `grep -n 'var BUILD' customize/679/desktop.js` の値を **同じ行または直前行**にメモ。

## 参照

- `SESSION-CLOSE-REPORT-20260504.txt` §3・§6  
- `AGENTS.md` 冒頭「作業レーンの切り替え」
