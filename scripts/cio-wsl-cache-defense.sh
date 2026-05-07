#!/usr/bin/env bash
# cio-wsl-cache-defense.sh — WSL$ ファイルキャッシュ事故防衛（A3・2026-05-07 浜田承認）
#
# 使い方:
#   bash scripts/cio-wsl-cache-defense.sh           # .cio/cache-sensitive-files.txt の全ファイルをチェック
#   bash scripts/cio-wsl-cache-defense.sh <FILE>    # 特定ファイル単独チェック
#
# 観点（自動 pull はしない・警告のみ）:
#   1. origin/main の HEAD を git fetch（破壊的でない）
#   2. リスト内のファイルそれぞれについて:
#      - ローカル HEAD と origin/main で内容差があるか（=ローカルが乗り遅れている）
#      - 直近 60 秒以内に origin/main に新規 commit が入ったか（高頻度 auto-commit 警戒）
#   3. 警告を出したら、ユーザに git pull を促す（自動実行しない）
#
# 終了コード: 0=安全 / 1=警告あり（pull 推奨） / 2=リスト読み込み失敗
set -e
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

LIST=".cio/cache-sensitive-files.txt"
if [ ! -f "$LIST" ]; then
  echo "❌ $LIST not found（A3 リスト未設置）" >&2
  exit 2
fi

target_arg="${1:-}"

git fetch origin --quiet 2>/dev/null || {
  echo "⚠️  git fetch origin 失敗（オフライン？）— ローカル HEAD のみで継続" >&2
}

local_head=$(git rev-parse HEAD 2>/dev/null || echo "")
remote_head=$(git rev-parse origin/main 2>/dev/null || echo "")
ahead_behind=$(git rev-list --count --left-right HEAD...origin/main 2>/dev/null || echo "0	0")
behind=$(echo "$ahead_behind" | awk '{print $2}')

warn=0
echo "[cio-wsl-cache-defense] local=$local_head  origin/main=$remote_head  behind=$behind"

# 直近 60 秒以内に origin/main に commit が入ったか
recent_unix=$(date -u -d '60 seconds ago' +%s 2>/dev/null || echo "0")
recent_iso=$(date -u -d '60 seconds ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "")
recent_commit=""
if [ -n "$recent_iso" ]; then
  recent_commit=$(git log origin/main --since="$recent_iso" --oneline 2>/dev/null | head -3)
fi
if [ -n "$recent_commit" ]; then
  echo "⚠️  直近 60 秒以内に origin/main に新規 commit:" >&2
  echo "$recent_commit" >&2
  echo "  → 書き込み前に git pull --rebase を強く推奨（A3 規律）" >&2
  warn=$((warn + 1))
fi

if [ "$behind" != "0" ]; then
  echo "⚠️  ローカル HEAD は origin/main から $behind commit 遅れています" >&2
  echo "  → git pull --rebase を実行してから書き込みを推奨" >&2
  warn=$((warn + 1))
fi

# リスト or 単独ファイルのキャッシュ整合性
files_to_check=()
if [ -n "$target_arg" ]; then
  files_to_check=("$target_arg")
else
  while IFS= read -r line; do
    line=$(echo "$line" | sed 's/#.*$//' | xargs)
    [ -z "$line" ] && continue
    files_to_check+=("$line")
  done <"$LIST"
fi

stale=0
for f in "${files_to_check[@]}"; do
  [ ! -f "$f" ] && continue
  local_size=$(wc -c <"$f")
  origin_size=$(git cat-file -p "origin/main:$f" 2>/dev/null | wc -c || echo 0)
  if [ "$local_size" != "$origin_size" ]; then
    diff_lines=$(diff <(cat "$f" 2>/dev/null) <(git cat-file -p "origin/main:$f" 2>/dev/null) | head -1)
    if [ -n "$diff_lines" ]; then
      echo "  ℹ️  $f  local_size=$local_size origin_size=$origin_size (差分あり・想定内なら問題なし)"
    fi
  fi
done

echo "[cio-wsl-cache-defense] warn=$warn  files_checked=${#files_to_check[@]}"
if [ "$warn" -gt 0 ]; then
  echo "" >&2
  echo "⚠️  WSL$ ファイルキャッシュ事故防衛: 上記の警告に応じて git pull --rebase を実行してください。" >&2
  echo "    StrReplace を WSL 経由で実行する場合は、pull 後に Read で再確認してから書き込むこと。" >&2
  exit 1
fi
exit 0
