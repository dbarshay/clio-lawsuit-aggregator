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
echo "=== RUN SETTLEMENT WRITEBACK SAFETY VERIFIER ==="
npm run verify:settlement-writeback-safety

echo
echo "=== RUN SETTLED WITH PERSON-CONTACT SAFETY VERIFIER ==="
npm run verify:settled-with-person-contact-safety

echo
echo "=== RUN PROVIDER FEE DEFAULTS SAFETY VERIFIER ==="
npm run verify:provider-fee-defaults-safety

echo
echo "=== RUN PRODUCTION WORKFLOW SMOKE TEST ==="
npm run smoke:workflow:prod
