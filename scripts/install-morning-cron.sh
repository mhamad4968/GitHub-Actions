#!/usr/bin/env bash
# install-morning-cron.sh — 毎朝 06:00 (JST) cron に daily-morning-prep を登録
#
# 安全装置:
#   - Cursor 内蔵 Node v20 の干渉を避けるため NVM v24 絶対パスで登録
#   - 既存の同名エントリがあれば置換
#
# 実行: bash scripts/install-morning-cron.sh
# 削除: crontab -l | grep -v daily-morning-prep | crontab -

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_V24_BIN="${HOME}/.nvm/versions/node/v24.14.1/bin"

if [ ! -x "${NODE_V24_BIN}/node" ]; then
  echo "ERROR: NVM v24 not found at ${NODE_V24_BIN}/node" >&2
  echo "  → run: nvm install 24" >&2
  exit 1
fi

CRON_LINE="0 6 * * * cd ${REPO_ROOT} && PATH=${NODE_V24_BIN}:${NODE_V24_BIN}:/usr/bin:/bin ${NODE_V24_BIN}/node scripts/daily-morning-prep.mjs >> ${REPO_ROOT}/logs/morning-prep/cron.log 2>&1 # kintone-ai-lab daily-morning-prep"

# wipe-guard (15 分ごと) と emergency-mirror (4 時間ごと) も同時に登録
WIPE_GUARD_LINE="*/15 * * * * cd ${REPO_ROOT} && PATH=${NODE_V24_BIN}:/usr/bin:/bin ${NODE_V24_BIN}/node scripts/wipe-guard.mjs >> ${REPO_ROOT}/logs/wipe-guard/cron.log 2>&1 # wipe-guard"
MIRROR_LINE="17 */4 * * * cd ${REPO_ROOT} && PATH=${NODE_V24_BIN}:/usr/bin:/bin ${NODE_V24_BIN}/node scripts/emergency-mirror.mjs >> ${REPO_ROOT}/logs/wipe-guard/mirror.log 2>&1 # emergency-mirror"

mkdir -p "${REPO_ROOT}/logs/morning-prep" "${REPO_ROOT}/logs/wipe-guard" "${REPO_ROOT}/logs/file-watcher"

# 既存エントリを除去してから追加
( crontab -l 2>/dev/null | grep -v "daily-morning-prep\|wipe-guard\|emergency-mirror" ; echo "${CRON_LINE}" ; echo "${WIPE_GUARD_LINE}" ; echo "${MIRROR_LINE}" ) | crontab -

echo "[OK] cron registered:"
echo "  - daily-morning-prep (06:00 JST 毎日)"
echo "  - wipe-guard (15 分ごと・空ファイル検知 + 自動復元)"
echo "  - emergency-mirror (4 時間ごと・~/.cursor-emergency-backup/ にミラー)"
echo ""
echo "確認: crontab -l"
echo "削除: crontab -l | grep -vE 'daily-morning-prep|wipe-guard|emergency-mirror' | crontab -"
echo ""
echo "file-watcher (常駐型) は別途起動が必要:"
echo "  npm run watcher:start"
