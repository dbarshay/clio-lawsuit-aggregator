#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
MASTER_LAWSUIT_ID="${MASTER_LAWSUIT_ID:-2026.05.00010}"

echo "=== NON-DESTRUCTIVE SETTLEMENT BLOCKED AUDIT TEST ==="
echo "BASE_URL=$BASE_URL"
echo "MASTER_LAWSUIT_ID=$MASTER_LAWSUIT_ID"

echo
echo "=== HISTORY BEFORE ==="
BEFORE="$(curl -s "$BASE_URL/api/settlements/history?masterLawsuitId=$MASTER_LAWSUIT_ID&limit=20")"
echo "$BEFORE" | jq '{
  ok,
  count,
  rows: [.rows[]? | {id, status, noWritePerformed, error, finalizedAt}],
  safety
}'

BEFORE_COUNT="$(echo "$BEFORE" | jq '.count // 0')"

echo
echo "=== BLOCKED CASE 1: MISSING confirmWrite ==="
MISSING_CONFIRM="$(curl -s -w '\nHTTP_STATUS:%{http_code}\n' \
  -X POST "$BASE_URL/api/settlements/writeback" \
  -H "Content-Type: application/json" \
  -d "{\"masterLawsuitId\":\"$MASTER_LAWSUIT_ID\",\"rows\":[]}")"

echo "$MISSING_CONFIRM"

MISSING_CONFIRM_STATUS="$(echo "$MISSING_CONFIRM" | awk -F: '/HTTP_STATUS/ {print $2}')"
if [[ "$MISSING_CONFIRM_STATUS" != "400" ]]; then
  echo "FAIL: expected HTTP 400 for missing confirmWrite, got $MISSING_CONFIRM_STATUS"
  exit 1
fi

MISSING_CONFIRM_JSON="$(echo "$MISSING_CONFIRM" | sed '/HTTP_STATUS:/d')"
echo "$MISSING_CONFIRM_JSON" | jq -e '
  .ok == false
  and .auditRecord.ok == true
  and .safety.noClioRecordsChanged == true
  and .safety.noDocumentsGenerated == true
  and .safety.noPrintQueueRecordsChanged == true
' >/dev/null

echo "PASS: missing confirmWrite created blocked audit row and reported no-write safety."

echo
echo "=== BLOCKED CASE 2: confirmWrite TRUE BUT NO ROWS ==="
NO_ROWS="$(curl -s -w '\nHTTP_STATUS:%{http_code}\n' \
  -X POST "$BASE_URL/api/settlements/writeback" \
  -H "Content-Type: application/json" \
  -d "{\"masterLawsuitId\":\"$MASTER_LAWSUIT_ID\",\"confirmWrite\":true,\"rows\":[]}")"

echo "$NO_ROWS"

NO_ROWS_STATUS="$(echo "$NO_ROWS" | awk -F: '/HTTP_STATUS/ {print $2}')"
if [[ "$NO_ROWS_STATUS" != "400" ]]; then
  echo "FAIL: expected HTTP 400 for no rows, got $NO_ROWS_STATUS"
  exit 1
fi

NO_ROWS_JSON="$(echo "$NO_ROWS" | sed '/HTTP_STATUS:/d')"
echo "$NO_ROWS_JSON" | jq -e '
  .ok == false
  and .auditRecord.ok == true
  and .safety.noClioRecordsChanged == true
  and .safety.noDocumentsGenerated == true
  and .safety.noPrintQueueRecordsChanged == true
' >/dev/null

echo "PASS: no rows created blocked audit row and reported no-write safety."

echo
echo "=== HISTORY AFTER ==="
AFTER="$(curl -s "$BASE_URL/api/settlements/history?masterLawsuitId=$MASTER_LAWSUIT_ID&limit=20")"
echo "$AFTER" | jq '{
  ok,
  count,
  rows: [.rows[]? | {id, status, noWritePerformed, error, finalizedAt}],
  safety
}'

AFTER_COUNT="$(echo "$AFTER" | jq '.count // 0')"
EXPECTED_MIN=$((BEFORE_COUNT + 2))

if (( AFTER_COUNT < EXPECTED_MIN )); then
  echo "FAIL: expected history count to increase by at least 2. before=$BEFORE_COUNT after=$AFTER_COUNT"
  exit 1
fi

echo "$AFTER" | jq -e '
  .rows[0].status == "blocked-no-rows"
  and .rows[0].noWritePerformed == true
  and .rows[1].status == "blocked-missing-confirm-write"
  and .rows[1].noWritePerformed == true
  and .safety.readOnly == true
  and .safety.noClioRecordsChanged == true
  and .safety.noDocumentsGenerated == true
  and .safety.noPrintQueueRecordsChanged == true
' >/dev/null

echo
echo "=== NON-DESTRUCTIVE SETTLEMENT BLOCKED AUDIT TEST PASSED ==="
echo "Created local blocked audit rows only."
echo "No successful Clio write was requested."
echo "No documents were generated."
echo "No print queue records were changed."
