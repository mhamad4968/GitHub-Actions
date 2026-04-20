#!/bin/bash
# MCP 全サーバーのヘルスチェック
# 用途: 起動直後に全サーバーが生きているか一括確認
#
# 使い方:
#   bash scripts/check-mcp.sh        # 全サーバー確認
#   bash scripts/check-mcp.sh quick  # mcp.json の存在確認のみ

set -euo pipefail

MCP_JSON="/home/mhamada202408224/.cursor/mcp.json"
INIT='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"healthcheck","version":"1.0"}}}'

# mcp.json の基本チェック
echo "=== MCP Configuration Check ==="
if [ ! -f "$MCP_JSON" ]; then
  echo "CRITICAL: mcp.json not found!"
  echo "Run: bash scripts/restore-mcp.sh"
  exit 1
fi

SIZE=$(wc -c < "$MCP_JSON")
if [ "$SIZE" -lt 100 ]; then
  echo "CRITICAL: mcp.json is empty or corrupted (${SIZE} bytes)"
  echo "Run: bash scripts/restore-mcp.sh"
  exit 1
fi

SERVER_COUNT=$(node -e "console.log(Object.keys(require('$MCP_JSON').mcpServers).length)")
echo "mcp.json: ${SIZE} bytes, ${SERVER_COUNT} servers"

if [ "${1:-}" = "quick" ]; then
  echo ""
  node -e "
    const j = require('$MCP_JSON');
    Object.entries(j.mcpServers).forEach(([name, cfg]) => {
      const status = cfg.disabled ? 'DISABLED' : 'ACTIVE';
      console.log('  ' + status.padEnd(10) + name);
    });
  "
  exit 0
fi

echo ""
echo "=== Protocol Handshake Test ==="

# テスト対象のサーバーと起動コマンド
declare -A TESTS
TESTS[kintone-dev]="node /home/mhamada202408224/.cursor/kntn-dev-mcp/mcp-entry.mjs"
TESTS[kintone-space]="env KINTONE_BASE_URL=https://jbis-kintone.cybozu.com KINTONE_USERNAME=admin KINTONE_PASSWORD=kent2511 node /home/mhamada202408224/.cursor/kintone-space-mcp/index.mjs"
TESTS[fetch]="python3 -m mcp_server_fetch"
TESTS[cve-search]="bash -c 'cd /home/mhamada202408224/.cursor/cve-search_mcp && uv run main.py'"

OK=0
NG=0

for name in "${!TESTS[@]}"; do
  result=$(echo "$INIT" | timeout 10 bash -c "${TESTS[$name]}" 2>/dev/null | head -1)
  if echo "$result" | grep -q '"serverInfo"' 2>/dev/null; then
    echo "  OK    $name"
    ((OK++))
  else
    echo "  NG    $name"
    ((NG++))
  fi
done

echo ""
echo "Results: ${OK} OK, ${NG} NG (tested ${#TESTS[@]} of ${SERVER_COUNT} servers)"

if [ "$NG" -gt 0 ]; then
  echo ""
  echo "To restore: bash scripts/restore-mcp.sh"
fi
