#!/usr/bin/env bash
# 1 と 2 だけ入れた tar.gz（ファイルサーバー用）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/scripts/faq-portal-ONLY-1-and-2.tar.gz"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp "$ROOT/scripts/faq-portal-full.html" "$TMP/"
cp "$ROOT/scripts/faq-kintone-proxy/server.mjs" "$TMP/"
printf '%s\n' "1) faq-portal-full.html  →  あなたの環境の scripts/ へ上書き" "2) server.mjs  →  あなたの環境の scripts/faq-kintone-proxy/ へ上書き" "" ".env は触らない。" > "$TMP/UPLOAD-THIS-2-FILES.txt"
tar czvf "$OUT" -C "$TMP" faq-portal-full.html server.mjs UPLOAD-THIS-2-FILES.txt
echo "Created: $OUT"
ls -lh "$OUT"
