#!/usr/bin/env bash
set -uo pipefail

: "${LOCAL_DB_URL:=postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

OWNER_ID="11111111-1111-4111-8111-111111111111"
LOG_DIR="${RUNNER_TEMP:-/tmp}/batch-65-concurrency"
mkdir -p "$LOG_DIR"

cat >"$LOG_DIR/session-a.sql" <<SQL
\\set ON_ERROR_STOP on
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '$OWNER_ID', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.update_own_profile_v1(
  2,
  '{"display_name":"Owner Race A"}'::jsonb,
  'batch65-owner-race-a-0001'
);
commit;
SQL

cat >"$LOG_DIR/session-b.sql" <<SQL
\\set ON_ERROR_STOP on
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '$OWNER_ID', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select public.update_own_profile_v1(
  2,
  '{"display_name":"Owner Race B"}'::jsonb,
  'batch65-owner-race-b-0001'
);
commit;
SQL

set +e
psql "$LOCAL_DB_URL" -f "$LOG_DIR/session-a.sql" >"$LOG_DIR/session-a.log" 2>&1 &
PID_A=$!
psql "$LOCAL_DB_URL" -f "$LOG_DIR/session-b.sql" >"$LOG_DIR/session-b.log" 2>&1 &
PID_B=$!

wait "$PID_A"
STATUS_A=$?
wait "$PID_B"
STATUS_B=$?
set -e

cat "$LOG_DIR/session-a.log"
cat "$LOG_DIR/session-b.log"

if [[ "$STATUS_A" -eq 0 && "$STATUS_B" -eq 0 ]]; then
  echo "Both concurrent profile writes succeeded; CAS failed." >&2
  exit 1
fi

if [[ "$STATUS_A" -ne 0 && "$STATUS_B" -ne 0 ]]; then
  echo "Both concurrent profile writes failed; expected exactly one success." >&2
  exit 1
fi

FAILED_LOG="$LOG_DIR/session-a.log"
if [[ "$STATUS_A" -eq 0 ]]; then
  FAILED_LOG="$LOG_DIR/session-b.log"
fi

if ! grep -qi "Stale profile revision" "$FAILED_LOG"; then
  echo "The losing concurrent session did not fail with stale revision." >&2
  exit 1
fi

REVISION="$(psql "$LOCAL_DB_URL" -Atqc "select profile_revision from public.profiles where user_id = '$OWNER_ID'")"
DISPLAY_NAME="$(psql "$LOCAL_DB_URL" -Atqc "select display_name from public.profiles where user_id = '$OWNER_ID'")"
REQUEST_COUNT="$(psql "$LOCAL_DB_URL" -Atqc "select count(*) from public.profile_update_requests where actor_id = '$OWNER_ID'")"

if [[ "$REVISION" != "3" ]]; then
  echo "Expected owner revision 3 after one winning concurrent write, got $REVISION." >&2
  exit 1
fi

if [[ "$DISPLAY_NAME" != "Owner Race A" && "$DISPLAY_NAME" != "Owner Race B" ]]; then
  echo "Unexpected winning display name: $DISPLAY_NAME" >&2
  exit 1
fi

if [[ "$REQUEST_COUNT" != "2" ]]; then
  echo "Expected one original and one winning request registry row, got $REQUEST_COUNT." >&2
  exit 1
fi

echo "Batch 65 two-session concurrency passed: one winner, one stale rejection, revision=$REVISION."
