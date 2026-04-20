# data/skysea/ — SKYSEA 突合用ローカルデータ

**機密情報を含むため git 管理対象外**（`.gitignore` で除外済み）。

## ファイル命名規則

| 種別 | ファイル名 | 出所 |
|---|---|---|
| インストール済 PC 一覧 | `installed-pcs-YYYY-MM-DD.csv` | SKYSEA 管理機 → ハードウェア一覧 → CSV エクスポート |
| 突合結果（未導入 PC）| `not-installed-YYYY-MM-DD.csv` | 突合スクリプトが自動生成 |
| 突合結果（不一致）| `mismatched-YYYY-MM-DD.csv` | 突合スクリプトが自動生成 |

## 運用

- ファイルは**最低 30 日**保管推奨（履歴比較・トラブル時の遡及確認のため）
- 月次で古いファイルを `data/skysea/archive/` に移動して圧縮可
- **絶対に git にコミットしない**（`.gitignore` で防御済 + 念のため commit 前に `git status` 確認）
