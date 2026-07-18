#!/usr/bin/env bash
# cio-health-check.sh — CIO 健康診断オーケストレータ（A2・2026-05-07 浜田承認）
#
# 使い方: bash scripts/cio-health-check.sh
# または: npm run cio:health
#
# 観点（30 秒以内・破壊的なし）:
#   1. 壁時計（session-clock-web）の URL を /tmp/session-clock-web.log から動的取得 → curl HTTP 200
#   2. session-lock の有無
#   3. WSL 環境（Node/npm バージョン）
#   4. MCP 4 サーバ probe（cio-mcp-quickprobe.mjs）
#   5. git status clean / branch 乗り遅れ
#   6. GitHub Actions 直近 30 件 failure 集計
#   7. EOL 維持チェック（cio-eol-check.sh）
#
# 終了コード: 0=全 GREEN / 1=1 件以上 RED
set -e
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
export PATH=/home/mhamada202408224/.nvm/versions/node/v25.8.2/bin:/home/mhamada202408224/.nvm/versions/node/v24.14.1/bin:/usr/bin:/bin:$PATH

red_count=0
warn_count=0
report=""

ck() {
  local label="$1"
  local cmd="$2"
  local detail="$3"
  if eval "$cmd" >/dev/null 2>&1; then
    report+=$'\n'"  ✅ $label  $detail"
  else
    report+=$'\n'"  ❌ $label  $detail"
    red_count=$((red_count + 1))
  fi
}

echo "[cio-health-check] start"
echo

# 1. 壁時計（self-heal 内蔵 / 2026-05-10: WSL2 短命 init 構造課題への自律対応）
# 仕様:
#   - /tmp/session-clock-web.log の URL から HTTP 200 が取れれば GREEN
#   - 取れない場合は setsid -f で 1 回だけ auto-start 試行（最大 6 秒待機）
#   - 再 curl で 200 取れたら GREEN (auto-healed) と detail に明示（DeepSeek 指摘の「毎回再起動隠蔽」対策）
#   - それでも 200 取れなければ RED（手動再起動コマンドを detail に提示）
clock_get_url() {
  if [ -f /tmp/session-clock-web.log ]; then
    grep -oE 'http://[0-9a-zA-Z.]+:[0-9]+/' /tmp/session-clock-web.log | head -1
  fi
}
clock_http_status() {
  local url="$1"
  if [ -z "$url" ]; then echo "000"; return; fi
  curl -sS --max-time 3 -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000"
}
clock_pid() {
  pgrep -f 'session-clock-web' 2>/dev/null | head -1
}
clock_auto_start() {
  rm -f /tmp/session-clock-web.log
  setsid -f bash -c "SESSION_CLOCK_WEB_HOST=0.0.0.0 npm run session:clock:web > /tmp/session-clock-web.log 2>&1" </dev/null >/dev/null 2>&1 || true
  local i
  for i in 1 2 3 4 5 6; do
    sleep 1
    if [ -f /tmp/session-clock-web.log ] && grep -qE 'http://[0-9a-zA-Z.]+:[0-9]+/' /tmp/session-clock-web.log; then
      return 0
    fi
  done
  return 1
}
clock_url=$(clock_get_url)
clock_status=$(clock_http_status "$clock_url")
clock_healed=""
if [ "$clock_status" != "200" ]; then
  if clock_auto_start; then
    clock_url=$(clock_get_url)
    clock_status=$(clock_http_status "$clock_url")
    clock_healed=" (auto-healed)"
  fi
fi
clock_pid_now=$(clock_pid)
if [ "$clock_status" = "200" ]; then
  report+=$'\n'"  ✅ wall-clock  url=$clock_url HTTP=200 pid=${clock_pid_now:-?}$clock_healed"
else
  report+=$'\n'"  ❌ wall-clock  url=${clock_url:-no_url} HTTP=$clock_status — auto-start failed; manual: setsid -f bash -c 'SESSION_CLOCK_WEB_HOST=0.0.0.0 npm run session:clock:web > /tmp/session-clock-web.log 2>&1'"
  red_count=$((red_count + 1))
fi

# 2. session-lock
if [ -f chat-sessions/SESSION-LOCK.md ]; then
  report+=$'\n'"  ⚠️  session-lock  chat-sessions/SESSION-LOCK.md exists（ロック中）"
  warn_count=$((warn_count + 1))
else
  report+=$'\n'"  ✅ session-lock  unlocked"
fi

# 3. WSL Node/npm
node_ver=$(node --version 2>/dev/null || echo NONE)
npm_ver=$(npm --version 2>/dev/null || echo NONE)
report+=$'\n'"  ✅ env  Node=$node_ver / npm=$npm_ver"

# 4. MCP 4 サーバ probe（env は npx dotenv 経由で .env / .env.proxy から注入）
echo "  [mcp probe] running 4 servers in parallel (~5-60s)..."
if [ -f .env ]; then
  mcp_cmd="npx dotenv -e .env"
  if [ -f .env.proxy ]; then mcp_cmd="$mcp_cmd -e .env.proxy"; fi
  mcp_cmd="$mcp_cmd -- node scripts/cio-mcp-quickprobe.mjs"
else
  mcp_cmd="node scripts/cio-mcp-quickprobe.mjs"
fi
if mcp_out=$(eval "$mcp_cmd" 2>&1); then
  mcp_summary=$(echo "$mcp_out" | grep '^SUMMARY:' || echo "no summary")
  report+=$'\n'"  ✅ mcp  $mcp_summary"
else
  mcp_summary=$(echo "$mcp_out" | grep '^SUMMARY:' || echo "$mcp_out" | tail -1)
  report+=$'\n'"  ❌ mcp  $mcp_summary"
  red_count=$((red_count + 1))
fi

# 5. git status / branch（§51-6: SESSION-CLOCK.md は session:clock:set で毎セッション更新＝正常 dirty）
_git_porcelain() {
  if pwd | grep -qiE '^/mnt/[a-z]/'; then
    if command -v wslpath >/dev/null 2>&1 && command -v git.exe >/dev/null 2>&1; then
      winpath=$(wslpath -w "$(pwd)" 2>/dev/null || true)
      if [ -n "$winpath" ]; then
        if win_git_status=$(git.exe -C "$winpath" status --porcelain 2>/dev/null); then
          printf '%s\n' "$win_git_status" | tr -d '\r'
          return
        fi
      fi
    fi
  fi
  git status --porcelain 2>/dev/null
}
git_status_raw=$(_git_porcelain || true)
git_status=$(echo "$git_status_raw" | awk '
  { f=$0; sub(/^[ MADRCU?!][ MADRCU?!] /, "", f);
    if (f == "chat-sessions/SESSION-CLOCK.md") next;
    if (f ~ /^_rebase-.*\.sh$/) next;
    print $0
  }')
if [ -z "$git_status" ]; then
  report+=$'\n'"  ✅ git-status  clean"
else
  modified=$(echo "$git_status" | wc -l)
  report+=$'\n'"  ⚠️  git-status  modified=$modified files"
  warn_count=$((warn_count + 1))
fi
if git fetch origin --quiet 2>/dev/null; then
  branch=$(git status -sb 2>/dev/null | head -1)
  report+=$'\n'"  ✅ branch  $branch"
fi

# 6. GitHub Actions（直近5件がすべて success かつ latest=success → 運用 OK。last30 の古い failure は参考）
if command -v gh >/dev/null 2>&1; then
  gh_json=$(gh run list --limit 30 --json conclusion,createdAt,name 2>/dev/null || echo '[]')
  gh_stats=$(echo "$gh_json" | python3 -c "
import json,sys
xs=json.load(sys.stdin)
if not xs:
  print('0|0|unknown'); raise SystemExit
bad=lambda c: c in ('failure','timed_out','action_required','startup_failure')
last30=sum(1 for x in xs if bad(x.get('conclusion')))
last5=sum(1 for x in xs[:5] if bad(x.get('conclusion')))
latest=xs[0].get('conclusion') or 'unknown'
print(f'{last30}|{last5}|{latest}')
" 2>/dev/null || echo '0|0|unknown')
  gh_fail30=$(echo "$gh_stats" | cut -d'|' -f1)
  gh_fail5=$(echo "$gh_stats" | cut -d'|' -f2)
  gh_latest=$(echo "$gh_stats" | cut -d'|' -f3)
  if [ "$gh_fail30" = "0" ]; then
    report+=$'\n'"  ✅ gh-actions  last30 failures=0  latest=$gh_latest"
  elif [ "$gh_latest" = "success" ] && [ "$gh_fail5" = "0" ]; then
    report+=$'\n'"  ✅ gh-actions  last5 failures=0  last30 historical=$gh_fail30  latest=$gh_latest"
  elif [ "$gh_latest" = "success" ]; then
    report+=$'\n'"  ⚠️  gh-actions  last5 failures=$gh_fail5  last30=$gh_fail30  latest=$gh_latest"
    warn_count=$((warn_count + 1))
  else
    report+=$'\n'"  ❌ gh-actions  last5 failures=$gh_fail5  last30=$gh_fail30  latest=$gh_latest"
    red_count=$((red_count + 1))
  fi
else
  report+=$'\n'"  ⚠️  gh-actions  gh CLI not found"
  warn_count=$((warn_count + 1))
fi

# 7. EOL 維持（/mnt/c 上の bash 直実行は CRLF 偽陽性 → Windows npm を優先）
_run_eol_check() {
  if pwd | grep -qiE '^/mnt/[a-z]/'; then
    if command -v wslpath >/dev/null 2>&1 && command -v cmd.exe >/dev/null 2>&1; then
      winpath=$(wslpath -w "$(pwd)" 2>/dev/null || true)
      if [ -n "$winpath" ]; then
        cmd.exe /c "cd /d \"$winpath\" && npm run cio:eol:check" 2>&1 | tr -d '\r'
        return $?
      fi
    fi
  fi
  bash scripts/cio-eol-check.sh 2>&1
}
if eol_out=$(_run_eol_check); then
  eol_summary=$(echo "$eol_out" | grep -E 'violations=0|EOL 維持 OK' | head -1)
  if [ -z "$eol_summary" ]; then eol_summary='[cio-eol-check] violations=0'; fi
  report+=$'\n'"  ✅ eol-check  $eol_summary"
else
  report+=$'\n'"  ❌ eol-check  違反あり — 詳細: npm run cio:eol:check"
  red_count=$((red_count + 1))
fi

echo "$report"
echo
echo "[cio-health-check] RED=$red_count  WARN=$warn_count"
if [ "$red_count" -gt 0 ]; then
  exit 1
fi
exit 0
