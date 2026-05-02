#!/usr/bin/env bash
# install-hooks.sh — git hooks インストーラ (TSB-016 改善案 #20 / I-9)
#
# .git/hooks/ は git 管理外のため、リポジトリ管理下の git-hooks/ から symlink を作成する。
#
# 使い方: bash scripts/install-hooks.sh
# アンインストール: bash scripts/install-hooks.sh --uninstall

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

SOURCE_DIR="git-hooks"
TARGET_DIR=".git/hooks"
ACTION="${1:-install}"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ $SOURCE_DIR ディレクトリが見つかりません"
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "❌ $TARGET_DIR が見つかりません (git リポジトリではない?)"
  exit 1
fi

case "$ACTION" in
  install)
    echo "📦 git hooks → Node インストーラへ委譲（Windows 互換コピー）..."
    exec node "$REPO_ROOT/scripts/install-git-hooks.mjs"
    ;;
  --uninstall|uninstall)
    echo "🗑  git hooks アンインストール（Node）..."
    exec node "$REPO_ROOT/scripts/install-git-hooks.mjs" --uninstall
    ;;
  *)
    echo "Usage: $0 [install|--uninstall]"
    exit 1
    ;;
esac
