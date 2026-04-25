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
    echo "📦 git hooks インストール開始..."
    INSTALLED=0
    for hook in "$SOURCE_DIR"/*; do
      name="$(basename "$hook")"
      target="$TARGET_DIR/$name"

      if [ -e "$target" ] && [ ! -L "$target" ]; then
        echo "  ⚠️  $name は既存の非 symlink ファイル → $target.bak へ退避"
        mv "$target" "$target.bak.$(date +%s)"
      fi

      chmod +x "$hook"
      ln -sf "$REPO_ROOT/$hook" "$target"
      echo "  ✅ $name → $target"
      INSTALLED=$((INSTALLED + 1))
    done
    echo ""
    echo "✅ インストール完了 ($INSTALLED 件)"
    echo ""
    echo "動作確認: 適当なファイルを編集して commit すると post-commit hook が走る"
    echo "ログ: logs/git-hooks/post-commit.log"
    ;;
  --uninstall|uninstall)
    echo "🗑  git hooks アンインストール開始..."
    REMOVED=0
    for hook in "$SOURCE_DIR"/*; do
      name="$(basename "$hook")"
      target="$TARGET_DIR/$name"
      if [ -L "$target" ]; then
        rm "$target"
        echo "  ✅ $name 削除"
        REMOVED=$((REMOVED + 1))
      fi
    done
    echo ""
    echo "✅ アンインストール完了 ($REMOVED 件)"
    ;;
  *)
    echo "Usage: $0 [install|--uninstall]"
    exit 1
    ;;
esac
