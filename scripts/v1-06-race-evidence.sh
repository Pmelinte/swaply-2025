#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-54322}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
EVIDENCE_DIR="${EVIDENCE_DIR:-evidence}"
SOURCE_REPLAY="${SOURCE_REPLAY:-supabase/tests/v1_05_4_6_domain_aware_exchange_completion_replay.sql}"
SWAP_ID="a5460000-0000-4000-8000-000000000401"
ACTOR_ID="a5460000-0000-4000-8000-000000000001"
FIXTURE_PREFIX="a5460000-%"

mkdir -p "${EVIDENCE_DIR}"

psql_base=(
  psql
  --host "${DB_HOST}"
  --port "${DB_PORT}"
  --username "${DB_USER}"
  --dbname "${DB_NAME}"
  --set ON_ERROR_STOP=1
  --no-psqlrc
)

if [[ ! -f "${SOURCE_REPLAY}" ]]; then
  echo "Missing authoritative replay source: ${SOURCE_REPLAY}" >&2
  exit 1
fi

# Reuse the exact deterministic V1-05.4.6 authoritative fixture, but commit
# only its fixture setup so two independent PostgreSQL sessions can race.
awk '
  BEGIN { found_origin = 0 }
  {
    print
    if ($0 ~ /^set local session_replication_role = origin;/) {
      print "commit;"
      found_origin = 1
      exit
    }
  }
  END {
    if (found_origin != 1) {
      exit 42
    }
  }
' "${SOURCE_REPLAY}" > "${EVIDENCE_DIR}/v106-race-setup.sql"

"${psql_base[@]}" \
  --file "${EVIDENCE_DIR}/v106-race-setup.sql" \
  2>&1 | tee "${EVIDENCE_DIR}/v106-race-setup.log"

race_sql() {
  local key="$1"
  cat <<SQL
set role authenticated;
select pg_catalog.set_config('request.jwt.claim.sub', '${ACTOR_ID}', false);
select pg_catalog.set_config('request.jwt.claim.role', 'authenticated', false);
select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"${ACTOR_ID}","role":"authenticated","aal":"aal1"}',
  false
);
select public.confirm_swap_completion_v1('${SWAP_ID}'::uuid, '${key}');
SQL
}

race_sql "v106-race-request-a" > "${EVIDENCE_DIR}/v106-race-session-a.sql"
race_sql "v106-race-request-b" > "${EVIDENCE_DIR}/v106-race-session-b.sql"

set +e
(
  "${psql_base[@]}" \
    --file "${EVIDENCE_DIR}/v106-race-session-a.sql" \
    > "${EVIDENCE_DIR}/v106-race-session-a.log" 2>&1
) &
pid_a=$!
(
  "${psql_base[@]}" \
    --file "${EVIDENCE_DIR}/v106-race-session-b.sql" \
    > "${EVIDENCE_DIR}/v106-race-session-b.log" 2>&1
) &
pid_b=$!

wait "${pid_a}"
status_a=$?
wait "${pid_b}"
status_b=$?
set -e

cat "${EVIDENCE_DIR}/v106-race-session-a.log"
cat "${EVIDENCE_DIR}/v106-race-session-b.log"

if [[ "${status_a}" -ne 0 || "${status_b}" -ne 0 ]]; then
  echo "Concurrent authoritative calls did not both terminate safely: A=${status_a}, B=${status_b}" >&2
  exit 1
fi

"${psql_base[@]}" 2>&1 <<SQL | tee "${EVIDENCE_DIR}/v106-race-verification.log"
do \$verify\$
declare
  v_swap public.swaps%rowtype;
  v_confirmation_count integer;
  v_completion_event_count integer;
  v_effect_count integer;
begin
  select * into strict v_swap
  from public.swaps
  where id = '${SWAP_ID}'::uuid;

  select count(*) into v_confirmation_count
  from public.swap_completion_confirmations
  where swap_id = '${SWAP_ID}'::uuid
    and actor_id = '${ACTOR_ID}'::uuid;

  select count(*) into v_completion_event_count
  from public.swap_events
  where swap_id = '${SWAP_ID}'::uuid
    and actor_id = '${ACTOR_ID}'::uuid
    and action = 'completion_confirmed';

  select count(*) into v_effect_count
  from public.swap_completion_effects
  where swap_id = '${SWAP_ID}'::uuid;

  if v_swap.status <> 'in_progress' then
    raise exception 'V106-RACE-001 expected in_progress after one participant race, got %', v_swap.status;
  end if;
  if coalesce(v_swap.requester_confirmed, false) is not true
     or coalesce(v_swap.responder_confirmed, false) is true then
    raise exception 'V106-RACE-001 authoritative confirmation flags are invalid.';
  end if;
  if v_confirmation_count <> 1 then
    raise exception 'V106-RACE-001 expected exactly one confirmation row, got %', v_confirmation_count;
  end if;
  if v_completion_event_count <> 1 then
    raise exception 'V106-RACE-001 expected exactly one confirmation event, got %', v_completion_event_count;
  end if;
  if v_effect_count <> 0 then
    raise exception 'V106-RACE-001 produced premature completion effects: %', v_effect_count;
  end if;
end
\$verify\$;

select jsonb_build_object(
  'contract', 'V106-RACE-001',
  'result', 'PASS',
  'authoritative_result_count', 1,
  'confirmation_rows', (
    select count(*)
    from public.swap_completion_confirmations
    where swap_id = '${SWAP_ID}'::uuid
      and actor_id = '${ACTOR_ID}'::uuid
  ),
  'completion_events', (
    select count(*)
    from public.swap_events
    where swap_id = '${SWAP_ID}'::uuid
      and actor_id = '${ACTOR_ID}'::uuid
      and action = 'completion_confirmed'
  ),
  'premature_effects', (
    select count(*)
    from public.swap_completion_effects
    where swap_id = '${SWAP_ID}'::uuid
  )
) as result;
SQL

# The fixture was intentionally committed for cross-session testing. Reset the
# isolated database, then prove that deterministic fixture identities are gone.
supabase db reset --local --no-seed 2>&1 \
  | tee "${EVIDENCE_DIR}/v106-race-reset.log"

"${psql_base[@]}" 2>&1 <<SQL | tee "${EVIDENCE_DIR}/v106-race-cleanup.log"
do \$cleanup\$
begin
  if exists (select 1 from auth.users where id::text like '${FIXTURE_PREFIX}')
     or exists (select 1 from public.profiles where user_id::text like '${FIXTURE_PREFIX}')
     or exists (select 1 from public.items where id::text like '${FIXTURE_PREFIX}')
     or exists (
       select 1 from public.swaps
       where requester_id::text like '${FIXTURE_PREFIX}'
          or responder_id::text like '${FIXTURE_PREFIX}'
     )
  then
    raise exception 'V106-RACE-001 cleanup left deterministic fixture data.';
  end if;
end
\$cleanup\$;

select jsonb_build_object(
  'contract', 'V106-CLEANUP-001',
  'result', 'PASS',
  'fixture_prefix', '${FIXTURE_PREFIX}'
) as result;
SQL
