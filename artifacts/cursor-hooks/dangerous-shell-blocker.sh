#!/bin/bash
# Snapshot copy for git backup (2026-04-26). Canonical runtime path remains ~/.cursor/hooks/dangerous-shell-blocker.sh
# dangerous-shell-blocker.sh
# Cursor IDE beforeShellExecution フック (TSB-019 構造的補強策 / §52-8 物理 block 化)
#
# 仕様:
#   - stdin に Cursor から JSON {"command": "...", "cwd": "..."} を受け取る
#   - 危険パターンに合致すれば exit 2 (= deny) + JSON で agent に報告
#   - 安全/不明パターンは exit 0 + permission:allow (fail-open)
#   - すべての判定を /tmp/cursor-shell-blocker.log に追記
#
# 設計思想 (P5-1 / 2026-04-26):
#   - deny-list 方式 (allow-list は既存業務を破壊するため)
#   - 「絶対に AI が承認なしに実行してはならない」カテゴリのみ block
#   - 微妙なケース (npm install <pkg> 等) も block するが、明示理由をログに残す
#   - フック自体が壊れても fail-open (= cat | exit 0) でユーザー作業を止めない
#
# 連動条文:
#   - AGENTS.md §52-8 高リスク shell 暴走防止 (AI 自己制約 = 報告→GO)
#   - AGENTS.md §1-2-2-1 Cursor IDE 必須設定 (Auto-Run Mode = Run Everything)
#   - docs/troubleshooting.md TSB-019 (Auto-Run Mode bypass RACI)

LOG=/tmp/cursor-shell-blocker.log
TS=$(date '+%Y-%m-%d %H:%M:%S %z')

input=$(cat)
command=$(echo "$input" | jq -r '.command // empty' 2>/dev/null)

strip_heredoc_bodies() {
  local src="$1"
  # Heuristic: if the command includes heredoc, strip its body so that literal
  # strings inside the heredoc do not trigger deny regexes.
  if [[ "$src" != *"<<"* ]]; then
    printf '%s' "$src"
    return 0
  fi

  # Keep heredoc "start line" and closing delimiter line, but remove the body.
  # This avoids false-positive blocks when the heredoc contains strings that
  # match deny regexes.
  #
  # Supported (best-effort):
  #   <<EOF / <<-EOF
  #   <<'EOF' / <<-"EOF"
  #   <<\EOF   (backslash-escaped token)
  #
  # Delimiter tokens are commonly [A-Za-z0-9_-]+ in practice.
  if ! awk '
    BEGIN { in=0; delim=""; stripTabs=0 }
    function ltrim_tabs(s) { sub(/^\t+/, "", s); return s }
    {
      line=$0
      if (in==0) {
        # Detect heredoc start and extract delimiter token.
        # Examples matched: <<EOF, <<-EOF, <<'\''EOF'\'', <<-"EOF", <<\EOF, <<-\EOF
        if (match(line, /<<-?[[:space:]]*\\?["'\'']?([A-Za-z0-9_-]+)["'\'']?/, m)) {
          delim=m[1]
          stripTabs = (substr(line, RSTART, 3)=="<<-") ? 1 : 0
          in=1
        }
        print line
        next
      }

      # in heredoc body: skip until delimiter line
      chk=line
      if (stripTabs==1) chk=ltrim_tabs(chk)
      if (chk==delim) {
        in=0; delim=""; stripTabs=0
        print line
      }
      next
    }
  ' <<<"$src"; then
    # fail-open: if parsing fails, keep original command unchanged
    printf '%s' "$src"
    return 0
  fi
}

if [[ -z "$command" ]]; then
  echo "[$TS] EMPTY_INPUT input=$input" >> "$LOG"
  echo '{"permission":"allow"}'
  exit 0
fi

command_for_match=$(strip_heredoc_bodies "$command")
if [[ "$command_for_match" != "$command" ]]; then
  echo "[$TS] STRIP_HEREDOC original_len=${#command} stripped_len=${#command_for_match}" >> "$LOG"
fi

reason=""
category=""

if [[ "$command_for_match" =~ rm[[:space:]]+-rf[[:space:]]*/[[:space:]]*$ ]] \
   || [[ "$command_for_match" =~ rm[[:space:]]+-rf[[:space:]]+/[a-zA-Z] ]] \
   || [[ "$command_for_match" =~ rm[[:space:]]+-rf[[:space:]]+~ ]] \
   || [[ "$command_for_match" =~ rm[[:space:]]+-rf[[:space:]]+\$HOME ]] \
   || [[ "$command_for_match" =~ rm[[:space:]]+-rf[[:space:]]+\$\{HOME\} ]] \
   || [[ "$command_for_match" =~ rm[[:space:]]+-rf[[:space:]]+\.\.[[:space:]]?$ ]] \
   || [[ "$command_for_match" =~ rm[[:space:]]+-rf[[:space:]]+\* ]]; then
  category="削除系(再帰/絶対パス or 危険ターゲット)"
  reason="rm -rf を絶対パス・ホーム・親ディレクトリ・ワイルドカードに対して実行しようとしています。"
elif [[ "$command_for_match" =~ find[[:space:]].*-delete ]] \
   || [[ "$command_for_match" =~ find[[:space:]].*-exec[[:space:]]+rm ]] \
   || [[ "$command_for_match" =~ xargs[[:space:]]+rm ]]; then
  category="削除系(find/xargs 経由)"
  reason="find -delete または xargs rm は再帰削除と等価で復旧不可です。"
elif [[ "$command_for_match" =~ git[[:space:]]+push[[:space:]]+(--force|-f)([[:space:]]|$) ]] \
   || [[ "$command_for_match" =~ git[[:space:]]+push[[:space:]].*--force-with-lease ]] \
   || [[ "$command_for_match" =~ git[[:space:]]+reset[[:space:]]+--hard ]] \
   || [[ "$command_for_match" =~ git[[:space:]]+clean[[:space:]]+-fdx ]] \
   || [[ "$command_for_match" =~ git[[:space:]]+rebase[[:space:]] ]] \
   || [[ "$command_for_match" =~ git[[:space:]]+filter-branch ]] \
   || [[ "$command_for_match" =~ git[[:space:]]+update-ref[[:space:]]+-d ]]; then
  category="git 破壊系"
  reason="git の履歴書換・force push・hard reset は復旧困難です。"
elif [[ "$command_for_match" =~ chmod[[:space:]]+-R ]] \
   || [[ "$command_for_match" =~ chown[[:space:]]+-R ]] \
   || [[ "$command_for_match" =~ ^setfacl ]]; then
  category="権限変更(再帰)"
  reason="再帰的な権限変更はシステム整合性を破壊するリスクがあります。"
elif [[ "$command_for_match" =~ ^[[:space:]]*sudo[[:space:]] ]] \
   || [[ "$command_for_match" =~ [[:space:]]sudo[[:space:]] ]]; then
  category="特権コマンド(sudo)"
  reason="sudo は管理者権限の昇格でシステム全体に影響します。"
elif [[ "$command_for_match" =~ docker[[:space:]]+rm[[:space:]] ]] \
   || [[ "$command_for_match" =~ docker[[:space:]]+system[[:space:]]+prune ]] \
   || [[ "$command_for_match" =~ docker[[:space:]]+volume[[:space:]]+rm ]] \
   || [[ "$command_for_match" =~ kubectl[[:space:]]+delete ]] \
   || [[ "$command_for_match" =~ helm[[:space:]]+uninstall ]]; then
  category="コンテナ系(削除)"
  reason="docker/kubectl/helm の削除はサービス停止を引き起こします。"
elif [[ "$command_for_match" =~ (\>|\>\>|tee)[[:space:]]+[^[:space:]\<\>\&\|\;]*\.env([[:space:]]|$) ]] \
   || { [[ "$command_for_match" =~ sed[[:space:]]+-i ]] && [[ "$command_for_match" =~ ([[:space:]]|^)[^[:space:]\<\>\&\|\;]*\.env([[:space:]]|$) ]]; }; then
  category="秘密情報(.env 編集)"
  reason=".env ファイルへの書込はクレデンシャル変更のため浜田 GO 必須です。"
elif [[ "$command_for_match" =~ (\>|\>\>|tee)[[:space:]]+[^[:space:]\<\>\&\|\;]*\.cursor/mcp\.json ]] \
   || { [[ "$command_for_match" =~ sed[[:space:]]+-i ]] && [[ "$command_for_match" =~ ([[:space:]]|^)[^[:space:]\<\>\&\|\;]*\.cursor/mcp\.json ]]; }; then
  category="MCP 設定変更(mcp.json 編集)"
  reason="~/.cursor/mcp.json は kintone 認証情報を含むため浜田 GO 必須です。"
elif [[ "$command_for_match" =~ (\>|\>\>|tee)[[:space:]]+[^[:space:]\<\>\&\|\;]*\.ssh/ ]] \
   || { [[ "$command_for_match" =~ sed[[:space:]]+-i ]] && [[ "$command_for_match" =~ ([[:space:]]|^)[^[:space:]\<\>\&\|\;]*\.ssh/ ]]; }; then
  category="SSH 鍵変更"
  reason="~/.ssh/ への書込は SSH 認証を変更するため浜田 GO 必須です。"
elif [[ "$command_for_match" =~ (\>|\>\>|tee)[[:space:]]+[^[:space:]\<\>\&\|\;]*\.cursor/hooks ]] \
   || { [[ "$command_for_match" =~ sed[[:space:]]+-i ]] && [[ "$command_for_match" =~ ([[:space:]]|^)[^[:space:]\<\>\&\|\;]*\.cursor/hooks ]]; }; then
  category="Hooks 設定変更"
  reason="~/.cursor/hooks 自体への書込は §52-8 物理 block の自己改ざん防止のため浜田 GO 必須です。"
fi

if [[ -n "$category" ]]; then
  echo "[$TS] BLOCK category=$category cmd=$command_for_match" >> "$LOG"
  jq -n --arg cmd "$command" --arg cat "$category" --arg reason "$reason" '{
    continue: true,
    permission: "deny",
    user_message: ("⚠️ §52-8 高リスク shell を物理 block しました\nカテゴリ: " + $cat + "\nコマンド: " + $cmd + "\n\n→ 浜田に GO を取得してから再実行してください。\n→ 解除はチャットで「§52-8 例外 GO」を浜田が明示。"),
    agent_message: ("⛔ §52-8 BLOCK by hooks/dangerous-shell-blocker.sh\nCategory: " + $cat + "\nReason: " + $reason + "\nCommand: " + $cmd + "\n\nNext action:\n1. ⚠️ §52-8 高リスク shell 検知 / 実行前 GO 確認 を 浜田 に提示する\n2. 浜田が「GO」と明示するまで再実行しない\n3. もしフック側に誤検知があれば、AI は浜田に報告し /home/mhamada202408224/.cursor/hooks/dangerous-shell-blocker.sh のパターン緩和を提案する")
  }'
  exit 2
fi

echo "[$TS] ALLOW cmd=$command_for_match" >> "$LOG"
echo '{"permission":"allow"}'
exit 0
