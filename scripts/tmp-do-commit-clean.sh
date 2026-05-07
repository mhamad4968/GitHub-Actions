#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
git add -A
echo STAGED_COUNT $(git diff --cached --name-only | wc -l)
git commit -F .git/COMMITMSG_Q33C.txt
git push origin HEAD:main
git log --oneline -3
