#!/usr/bin/env bash
# Cursor の「kintone」MCP（@kintone/mcp-server）を stdio で起動するブリッジ。
# Windows の npx 直起動で read ECONNRESET になる場合に、WSL＋固定バージョン＋.env 読込で安定化する。
#
# ~/.cursor/mcp.json の kintone サーバから:
#   wsl.exe ... bash /home/mhamada202408224/kintone-ai-lab/scripts/mcp-kintone-stdio.sh
#
# 読むファイル: $KINTONE_AI_LAB_ROOT/.env および .env.proxy（存在時のみ）
# 任意: KINTONE_MCP_SERVER_VERSION（既定 1.3.12。追試時のみ @kintone/mcp-server の版を上げる）

set -euo pipefail
ROOT="${KINTONE_AI_LAB_ROOT:-/home/mhamada202408224/kintone-ai-lab}"
# @kintone/mcp-server は engines で Node >= 22 必須。WSL が Windows の Node 18 を PATH で先に拾うと起動直後に落ち、Cursor では ECONNRESET に見える。
NODE_HOME="${KINTONE_MCP_NODE_HOME:-/home/mhamada202408224/.nvm/versions/node/v24.14.1}"
export PATH="${NODE_HOME}/bin:/usr/bin:/bin"
NPX="${NODE_HOME}/bin/npx"

for f in "$ROOT/.env" "$ROOT/.env.proxy"; do
  if [[ -f "$f" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$f"
    set +a
  fi
done

if [[ -z "${KINTONE_BASE_URL:-}" || -z "${KINTONE_USERNAME:-}" || -z "${KINTONE_PASSWORD:-}" ]]; then
  echo "mcp-kintone-stdio: KINTONE_BASE_URL / USERNAME / PASSWORD must be set (via $ROOT/.env)" >&2
  exit 1
fi

VER="${KINTONE_MCP_SERVER_VERSION:-1.3.12}"
exec "$NPX" -y "@kintone/mcp-server@${VER}"
