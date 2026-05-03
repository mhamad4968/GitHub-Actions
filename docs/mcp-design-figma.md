# デザイン系 MCP（Figma）— 表の配色・UI レイアウト・デザイン to コード

**目的**: 表の色合い・余白・タイポ・コンポーネント階層など **視覚設計を構造化データとして AI に渡す**（スクリーンショット推測だけに頼らない）。kintone customize のダッシュや Excel 準拠レイアウトと **Figma 上の正**を突合するときに使う。

**正本順位**: Cursor は **グローバル** `~/.cursor/mcp.json` と **プロジェクト** `.cursor/mcp.json` を読む（[Cursor MCP ドキュメント](https://cursor.com/docs/context/mcp)）。本リポでは **`.cursor/mcp.json` に Figma（remote）を追加済み**なので、**本フォルダをワークスペースのルートで開いたうえで Cursor を再起動**すると MCP に `figma` が載る想定です。

---

## 「MCP に出ない」とき（チェックリスト）

1. **ワークスペースのルート**が `kintone-ai-lab`（本リポ）か。別フォルダや Temp だけ開いていると **プロジェクトの `.cursor/mcp.json` は読まれません**。
2. **Cursor を完全終了して再起動**（リロードだけでは MCP が載らないことがあります）。
3. **初回は OAuth**: `figma` を有効にしたあと、Features → MCP で **Connect / 認証**が求められないか確認する（[Figma MCP Server Guide · Cursor](https://github.com/figma/mcp-server-guide#cursor) の Manual setup と同じ URL）。
4. **グローバルにだけ置きたい場合**: Cursor → **Settings → Cursor Settings → MCP** → **Add new global MCP server** に、次を **既存の `mcpServers` にマージ**して保存する（公式手順どおり）:
   ```json
   "figma": {
     "url": "https://mcp.figma.com/mcp"
   }
   ```
5. **プラグイン経路**（任意）: Agent チャットで **`/add-plugin figma`** と打つと、Figma 公式が案内する **プラグイン＋MCP 設定**が入る（[figma/mcp-server-guide](https://github.com/figma/mcp-server-guide)）。
6. まだ無いときは **Output →「MCP Logs」** で接続エラーを確認する（[Cursor ドキュメント FAQ](https://cursor.com/docs/context/mcp)）。

**プラン注意**: Figma 側で **Starter や View/Collab シート**だと、MCP の読み取りツールが **月 6 回まで**など制限される場合があります（[Figma MCP Server Guide](https://github.com/figma/mcp-server-guide) の Rate limits 注記）。Dev / Full シートの有無で挙動が変わり得ます。

---

## 推奨: Figma 公式リモート MCP（機能が広い）

Figma が提供する **remote MCP** を使う方法がデフォルト推奨（variables・layout・Code Connect など）。

1. [Cursor and Figma: Set up the MCP server](https://help.figma.com/hc/en-us/articles/39889260656407-Cursor-and-Figma-Set-up-the-MCP-server)（Figma Help）に従い、**Figma 側プラグイン**と Cursor の **コマンドパレット**（Windows: `Ctrl+Shift+P`）から有効化する。
2. Cursor の MCP 一覧で **Figma が緑**になっていることを確認する。
3. チャットでは **フレーム／ファイルへのリンク**や **node-id 付き URL** を貼り、「このフレームの色・間隔・自動レイアウトに合わせて `desktop.js` の表 CSS を直して」と指示する。

**向いている作業**: UI レイアウトの再現、デザイントークン（色・角丸・影）の抽出、コンポーネント名に沿った実装。

---

## 代替: Figma デスクトップ MCP（組織・エンタープライズ向け）

同一 Help の **desktop** 節のとおり、Figma アプリで Dev Mode の MCP を有効化し、コピーした URL を `~/.cursor/mcp.json` に追加する。

```json
{
  "mcpServers": {
    "figma-desktop": {
      "url": "http://127.0.0.1:3845/mcp"
    }
  }
}
```

**注意**: デスクトップアプリ起動・対象ファイルを開いた状態でないと使えない。

---

## 代替: `figma-developer-mcp`（stdio・Personal Access Token）

[npm: figma-developer-mcp](https://www.npmjs.com/package/figma-developer-mcp)（リポ: [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP)）は **Figma REST API** でファイル／ノードを取得し、Cursor 向けにレイアウト情報を要約して渡す。**PAT が必須**（読み取り専用トークンを推奨）。

### `~/.cursor/mcp.json` の例（秘密は環境変数へ）

`FIGMA_API_KEY` を **Windows ユーザー環境変数**や Cursor の **Secrets** に置き、`mcp.json` では `${env:FIGMA_API_KEY}` が使えない場合は **Cursor の MCP env UI** に直接入れる（平文をリポに書かない）。

```json
{
  "mcpServers": {
    "figma-developer-mcp": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp@0.11.0", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "（Figma Account → Security → Personal access tokens で発行。ここには貼らない）"
      }
    }
  }
}
```

- **§17-3 遵守**: cron や Cursor 起動環境で `npx` が古い Node を掴む事例があるため、**`command` はフルパスの `npx`（または `node` + スクリプト絶対パス）**に寄せること（`AGENTS.md` §17-3）。
- ファイル全体が大きいときは **特定フレームの URL**（`node-id=` 付き）をプロンプトに含め、取得範囲を絞る。
- **ツール利用前**に MCP descriptor を読む義務は **`mcp-tool-discipline.mdc`**（本サーバも例外ではない）。

---

## 他ツールとの使い分け（簡易）

| やりたいこと | 主に使うもの |
|--------------|----------------|
| Figma 上の正とコードを一致させたい | **Figma MCP**（本書） |
| 本番 kintone 画面の DOM・実表示 | **Playwright MCP** |
| WCAG・コントラストの機械チェック | **accessibility-scanner MCP** |
| 長文 HTML の md 化 | **markdownify MCP** |

---

## 導入後の必須メンテ

- `mcp.json` を変更したら **`docs/mcp-status.md`** に 1 行でもよいので **日付・サーバ名・主用途**を追記する（憲法 `.cursor/rules/mcp-tool-discipline.mdc`）。
- 可能なら `bash scripts/backup-mcp.sh`（`AGENTS.md` §50 系のバックアップ手順）で退避する。

---

## 変更履歴

- 2026-05-04: 初版（デザイン系 MCP として Figma 公式／desktop／`figma-developer-mcp` を整理）。
