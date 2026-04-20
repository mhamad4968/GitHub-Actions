# MCP 消失時の復旧手順書

## 想定される障害パターン

| パターン | 症状 | 原因 |
|---|---|---|
| A. mcp.json 消失/空化 | MCPツールが一切出てこない | Cursor アップデート、設定リセット、ファイル破損 |
| B. カスタムサーバーのソース消失 | 特定サーバーだけ赤ランプ | ディスクリーンアップ、誤削除 |
| C. npm パッケージの互換性破壊 | 特定サーバーが起動直後にクラッシュ | Node.js メジャーアップデート、パッケージ非互換 |
| D. 環境変数の欠落 | kintone 系サーバーが認証エラー | env ブロック消失 |

## 復旧手順

### Step 1: 状況確認（30秒）

```bash
bash scripts/check-mcp.sh quick
```

出力が `CRITICAL: mcp.json not found` → Step 2a
出力にサーバー一覧が出る → Step 2b

### Step 2a: mcp.json ごと消失した場合

```bash
bash scripts/restore-mcp.sh
```

latest バックアップから mcp.json + カスタムサーバーソースを一括復旧。
復旧後 Cursor を再起動。

### Step 2b: 特定サーバーだけ赤い場合

```bash
bash scripts/check-mcp.sh
```

NG が出たサーバーを個別に診断:

```bash
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
echo "$INIT" | timeout 10 <サーバーのcommand> <args> 2>&1
```

エラーメッセージから原因を特定し、以下を確認:
- ファイルが存在するか（`ls -la <path>`）
- node_modules があるか（なければ `npm install`）
- 環境変数が設定されているか（`env | grep KINTONE`）

### Step 3: カスタムサーバーの復旧

バックアップからソースをコピー:
```bash
# kintone-dev
cp backups/mcp/latest/kntn-dev-mcp/* ~/.cursor/kntn-dev-mcp/

# kintone-space
cp backups/mcp/latest/kintone-space-mcp/* ~/.cursor/kintone-space-mcp/
cd ~/.cursor/kintone-space-mcp && npm install
```

### Step 4: 検証

```bash
bash scripts/check-mcp.sh
```

全サーバー OK を確認 → Cursor 再起動

## バックアップ体制

| 項目 | 方法 |
|---|---|
| **日次自動** | cron で毎日 `backup-mcp.sh` を実行（30世代保持） |
| **手動** | MCP 設定を変更した後に `bash scripts/backup-mcp.sh` |
| **バックアップ先** | `kintone-ai-lab/backups/mcp/<YYYYMMDD-HHMMSS>/` |
| **最新へのリンク** | `kintone-ai-lab/backups/mcp/latest/` |

## バックアップに含まれるもの

- `mcp.json`（全サーバーの設定。API キー含む）
- `kntn-dev-mcp/mcp-entry.mjs` + `package.json`
- `kintone-space-mcp/index.mjs` + `package.json`
- `mcp-github-wrapper.ps1`

## カスタム MCP サーバー一覧（自作・ソース管理必須）

| サーバー | ソースの場所 | 依存 |
|---|---|---|
| kintone-dev | `~/.cursor/kntn-dev-mcp/mcp-entry.mjs` | `@modelcontextprotocol/sdk` |
| kintone-space | `~/.cursor/kintone-space-mcp/index.mjs` | `@modelcontextprotocol/sdk`, `dotenv` |

## npx 系サーバー（復旧不要、自動ダウンロード）

`@kintone/mcp-server`, `@modelcontextprotocol/server-filesystem`, `@playwright/mcp` 等は npm から自動取得されるため、mcp.json さえ復旧すれば自動復帰する。

## 予防策

1. **mcp.json 変更後は必ず `bash scripts/backup-mcp.sh`**
2. **Cursor アップデート前にバックアップ確認**
3. **カスタムサーバーのコード変更時もバックアップ**
4. **Node.js メジャーアップデート時は全サーバーの起動テスト**
