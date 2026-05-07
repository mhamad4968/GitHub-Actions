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

# 1. 壁時計
clock_url=""
if [ -f /tmp/session-clock-web.log ]; then
  clock_url=$(grep -oE 'http://[0-9a-zA-Z.]+:[0-9]+/' /tmp/session-clock-web.log | head -1)
fi
if [ -n "$clock_url" ]; then
  if curl -sS --max-time 3 -o /dev/null -w '%{http_code}' "$clock_url" 2>/dev/null | grep -q '^200$'; then
    report+=$'\n'"  ✅ wall-clock  url=$clock_url HTTP=200"
  else
    report+=$'\n'"  ❌ wall-clock  url=$clock_url HTTP!=200 — 起動: setsid -f bash -c 'SESSION_CLOCK_WEB_HOST=0.0.0.0 npm run session:clock:web > /tmp/session-clock-web.log 2>&1' < /dev/null"
    red_count=$((red_count + 1))
  fi
else
  report+=$'\n'"  ⚠️  wall-clock  /tmp/session-clock-web.log not found — npm run session:clock:web を再起動してください"
  warn_count=$((warn_count + 1))
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

# 5. git status / branch
git_status=$(git status --porcelain 2>/dev/null)
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

# 6. GitHub Actions 直近 failure（最新が success なら過去失敗は warn・最新も failure なら red）
if command -v gh >/dev/null 2>&1; then
  gh_json=$(gh run list --limit 30 --json conclusion,createdAt,name 2>/dev/null || echo '[]')
  gh_fail=$(echo "$gh_json" | python3 -c "import json,sys; xs=json.load(sys.stdin); fs=[x for x in xs if x['conclusion'] not in ('success',None,'skipped')]; print(len(fs))" 2>/dev/null || echo 0)
  gh_latest=$(echo "$gh_json" | python3 -c "import json,sys; xs=json.load(sys.stdin); print(xs[0]['conclusion'] if xs else 'unknown')" 2>/dev/null || echo unknown)
  if [ "$gh_fail" = "0" ]; then
    report+=$'\n'"  ✅ gh-actions  last30 failures=0  latest=$gh_latest"
  elif [ "$gh_latest" = "success" ]; then
    report+=$'\n'"  ⚠️  gh-actions  last30 failures=$gh_fail  latest=success（修正済みの可能性・gh run list で詳細確認）"
    warn_count=$((warn_count + 1))
  else
    report+=$'\n'"  ❌ gh-actions  last30 failures=$gh_fail  latest=$gh_latest（未解決の可能性・gh run list で詳細確認）"
    red_count=$((red_count + 1))
  fi
else
  report+=$'\n'"  ⚠️  gh-actions  gh CLI not found"
  warn_count=$((warn_count + 1))
fi

# 7. EOL 維持
if eol_out=$(bash scripts/cio-eol-check.sh 2>&1); then
  eol_summary=$(echo "$eol_out" | head -1)
  report+=$'\n'"  ✅ eol-check  $eol_summary"
else
  report+=$'\n'"  ❌ eol-check  違反あり — 詳細: bash scripts/cio-eol-check.sh"
  red_count=$((red_count + 1))
fi

echo "$report"
echo
echo "[cio-health-check] RED=$red_count  WARN=$warn_count"
if [ "$red_count" -gt 0 ]; then
  exit 1
fi
exit 0
