# git stash 整理（2026-06-19）

**契機**: 浜田端末に **stash 6 件**（2026-05-02〜2026-06 頃）が残存。いずれも **main へマージ済み**または **古い WIP** で、復元すると **先祖返り** リスクが高い。

---

## 一覧（2026-06-19 時点）

| ref | メッセージ | 内容 | 推奨 |
|-----|------------|------|------|
| `stash@{0}` | temp | `SESSION-CLOCK.md` 1 行 | **drop** |
| `stash@{1}` | cio-temp-before-rebase-sanitize-commit-msg | 2026-05 頃 hooks/customize 大量 WIP | **drop**（main へ反映済み） |
| `stash@{2}` | pre-pull Windows 2026-05-06 | AGENTS/RAG/678 等 CRLF 大量 | **drop**（同期済み） |
| `stash@{3}` | wip: unrelated before push 678 | 予実 678 前 WIP | **drop** |
| `stash@{4}` | wip: 2026-05-02 session mixed | 予実・Desktop sync 混在 | **drop** |
| `stash@{5}` | WIP on feature/calculate-tax | FAQ 古 branch | **drop**（branch 廃止想定） |

---

## 実行（浜田 GO 後）

```powershell
cd C:\Users\mhamada202408224\kintone-ai-lab
git stash list
git stash clear
git stash list   # 空であること
```

**注意**: `stash clear` は **取り消し不可**。念のため `git stash show -p "stash@{0}"` で中身を見てから実行。

**代替（1 件だけ残す）**: 最新 `stash@{0}` のみ drop → `git stash drop "stash@{0}"` を 6 回。

---

## 再発防止

- 長期 WIP は **stash より branch + commit**（`git switch -c wip/…`）
- pull 前の安全退避は **`git stash push -m "pre-pull YYYY-MM-DD"`** 後 **同一セッション内に drop**
- セッション締め: **`verify:session-close-git-warn` OK** = working tree clean 必須
