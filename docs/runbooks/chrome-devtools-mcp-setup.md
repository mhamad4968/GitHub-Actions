# Chrome DevTools MCP 有効化（Phase D）

> **目的**: customize 実画面・コンソールエラー・レンダリングの**事実確認**（Playwright 補完）

## いつ使うか

| 場面 | MCP |
|------|-----|
| kintone customize の表示バグ | **chrome-devtools** |
| ログイン後 E2E 導線 | **playwright** |
| Shadcn コンポーネント参照 | **shadcn-ui** |

正本ルール: `.cursor/rules/mcp-frontend-shadcn-chrome.mdc`

## 前提

- Node.js **20+**（`chrome-devtools-mcp` 要件）
- Google Chrome インストール済み

## Windows（推奨 — ネイティブ Node）

リポ overlay（`.cursor/mcp.json`）に以下が含まれる:

```json
"chrome-devtools": {
  "command": "npx",
  "args": ["-y", "chrome-devtools-mcp@latest"]
}
```

### 有効化手順

1. Cursor を再起動（MCP 再読込）
2. Settings → MCP → `chrome-devtools` が **緑** であることを確認
3. 検証:

```powershell
npm run verify:cio-mcp-manifest
npm run cio:mcp:probe
```

## WSL フォールバック

Windows ネイティブで NG のとき:

```powershell
npm run mcp:sync-cursor-windows
```

WSL nvm Node 24 経由で `chrome-devtools-mcp` を起動（`scripts/sync-cursor-mcp-windows-from-wsl.mjs`）。

## 運用メモ

- **7日 dormant 許容**（`scripts/check-mcp-dormancy.mjs`）— 障害切り分け時のみ使用で OK
- 未接続時はチャットに **`MCPスキップ: chrome-devtools 未接続`** を 1 行記録
- 業務改善 Q55（60歳以上 UX）は customize 後に **accessibility-scanner** と併用

## 関連

- `data/cio-mcp-manifest.json` — `recommended` 一覧
- `data/cio-mcp-four-ai-matrix.json` — Composer 許可リスト
- `.cursor/rules/mcp-server-use-triggers.mdc` — トリガー表
