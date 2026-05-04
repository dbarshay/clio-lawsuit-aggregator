#!/usr/bin/env bash
set -euo pipefail

echo "=== VERIFY CLEAN WORKING TREE ==="
status="$(git status --short)"

if [ -n "$status" ] && [ "${ALLOW_DIRTY:-0}" != "1" ]; then
  echo "$status"
  echo
  echo "FAIL: working tree is not clean. Commit, stash, or discard changes before production verification." >&2
  exit 1
fi

if [ -n "$status" ]; then
  echo "$status"
  echo "ALLOW_DIRTY=1 set; continuing despite local changes."
else
  echo "clean"
fi

echo
echo "=== VERIFY TOP COMMIT ==="
git log --oneline --decorate -1

echo
echo "=== RUN PRODUCTION WORKFLOW SMOKE TEST ==="
npm run smoke:workflow:prod
