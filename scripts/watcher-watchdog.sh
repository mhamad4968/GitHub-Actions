#!/usr/bin/env bash
# watcher-watchdog.sh — file-watcher が死んでたら起動する番犬
#
# 推奨運用: cron 5 分ごと
#   */5 * * * * /home/mhamada202408224/kintone-ai-lab/scripts/watcher-watchdog.sh >> /home/mhamada202408224/kintone-ai-lab/logs/file-watcher/watchdog.log 2>&1

set -u

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_V24_BIN="${HOME}/.nvm/versions/node/v24.14.1/bin"
WATCHER_SCRIPT="${REPO_ROOT}/scripts/file-watcher.mjs"
LOG="${REPO_ROOT}/logs/file-watcher/watcher.log"

mkdir -p "${REPO_ROOT}/logs/file-watcher"

if pgrep -f "scripts/file-watcher.mjs" > /dev/null; then
  # 既に起動中。何もしない（ログも出さない、ノイズ防止）
  exit 0
fi

# 起動
echo "[$(date '+%Y-%m-%d %H:%M:%S')] file-watcher が停止していたので再起動"
cd "${REPO_ROOT}" || exit 1
nohup "${NODE_V24_BIN}/node" "${WATCHER_SCRIPT}" >> "${LOG}" 2>&1 &
NEW_PID=$!
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 起動完了 PID=${NEW_PID}"
