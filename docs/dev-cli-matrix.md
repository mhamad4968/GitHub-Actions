# 開発 CLI・ランタイム（確認用）

## 一覧の出し方

```bash
npm run dev:cli-versions
```

## 推奨の更新方針（WSL / Ubuntu 目安）

| ツール | 用途 | アップデートの目安 |
|--------|------|----------------------|
| **Node.js** | 本リポの実行基盤 | **`.nvmrc`（22）** と `package.json` の **`engines.node`** に合わせる。`nvm install` / `nvm use` |
| **npm** | 依存インストール | Node に同梱。`npm install -g npm@latest` は任意 |
| **Git** | バージョン管理 | `sudo apt update && sudo apt install git` または Git 公式 PPA |
| **GitHub CLI `gh`** | PR / Issue / API | [公式リリース](https://github.com/cli/cli/releases) または `sudo apt install gh` |
| **`@kintone/cli`** | `cli-kintone`（レコード・customize 等） | **本リポ `devDependencies`** に固定。`npm update @kintone/cli` |
| **ripgrep `rg`** | 高速 grep | `sudo apt install ripgrep` |
| **`jq`** | JSON 整形 | `sudo apt install jq` |
| **`curl`** | HTTP | ディストリのセキュリティ更新に追随 |
| **Python / `uv`** | 補助スクリプト | 必要な範囲で `uv self update` 等 |

## kintone CLI（重要）

- レジストリの **`cli-kintone` 単体パッケージは deprecated** です。
- 本リポでは **`@kintone/cli`** を入れ、従来どおり **`cli-kintone` コマンド名**で `npm run cli` 等が動くようにしています。

## Cursor

- **IDE 本体**はリポからは更新できません。アプリの **Check for Updates** で追従してください。

## npm audit（`@kintone/cli` 導入後）

- **`axios` の moderate** が `@kintone/cli` → `@kintone/rest-api-client` 経由で **間接依存**として出る場合があります（レジストリ最新 **1.19.2** でも解消しないことがある）。
- **`npm audit fix --force`** は `@kintone/cli` のダウングレードを伴うことがあるため **原則使わない**。公式パッチが出たら `npm update @kintone/cli` で追従する。
