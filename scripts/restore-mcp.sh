#!/bin/bash
# MCP 設定・カスタムサーバーの復旧
# 用途: mcp.json が空になった / MCP が消えた場合
#
# 使い方:
#   bash scripts/restore-mcp.sh          # latest バックアップから復旧
#   bash scripts/restore-mcp.sh 20260414-213323  # 指定バックアップから復旧

set -euo pipefail

BACKUP_BASE="/home/mhamada202408224/kintone-ai-lab/backups/mcp"
VERSION="${1:-latest}"

if [ "$VERSION" = "latest" ]; then
  RESTORE_DIR=$(readlink -f "${BACKUP_BASE}/latest" 2>/dev/null || echo "")
else
  RESTORE_DIR="${BACKUP_BASE}/${VERSION}"
fi

if [ -z "$RESTORE_DIR" ] || [ ! -d "$RESTORE_DIR" ]; then
  echo "ERROR: Backup not found: ${VERSION}"
  echo "Available backups:"
  ls -1 "${BACKUP_BASE}/" 2>/dev/null | grep -v latest
  exit 1
fi

echo "Restoring from: ${RESTORE_DIR}"
echo ""

# 1. mcp.json の復旧
if [ -f "${RESTORE_DIR}/mcp.json" ]; then
  CURRENT_SIZE=$(wc -c < /home/mhamada202408224/.cursor/mcp.json 2>/dev/null || echo "0")
  BACKUP_SIZE=$(wc -c < "${RESTORE_DIR}/mcp.json")

  if [ "$CURRENT_SIZE" -gt 100 ]; then
    echo "[WARN] Current mcp.json is ${CURRENT_SIZE} bytes (not empty)."
    echo "       Backup mcp.json is ${BACKUP_SIZE} bytes."
    read -p "       Overwrite? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
      echo "[SKIP] mcp.json (user cancelled)"
    else
      cp "${RESTORE_DIR}/mcp.json" /home/mhamada202408224/.cursor/mcp.json
      echo "[OK] mcp.json restored"
    fi
  else
    cp "${RESTORE_DIR}/mcp.json" /home/mhamada202408224/.cursor/mcp.json
    echo "[OK] mcp.json restored (was empty/missing)"
  fi
else
  echo "[SKIP] No mcp.json in backup"
fi

# 2. カスタム MCP サーバーの復旧
for rel in \
  kntn-dev-mcp/mcp-entry.mjs \
  kntn-dev-mcp/package.json \
  kintone-space-mcp/index.mjs \
  kintone-space-mcp/package.json \
  mcp-github-wrapper.ps1
do
  src="${RESTORE_DIR}/${rel}"
  dst="/home/mhamada202408224/.cursor/${rel}"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "[OK] ${rel}"
  fi
done

# 3. node_modules の復旧チェック
for dir in kntn-dev-mcp kintone-space-mcp; do
  pkg="/home/mhamada202408224/.cursor/${dir}/package.json"
  nm="/home/mhamada202408224/.cursor/${dir}/node_modules"
  if [ -f "$pkg" ] && [ ! -d "$nm" ]; then
    echo "[FIX] ${dir}: node_modules missing, running npm install..."
    cd "/home/mhamada202408224/.cursor/${dir}" && npm install --silent 2>&1
  fi
done

echo ""
echo "Restore complete. Restart Cursor to apply."
echo ""

# 4. 復旧後の検証コマンドを表示
echo "=== Verification commands ==="
echo "node -e \"const j=require('/home/mhamada202408224/.cursor/mcp.json');console.log(Object.keys(j.mcpServers).length,'servers')\""
echo ""
echo "Test each server:"
echo "  echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2024-11-05\",\"capabilities\":{},\"clientInfo\":{\"name\":\"test\",\"version\":\"1.0\"}}}' | timeout 10 <command>"
