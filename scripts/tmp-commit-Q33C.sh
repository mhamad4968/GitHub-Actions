#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
git add -A
echo --- staged file count ---
git --no-pager diff --cached --name-only | wc -l
echo --- staged stat (head) ---
git --no-pager diff --cached --stat | tail -5
echo --- pre-commit hook trigger ---
git commit -F .git/COMMITMSG_Q33C.txt
echo --- LATEST ---
git --no-pager log --oneline -3
git push origin HEAD:main
