#!/usr/bin/env bash
# cio-shell-quoting-helpers.sh — 複雑 quoting 事故防止 helper（A5・2026-05-07 浜田承認）
#
# 使い方:
#   source scripts/cio-shell-quoting-helpers.sh
#   cio_run_one_off <shell-script-path>      # 一時 .sh を実行（CRLF 自動除去・bash 経由）
#   cio_gh_runs_failures <limit>             # 直近 N 件の failure を JSON で取得（PowerShell quoting 事故回避）
#   cio_kintone_get_apps                     # MCP 経由 apps 取得（@kintone/mcp-server を spawn）
#
# 設計指針:
#   - 複雑な引用が必要な処理は **このファイル経由 or 別 .sh ファイル経由** で実行する。
#   - Windows 側 PowerShell から `wsl ... bash -lc "..."` の中に複雑な `\"\\(...)\"` を直書きしない。
#   - 既存の scripts/tmp-*.sh パターン（一時スクリプト）は本 helper の前身。
#
# 注意:
#   - 本 helper は WSL 内 / Linux のみで動作。Windows 側からは scripts/tmp-*.sh ファイルを
#     書き出してから `wsl bash <script>` で呼ぶこと（quoting 事故の根本回避）。
set -e

cio_run_one_off() {
  local script="$1"
  if [ ! -f "$script" ]; then
    echo "❌ cio_run_one_off: $script not found" >&2
    return 1
  fi
  # CRLF が混入していたら除去（Windows 経由で書かれた可能性）
  if grep -q $'\r' "$script" 2>/dev/null; then
    sed -i 's/\r$//' "$script"
  fi
  /bin/bash "$script"
}

cio_gh_runs_failures() {
  local limit="${1:-30}"
  if ! command -v gh >/dev/null 2>&1; then
    echo "❌ gh CLI not found" >&2
    return 1
  fi
  local tmp
  tmp=$(mktemp)
  gh run list --limit "$limit" --json databaseId,conclusion,name,createdAt,headBranch,event >"$tmp"
  python3 - "$tmp" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    xs = json.load(f)
fails = [x for x in xs if x["conclusion"] not in ("success", None, "skipped")]
print(f"FAIL_COUNT={len(fails)}  TOTAL={len(xs)}")
for x in fails:
    print(f"  {x['createdAt']}  {x['conclusion']}  {x['name']}  id={x['databaseId']}  branch={x['headBranch']}")
PY
  rm -f "$tmp"
}

cio_kintone_get_apps() {
  local limit="${1:-5}"
  if [ -z "${KINTONE_BASE_URL:-}" ]; then
    export KINTONE_BASE_URL="https://jbis-kintone.cybozu.com"
  fi
  if [ -z "${KINTONE_USERNAME:-}" ]; then
    export KINTONE_USERNAME="admin"
  fi
  if [ -z "${KINTONE_PASSWORD:-}" ]; then
    export KINTONE_PASSWORD="kent2511"
  fi
  node scripts/cio-mcp-quickprobe.mjs kintone
}

# 直接実行された場合は使い方を表示
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  echo "cio-shell-quoting-helpers.sh — 複雑 quoting 事故防止 helper"
  echo ""
  echo "使い方: source scripts/cio-shell-quoting-helpers.sh"
  echo ""
  echo "  cio_run_one_off <shell-script-path>"
  echo "  cio_gh_runs_failures <limit=30>"
  echo "  cio_kintone_get_apps <limit=5>"
fi
