# レーン作業ツリー衛生（lane-worktree-hygiene）

**制定**: 2026-06-15（浜田 GO — R-2026-06-15-B4）

## 目的

別レーンの未コミット変更（Plan Usage・別 SPEC 等）が混在しないよう、**レーン開始時**に作業ツリーを分離する。

## 手順（推奨）

### A. 新レーン着手前

```powershell
git status --short
```

未コミットがある場合:

```powershell
git stash push -m "lane:<レーンID> WIP"
```

または WIP 用 branch:

```powershell
git checkout -b wip/<レーンID>-<日付>
```

### B. レーン終了時

- 本レーンの変更のみ `git add`（`git status` で確認）
- `npm run verify:session-close-git-warn` で締め

### C. stash 復元

```powershell
git stash list
git stash pop
```

## 禁止

- 関係ない `data/credit-usage.json` 等を **レーン CLOSED commit に同梱しない**
- `git add -A` を確認なしで実行しない

## 関連

- `docs/runbooks/evening-reflection-scope.md`（夕反省は明日のタスクを書かない）
- `npm run verify:session-close-git-warn`
