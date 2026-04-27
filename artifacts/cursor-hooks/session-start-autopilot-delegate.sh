#!/usr/bin/env bash
# User-global sessionStart: run repo-local session-start-autopilot when present.
# Cursor sets CURSOR_PROJECT_DIR (workspace root). See https://cursor.com/docs/hooks
# 正本運用: ~/.cursor/hooks/session-start-autopilot-delegate.sh（本ファイルはリポへのミラー）
set -euo pipefail

ROOT="${CURSOR_PROJECT_DIR:-}"
if [[ -z "$ROOT" ]]; then ROOT="${CLAUDE_PROJECT_DIR:-}"; fi
if [[ -z "$ROOT" ]]; then
  printf '%s\n' '{"additional_context":""}'
  exit 0
fi

AUTO="${ROOT}/.cursor/hooks/session-start-autopilot.mjs"
if [[ ! -f "$AUTO" ]]; then
  printf '%s\n' '{"additional_context":""}'
  exit 0
fi

mkdir -p "${ROOT}/logs" 2>/dev/null || true
exec node "$AUTO"
