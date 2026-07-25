# LOTO7 source of truth

2026-07-25 浜田承認（P6）により、このディレクトリをソース正本とする。
`C:\Users\mhamada202408224\Desktop\Loto7` は実行ミラー。

- repo → Desktop: `npm run loto7:sync-to-desktop`
- 一致検証: `npm run loto7:verify-sync`
- Desktopで緊急修正した場合の回収: `npm run loto7:sync-from-desktop`

DB（`*.db`）、学習モデル（`*.h5`）、pid、`__pycache__` は運用データでありGit管理しない。
