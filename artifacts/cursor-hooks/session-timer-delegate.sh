#!/usr/bin/env bash
# User-global beforeSubmitPrompt: inject session elapsed / remaining (§51-6-2).
# 正本運用: ~/.cursor/hooks/session-timer-delegate.sh（本ファイルはリポへのミラー）
set -euo pipefail

ROOT="${CURSOR_PROJECT_DIR:-}"
if [[ -z "$ROOT" ]]; then ROOT="${CLAUDE_PROJECT_DIR:-}"; fi
if [[ -z "$ROOT" ]]; then
  printf '%s\n' '{"additional_context":""}'
  exit 0
fi

CLI="${ROOT}/scripts/session-clock.mjs"
if [[ ! -f "$CLI" ]]; then
  printf '%s\n' '{"additional_context":""}'
  exit 0
fi

exec node "$CLI" prompt-hook
