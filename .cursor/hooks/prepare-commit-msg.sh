#!/bin/sh
# prepare-commit-msg — Kimi 4要素ガバナンスブロック（第11層・タスク②）
# git-hooks/prepare-commit-msg と同一。hooks:install は git-hooks/ をコピー。

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$REPO_ROOT" || exit 0

MSG_FILE="$1"

if [ ! -f scripts/cio-commit-msg-kimi-draft.mjs ]; then
  exit 0
fi

if command -v node >/dev/null 2>&1; then
  node scripts/cio-commit-msg-kimi-draft.mjs "$MSG_FILE"
  exit $?
fi
exit 0
