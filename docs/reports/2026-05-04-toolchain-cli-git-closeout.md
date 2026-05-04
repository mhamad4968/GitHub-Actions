# 2026-05-04 — ツールチェーン・CLI・Git 回復の締め（追記用サマリ）

本ファイルは **`SESSION-CLOSE-REPORT-20260504.txt` §7** と同趣旨の **参照用コピー**（検索・リンク用）。矛盾したら **締め報告 §7** と **`docs/dev-cli-matrix.md`** を優先する。

## Git（rebase 中断の回復）

- 症状: **`interactive rebase in progress`** のまま **`git rebase --continue` が「merge conflicts」で失敗`**、`ls-files -u` は空、**`node_modules/**/*.orig` に `<<<<<<<` 残骸** 等。
- 実績: **`git rebase --quit`** でメタデータ掃除 → **`main` を正しい先端コミットに `reset --hard`** → **`stash` の二段（temp / rebase-interrupted）** を **`checkout stash@{0} -- <paths>` + `git apply`** 等で取り込み → **複数コミットで `push`**。
- 手順の正本: **`docs/reports/GIT-REBASE-RECOVERY-20260504.md`**。

## Node / npm / CI

- **`.nvmrc`**: `22`（**`nvm install` / `nvm use`**）。
- **`package.json` `engines.node`**: `>=22.13.0`。
- **GitHub Actions**: **`actions/setup-node` の `node-version-file: ".nvmrc"`**。
- **浜田環境の確認コマンド**: `node -v` → v22.x、`npm install`、`npm run lint:customize`。

## kintone CLI

- **`cli-kintone` 単体パッケージは deprecated** → 本リポは **`@kintone/cli`** を **`devDependencies`** に固定し、**コマンド名 `cli-kintone` は従来どおり**。

## 開発 CLI の版一覧

- **`npm run dev:cli-versions`**
- 更新方針・任意 CLI・**`npm audit`（axios 間接）の扱い**: **`docs/dev-cli-matrix.md`**。

## Cursor

- **IDE 本体の更新**はリポではできない。**浜田が Cursor アプリから更新**。

## エージェント（AI）シェルについて

- Cursor Agent のシェルは **既定 Node が 20 のまま**のことがある。**`npm install` で `EBADENGINE` が出ても**多くの場合は **継続可能**。**決め打ちの検証は CI と浜田の Node 22** を正とする。

## その他

- **677 向けローカル一次スクリプト**: **`scripts/.gitignore`**（共有しない）。
- **RAG**: **`npm run rag:mirror:canonical-docs`** で **`.rag/extra-docs`** の正本コピーを維持。
