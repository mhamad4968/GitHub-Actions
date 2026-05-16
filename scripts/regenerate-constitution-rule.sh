#!/usr/bin/env bash
# 再生成: .cursor/rules/constitution.mdc（網羅結合版）
# 用法: bash scripts/regenerate-constitution-rule.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT=".cursor/rules/constitution.mdc"
tmp="$(mktemp)"
rm_on_fail() { rm -f "$tmp"; }
trap rm_on_fail ERR

{
  printf '%s\n' '---' \
    'description: 網羅統合版 — 憲法・索引・WORKFLOW・全mdc・予実・plans・chat・handoff・docs全（plans除く重複）・security-next・yojitsu README等（再生成=本スクリプト）。Cursor 常時枠の正は cio-constitution.mdc、本ファイルは必要時 Read' \
    'alwaysApply: false' \
    '---' \
    '' \
    '# kintone-ai-lab — Constitution（網羅統合版）' \
    '' \
    '> **読み方**: 本ファイルはリポ内の正本を**物理的に結合**したもの。編集の正本は各元ファイル。**差分・条文番号の最終解釈は `AGENTS.md`**。Cursor の制約で分割が必要な場合は `AGENTS.md` を直接 Read する。' \
    '' \
    '> **Cursor 常時想起の正（2026-05-09 CIO 統合）**: **`.cursor/rules/cio-constitution.mdc`**（**`alwaysApply: true` 唯一核**）。補助想起は **`constitution-brief-card.mdc` / `auto-read-by-topic.mdc` 等（`globs` 注入）**。本網羅ファイルは **`alwaysApply: false`** — **必要時のみ Read**。結合内の旧「alwaysApply: true」表記はミラー遅延の可能性あり—**実行時は分割 `.mdc` と `cio-constitution.mdc` を正とする**。' \
    '' \
    '> **再生成**: `npm run rules:regenerate-constitution`（Node・Windows 可）／`bash scripts/regenerate-constitution-rule.sh`（WSL）' \
    '' \
    '> **結合に含めない（意図）**: `.rag/extra-docs/**`（正本のミラー）・`logs/**` の自動生成ログ・`node_modules`・ビルド生成物。必要なら都度 Read。' \
    '' \
    '---' '## PART A — RULES-INDEX.md（全文）' '---' ''
  cat RULES-INDEX.md
  printf '\n%s\n' '---' '## PART B — .cursorrules（全文）' '---' ''
  cat .cursorrules
  printf '\n%s\n' '---' '## PART C — WORKFLOW.md（全文）' '---' ''
  cat WORKFLOW.md

  printf '\n%s\n' '---' '## PART C0 — cio-constitution.mdc（CIO 統合憲法・全文）' '---' ''
  cat .cursor/rules/cio-constitution.mdc

  for f in \
    .cursor/rules/autonomous-with-mandatory-asks.mdc \
    .cursor/rules/constitution-handoff-gate.mdc \
    .cursor/rules/creation-timing-ask.mdc \
    .cursor/rules/file-copy-exact-path.mdc \
    .cursor/rules/kintone-javascript.mdc \
    .cursor/rules/kintone-schema-trust.mdc \
    .cursor/rules/kintone.mdc \
    .cursor/rules/mcp-tool-discipline.mdc \
    .cursor/rules/modern-web-official-docs.mdc \
    .cursor/rules/next-session-jbis-followups.mdc \
    .cursor/rules/security-news-response.mdc \
    .cursor/rules/session-handoff.mdc \
    .cursor/rules/snyk-security.mdc \
    ; do
    printf '\n%s\n' '---' "## PART — $(basename "$f")（全文）" '---' ''
    cat "$f"
  done

  printf '\n%s\n' '---' '## PART Z — AGENTS.md（開発憲法・全文）' '---' ''
  cat AGENTS.md

  printf '\n%s\n' '---' '## PART Y1 — chat-sessions/checkpoint-latest.md（全文）' '---' ''
  cat chat-sessions/checkpoint-latest.md
  printf '\n%s\n' '---' '## PART Y2 — chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md（全文）' '---' ''
  cat chat-sessions/SESSION-BOOTSTRAP-CHECKLIST.md
  printf '\n%s\n' '---' '## PART Y3 — chat-sessions/NEW-SESSION-STARTER.md（全文）' '---' ''
  cat chat-sessions/NEW-SESSION-STARTER.md
  printf '\n%s\n' '---' '## PART Y4 — docs/troubleshooting.md（全文・TSB）' '---' ''
  cat docs/troubleshooting.md
  printf '\n%s\n' '---' '## PART Y5 — templates/yojitsu-budget-lite/SPEC.md（全文）' '---' ''
  cat templates/yojitsu-budget-lite/SPEC.md
  printf '\n%s\n' '---' '## PART Y6 — kintone-apps.md（全文）' '---' ''
  cat kintone-apps.md
  printf '\n%s\n' '---' '## PART Y7 — CLAUDE.md（全文）' '---' ''
  cat CLAUDE.md
  printf '\n%s\n' '---' '## PART Y8 — chat-sessions/SESSION-SPLIT-REMINDER.md（全文）' '---' ''
  cat chat-sessions/SESSION-SPLIT-REMINDER.md
  printf '\n%s\n' '---' '## PART Y9 — chat-sessions/SESSION-CLOCK.md（スナップショット全文）' '---' ''
  cat chat-sessions/SESSION-CLOCK.md
  printf '\n%s\n' '---' '## PART Y10 — templates/yojitsu-budget-lite/docs/*.md（全文・全件）' '---' ''
  for g in $(ls -1 templates/yojitsu-budget-lite/docs/*.md 2>/dev/null | sort); do
    printf '\n### FILE: %s\n\n' "$g"
    cat "$g"
  done
  printf '\n%s\n' '---' '## PART Y11 — docs/plans/**/*.md（全文・全件）' '---' ''
  find docs/plans -name '*.md' -type f | sort | while IFS= read -r g; do
    printf '\n### FILE: %s\n\n' "$g"
    cat "$g"
  done
  printf '\n%s\n' '---' '## PART Y12 — chat-sessions/日次ログ 2026-*.md と checkpoints（全文）' '---' ''
  find chat-sessions -maxdepth 1 -name '2026-*.md' -type f | sort | while IFS= read -r g; do
    printf '\n### FILE: %s\n\n' "$g"
    cat "$g"
  done
  if compgen -G "chat-sessions/checkpoints/*.md" > /dev/null; then
    find chat-sessions/checkpoints -name '*.md' -type f | sort | while IFS= read -r g; do
      printf '\n### FILE: %s\n\n' "$g"
      cat "$g"
    done
  fi
  if [[ -f docs/runbooks/dry-run-apply-checklist.md ]]; then
    printf '\n%s\n' '---' '## PART Y13 — docs/runbooks/dry-run-apply-checklist.md（全文）' '---' ''
    cat docs/runbooks/dry-run-apply-checklist.md
  fi

  printf '\n%s\n' '---' '## PART Y14 — chat-sessions 運用補助（handoff・TICKER・トラブルメモ・README 等・全文）' '---' ''
  for g in \
    chat-sessions/handoff-log.md \
    chat-sessions/SESSION-CLOCK-TICKER.md \
    chat-sessions/CURSOR-トラブル対応メモ.md \
    chat-sessions/evening-reflect-queue.md \
    chat-sessions/README.md \
    chat-sessions/TEMPLATE.md \
    ; do
    if [[ -f "$g" ]]; then
      printf '\n### FILE: %s\n\n' "$g"
      cat "$g"
    fi
  done
  if [[ -f chat-sessions/HANDOFF-HUMAN.txt ]]; then
    printf '\n%s\n' '---' '## PART Y14b — chat-sessions/HANDOFF-HUMAN.txt（全文）' '---' ''
    cat chat-sessions/HANDOFF-HUMAN.txt
  fi

  printf '\n%s\n' '---' '## PART Y15 — docs/**/*.md（plans・troubleshooting・dry-run checklist 除く・全文）' '---' ''
  find docs -name '*.md' -type f \
    ! -path 'docs/plans/*' \
    ! -path 'docs/troubleshooting.md' \
    ! -path 'docs/runbooks/dry-run-apply-checklist.md' | sort | while IFS= read -r g; do
    printf '\n### FILE: %s\n\n' "$g"
    cat "$g"
  done

  printf '\n%s\n' '---' '## PART Y16 — templates/yojitsu-budget-lite/README・SPEC.template 等（SPEC.md は Y5 と重複するため除外・全文）' '---' ''
  find templates/yojitsu-budget-lite -maxdepth 1 -name '*.md' -type f ! -name 'SPEC.md' 2>/dev/null | sort | while IFS= read -r g; do
    printf '\n### FILE: %s\n\n' "$g"
    cat "$g"
  done

  if [[ -d security-next-automation ]]; then
    printf '\n%s\n' '---' '## PART Y17 — security-next-automation/**/*.md（全文）' '---' ''
    find security-next-automation -name '*.md' -type f 2>/dev/null | sort | while IFS= read -r g; do
      printf '\n### FILE: %s\n\n' "$g"
      cat "$g"
    done
  fi
} > "$tmp"

mv -f "$tmp" "$OUT"
trap - ERR
wc -l -c "$OUT" | awk '{print "[regenerate-constitution-rule]", $0}'
