#!/usr/bin/env bash
# FAQ ポータル配布用 tar.gz を scripts/ に生成する（Git 未追跡の dist に依存しない）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCH="$ROOT/scripts/faq-portal-fileserver.tar.gz"
cd "$ROOT"
tar czvf "$ARCH" \
  scripts/DEPLOY-README.txt \
  scripts/faq-portal-full.html \
  scripts/faq-kintone-proxy/server.mjs \
  scripts/faq-kintone-proxy/package.json \
  scripts/faq-kintone-proxy/package-lock.json \
  scripts/faq-kintone-proxy/README.md \
  scripts/faq-kintone-proxy/.env.example
echo ""
echo "Created: $ARCH"
ls -lh "$ARCH"
