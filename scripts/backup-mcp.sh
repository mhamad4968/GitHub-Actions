#!/bin/bash
# MCP 設定・カスタムサーバーの自動バックアップ
# 用途: cron / 手動 / Cursor 起動時に実行
# 保存先: kintone-ai-lab/backups/mcp/

set -euo pipefail

BACKUP_BASE="/home/mhamada202408224/kintone-ai-lab/backups/mcp"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${BACKUP_BASE}/${TIMESTAMP}"

mkdir -p "${BACKUP_DIR}"

# 1. mcp.json（最重要）
cp /home/mhamada202408224/.cursor/mcp.json "${BACKUP_DIR}/mcp.json" 2>/dev/null && \
  echo "[OK] mcp.json" || echo "[SKIP] mcp.json not found"

# 2. カスタム MCP サーバーのソースコード
for src in \
  /home/mhamada202408224/.cursor/kntn-dev-mcp/mcp-entry.mjs \
  /home/mhamada202408224/.cursor/kntn-dev-mcp/package.json \
  /home/mhamada202408224/.cursor/kintone-space-mcp/index.mjs \
  /home/mhamada202408224/.cursor/kintone-space-mcp/package.json \
  /home/mhamada202408224/.cursor/mcp-github-wrapper.ps1
do
  if [ -f "$src" ]; then
    rel=$(echo "$src" | sed 's|/home/mhamada202408224/.cursor/||')
    mkdir -p "${BACKUP_DIR}/$(dirname "$rel")"
    cp "$src" "${BACKUP_DIR}/${rel}"
    echo "[OK] ${rel}"
  fi
done

# 3. latest シンボリックリンクを更新
ln -sfn "${TIMESTAMP}" "${BACKUP_BASE}/latest"

# 4. 古いバックアップを30世代まで保持
cd "${BACKUP_BASE}"
ls -dt [0-9]* 2>/dev/null | tail -n +31 | xargs rm -rf 2>/dev/null || true

echo ""
echo "Backup complete: ${BACKUP_DIR}"
echo "Latest link: ${BACKUP_BASE}/latest -> ${TIMESTAMP}"
ls -la "${BACKUP_DIR}/"
