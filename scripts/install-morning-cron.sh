#!/usr/bin/env bash
# install-morning-cron.sh — 毎朝 06:00 (JST) cron に daily-morning-prep を登録
#                     ＋ S14 月初セキュリティ巡回（monthly-security-rounds）を同じ NVM（.nvmrc）で登録
#
# 安全装置:
#   - Cursor 内蔵 Node 等の干渉を避けるため、`.nvmrc` に合う NVM の絶対パスで登録
#   - 既存の同名エントリがあれば置換
#
# 実行: bash scripts/install-morning-cron.sh
# 削除: crontab -l | grep -v daily-morning-prep | crontab -

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_BIN_DIR="$(bash "${REPO_ROOT}/scripts/print-nvm-node-bin.sh")"

if [ ! -x "${NODE_BIN_DIR}/node" ]; then
  echo "ERROR: NVM node not executable at ${NODE_BIN_DIR}/node" >&2
  exit 1
fi

CRON_LINE="0 6 * * * cd ${REPO_ROOT} && PATH=${NODE_BIN_DIR}:${NODE_BIN_DIR}:/usr/bin:/bin ${NODE_BIN_DIR}/node scripts/daily-morning-prep.mjs >> ${REPO_ROOT}/logs/morning-prep/cron.log 2>&1 # kintone-ai-lab daily-morning-prep"

# wipe-guard (15 分ごと) と emergency-mirror (4 時間ごと) も同時に登録
WIPE_GUARD_LINE="*/15 * * * * cd ${REPO_ROOT} && PATH=${NODE_BIN_DIR}:/usr/bin:/bin ${NODE_BIN_DIR}/node scripts/wipe-guard.mjs >> ${REPO_ROOT}/logs/wipe-guard/cron.log 2>&1 # wipe-guard"
MIRROR_LINE="17 */4 * * * cd ${REPO_ROOT} && PATH=${NODE_BIN_DIR}:/usr/bin:/bin ${NODE_BIN_DIR}/node scripts/emergency-mirror.mjs >> ${REPO_ROOT}/logs/wipe-guard/mirror.log 2>&1 # emergency-mirror"
# 2026-04-21 制定 #R12: 健康状態こまめに自動チェック + 自動修復 (浜田指示)
HEALTH_CHECK_LINE="33 */4 * * * cd ${REPO_ROOT} && PATH=${NODE_BIN_DIR}:/usr/bin:/bin ${NODE_BIN_DIR}/node scripts/health-check.mjs >> ${REPO_ROOT}/logs/health/cron.log 2>&1 # health-check-4h"
AUTO_HEAL_LINE="43 */4 * * * cd ${REPO_ROOT} && PATH=${NODE_BIN_DIR}:/usr/bin:/bin ${NODE_BIN_DIR}/node scripts/auto-heal.mjs >> ${REPO_ROOT}/logs/heal/cron.log 2>&1 # auto-heal-4h"

# S14: 毎月 1 日 06:30 JST（朝ブリーフ 06:00 の直後想定）— NODE は `.nvmrc` 解決（print-nvm-node-bin.sh）
SECURITY_ROUNDS_LINE="30 6 1 * * cd ${REPO_ROOT} && PATH=${NODE_BIN_DIR}:${HOME}/.local/bin:/usr/bin:/bin ${NODE_BIN_DIR}/node scripts/monthly-security-rounds.mjs >> ${REPO_ROOT}/logs/security-rounds/cron.log 2>&1 # monthly-security-rounds"

mkdir -p "${REPO_ROOT}/logs/morning-prep" "${REPO_ROOT}/logs/wipe-guard" "${REPO_ROOT}/logs/file-watcher" "${REPO_ROOT}/logs/security-rounds"

# 既存エントリを除去してから追加（monthly-security も本スクリプトが再登録する）
( crontab -l 2>/dev/null | grep -v "daily-morning-prep\|wipe-guard\|emergency-mirror\|health-check-4h\|auto-heal-4h\|monthly-security-rounds" ; echo "${CRON_LINE}" ; echo "${WIPE_GUARD_LINE}" ; echo "${MIRROR_LINE}" ; echo "${HEALTH_CHECK_LINE}" ; echo "${AUTO_HEAL_LINE}" ; echo "${SECURITY_ROUNDS_LINE}" ) | crontab -

echo "[OK] cron registered:"
echo "  - daily-morning-prep (06:00 JST 毎日)"
echo "  - wipe-guard (15 分ごと・空ファイル検知 + 自動復元)"
echo "  - emergency-mirror (4 時間ごと・~/.cursor-emergency-backup/ にミラー)"
echo "  - monthly-security-rounds (毎月 1 日 06:30 JST / .nvmrc の node)"
echo ""
echo "確認: crontab -l"
echo "削除: crontab -l | grep -vE 'daily-morning-prep|wipe-guard|emergency-mirror' | crontab -"
echo ""
echo "file-watcher (常駐型) は別途起動が必要:"
echo "  npm run watcher:start"
