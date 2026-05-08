#!/usr/bin/env bash
# cio-eol-check.sh — CRLF/LF 維持チェック（A1・2026-05-07 浜田承認）
#
# 使い方:
#   bash scripts/cio-eol-check.sh           # working tree 全体（git ls-files ベース）
#   bash scripts/cio-eol-check.sh --staged  # git diff --cached のみ（pre-commit hook 用）
#
# 終了コード: 0=OK / 1=違反あり（CRLF 期待だが LF / LF 期待だが CRLF）
#
# 仕様:
#   - .gitattributes の `eol=crlf` / `eol=lf` 指定を `git check-attr -a -- <file>` で取得
#   - 各ファイルの実際の EOL を 1 行目の `\r\n`/`\n` で判定（バイナリは skip）
#   - 不一致を 1 行 1 件で stderr へ出力し、最後に件数をサマリ
set -e
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"

MODE="all"
if [ "${1:-}" = "--staged" ]; then
  MODE="staged"
fi

if [ "$MODE" = "staged" ]; then
  files=$(git diff --cached --name-only --diff-filter=ACMR)
else
  files=$(git ls-files)
fi

violations=0
checked=0
crlf_lf_violations=""
lf_crlf_violations=""

while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ ! -f "$f" ] && continue
  attr=$(git check-attr -a -- "$f" 2>/dev/null | grep -E ' eol: ' | awk '{print $NF}' | head -1)
  [ -z "$attr" ] && continue
  if file "$f" | grep -qi 'binary\|executable'; then
    continue
  fi
  has_cr=0
  # Git for Windows の grep はパイプ経由の CR をテキスト正規化で落とすため、grep ではなくバイト数で判定する
  cr_count=$(head -c 65536 "$f" | tr -cd '\r' | wc -c | awk '{print $1+0}')
  if [ "${cr_count:-0}" -gt 0 ]; then has_cr=1; fi
  checked=$((checked + 1))
  if [ "$attr" = "crlf" ] && [ "$has_cr" -eq 0 ]; then
    crlf_lf_violations="$crlf_lf_violations\n  $f"
    violations=$((violations + 1))
  elif [ "$attr" = "lf" ] && [ "$has_cr" -eq 1 ]; then
    lf_crlf_violations="$lf_crlf_violations\n  $f"
    violations=$((violations + 1))
  fi
done <<<"$files"

echo "[cio-eol-check] mode=$MODE checked=$checked violations=$violations"
if [ "$violations" -gt 0 ]; then
  if [ -n "$crlf_lf_violations" ]; then
    echo "[cio-eol-check] ❌ EOL=CRLF 期待だが LF のファイル:" >&2
    echo -e "$crlf_lf_violations" >&2
    echo "  → 復元: sed -i 's/\$/\\r/' <FILE> （行末に \\r 追加）" >&2
  fi
  if [ -n "$lf_crlf_violations" ]; then
    echo "[cio-eol-check] ❌ EOL=LF 期待だが CRLF のファイル:" >&2
    echo -e "$lf_crlf_violations" >&2
    echo "  → 復元: sed -i 's/\\r\$//' <FILE> （行末の \\r 除去）" >&2
  fi
  exit 1
fi
echo "[cio-eol-check] ✅ EOL 維持 OK"
exit 0
