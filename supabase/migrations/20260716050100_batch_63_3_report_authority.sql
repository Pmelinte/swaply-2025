begin;

create or replace function public.submit_safety_report_v1(
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_description text,
  p_evidence jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_target_type text := pg_catalog.btrim(coalesce(p_target_type, ''));
  v_reason text := pg_catalog.btrim(coalesce(p_reason, ''));
  v_description text := pg_catalog.btrim(coalesce(p_description, ''));
  v_evidence jsonb := coalesce(p_evidence, '[]'::jsonb);
  v_key text := pg_catalog.btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_existing public.safety_command_requests%rowtype;
  v_report public.reports%rowtype;
  v_reported_user_id uuid;
  v_reported_item_id uuid;
  v_entity_type text;
  v_response jsonb;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_target_id is null
     or v_target_type not in ('user', 'item')
     or v_reason not in (
       'spam',
       'harassment',
       'inappropriate',
       'scam',
       'prohibited_item',
       'other'
     )
     or char_length(v_description) > 2000
     or char_length(v_key) not between 8 and 240
     or pg_catalog.jsonb_typeof(v_evidence) <> 'array'
     or pg_catalog.jsonb_array_length(v_evidence) > 10 then
    raise exception 'Invalid report input' using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(v_evidence) entry
    where coalesce(entry->>'evidence_type', '') not in (
        'photo',
        'chat_screenshot',
        'link',
        'note'
      )
       or char_length(pg_catalog.btrim(coalesce(entry->>'content', '')))
          not between 1 and 2000
  ) then
    raise exception 'Invalid report evidence' using errcode = '22023';
  end if;

  if v_target_type = 'user' then
    select profile.user_id
      into v_reported_user_id
    from public.profiles profile
    where profile.user_id = p_target_id;

    if not found then
      raise exception 'Reported user not found' using errcode = 'P0002';
    end if;

    v_reported_item_id := null;
    v_entity_type := 'profile';
  else
    select item.owner_id, item.id
      into v_reported_user_id, v_reported_item_id
    from public.items item
    where item.id = p_target_id;

    if not found then
      raise exception 'Reported item not found' using errcode = 'P0002';
    end if;

    v_entity_type := 'item';
  end if;

  if v_reported_user_id = v_actor_id then
    raise exception 'Users cannot report themselves or their own items'
      using errcode = '23514';
  end if;

  v_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'command', 'report',
      'actor_id', v_actor_id,
      'target_type', v_target_type,
      'target_id', p_target_id,
      'reported_user_id', v_reported_user_id,
      'reason', v_reason,
      'description', v_description,
      'evidence', v_evidence
    )::text
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_actor_id::text || ':report:' || v_key, 0)
  );

  select * into v_existing
  from public.safety_command_requests request_row
  where request_row.actor_id = v_actor_id
    and request_row.command = 'report'
    and request_row.idempotency_key = v_key;

  if found then
    if v_existing.request_hash <> v_hash then
      raise exception 'Idempotency key conflict' using errcode = '23505';
    end if;

    return pg_catalog.jsonb_set(
      v_existing.response,
      '{replayed}',
      'true'::jsonb,
      true
    );
  end if;

  if (
    select pg_catalog.count(*)
    from public.reports report
    where report.reporter_id = v_actor_id
      and report.created_at > pg_catalog.clock_timestamp() - interval '24 hours'
  ) >= 10 then
    raise exception 'Daily report limit reached' using errcode = '54000';
  end if;

  if exists (
    select 1
    from public.reports report
    where report.reporter_id = v_actor_id
      and report.entity_type = v_entity_type
      and report.entity_id = p_target_id
      and report.status in ('open', 'investigating')
  ) then
    raise exception 'An active report already exists for this target'
      using errcode = '23505';
  end if;

  perform pg_catalog.set_config(
    'swaply.safety_authority',
    'submit_report_v1',
    true
  );

  insert into public.reports (
    reporter_id,
    entity_type,
    entity_id,
    reported_user_id,
    reported_item_id,
    reason,
    description,
    evidence,
    status,
    updated_at
  ) values (
    v_actor_id,
    v_entity_type,
    p_target_id,
    v_reported_user_id,
    v_reported_item_id,
    v_reason,
    nullif(v_description, ''),
    v_evidence,
    'open',
    pg_catalog.clock_timestamp()
  ) returning * into v_report;

  perform pg_catalog.set_config('swaply.safety_authority', '', true);

  insert into public.audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    new_data,
    metadata
  ) values (
    v_actor_id,
    'safety.report_submitted',
    'report',
    v_report.id::text,
    pg_catalog.jsonb_build_object(
      'target_type', v_target_type,
      'target_id', p_target_id,
      'reason', v_reason
    ),
    pg_catalog.jsonb_build_object(
      'reported_user_id', v_reported_user_id,
      'reported_item_id', v_reported_item_id
    )
  );

  v_response := pg_catalog.jsonb_build_object(
    'report', pg_catalog.to_jsonb(v_report),
    'replayed', false,
    'idempotency_key', v_key
  );

  insert into public.safety_command_requests (
    actor_id,
    command,
    idempotency_key,
    request_hash,
    subject_id,
    response
  ) values (
    v_actor_id,
    'report',
    v_key,
    v_hash,
    v_report.id,
    v_response
  );

  return v_response;
end;
$function$;

revoke execute on function public.submit_safety_report_v1(
  text,
  uuid,
  text,
  text,
  jsonb,
  text
) from public, anon, service_role;
grant execute on function public.submit_safety_report_v1(
  text,
  uuid,
  text,
  text,
  jsonb,
  text
) to authenticated;

create or replace function public.resolve_safety_report_v1(
  p_report_id uuid,
  p_expected_status text,
  p_action text,
  p_notes text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_expected_status text := pg_catalog.btrim(coalesce(p_expected_status, ''));
  v_action text := pg_catalog.btrim(coalesce(p_action, ''));
  v_notes text := pg_catalog.btrim(coalesce(p_notes, ''));
  v_key text := pg_catalog.btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_existing public.safety_command_requests%rowtype;
  v_report public.reports%rowtype;
  v_response jsonb;
  v_effect_applied boolean := false;
  v_report_counted boolean := false;
  v_affected_item_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.user_roles role_row
    where role_row.user_id = v_actor_id
      and role_row.role in ('admin', 'moderator')
  ) then
    raise exception 'Only admins or moderators may resolve reports'
      using errcode = '42501';
  end if;

  if p_report_id is null
     or v_expected_status not in ('open', 'investigating')
     or v_action not in (
       'investigate',
       'dismiss',
       'warn',
       'hide_item',
       'suspend_7d'
     )
     or char_length(v_notes) > 2000
     or char_length(v_key) not between 8 and 240 then
    raise exception 'Invalid report resolution input' using errcode = '22023';
  end if;

  if v_action in ('dismiss', 'warn', 'hide_item', 'suspend_7d')
     and char_length(v_notes) < 3 then
    raise exception 'Resolution notes are required' using errcode = '22023';
  end if;

  if v_action = 'investigate' and v_expected_status <> 'open' then
    raise exception 'Only open reports can enter investigation'
      using errcode = '22023';
  end if;

  v_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'command', 'resolve_report',
      'actor_id', v_actor_id,
      'report_id', p_report_id,
      'expected_status', v_expected_status,
      'action', v_action,
      'notes', v_notes
    )::text
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_actor_id::text || ':resolve_report:' || v_key, 0)
  );

  select * into v_existing
  from public.safety_command_requests request_row
  where request_row.actor_id = v_actor_id
    and request_row.command = 'resolve_report'
    and request_row.idempotency_key = v_key;

  if found then
    if v_existing.subject_id <> p_report_id
       or v_existing.request_hash <> v_hash then
      raise exception 'Idempotency key conflict' using errcode = '23505';
    end if;

    return pg_catalog.jsonb_set(
      v_existing.response,
      '{replayed}',
      'true'::jsonb,
      true
    );
  end if;

  select * into v_report
  from public.reports report
  where report.id = p_report_id
  for update;

  if not found then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;

  if v_report.status is distinct from v_expected_status then
    raise exception 'Stale report status: expected %, current %',
      v_expected_status,
      v_report.status
      using errcode = '40001';
  end if;

  if v_action = 'hide_item' and v_report.reported_item_id is null then
    raise exception 'Item report required for hide_item'
      using errcode = '23514';
  end if;

  perform pg_catalog.set_config(
    'swaply.safety_authority',
    'resolve_report_v1',
    true
  );

  if v_action = 'investigate' then
    update public.reports report
       set status = 'investigating',
           updated_at = pg_catalog.clock_timestamp()
     where report.id = p_report_id
     returning * into v_report;
  elsif v_action = 'dismiss' then
    update public.reports report
       set status = 'dismissed',
           resolution = 'dismissed',
           resolution_notes = v_notes,
           resolved_by = v_actor_id,
           resolved_at = pg_catalog.clock_timestamp(),
           updated_at = pg_catalog.clock_timestamp()
     where report.id = p_report_id
     returning * into v_report;
  elsif v_action = 'warn' then
    insert into public.moderation_actions (
      moderator_id,
      target_type,
      target_id,
      action,
      reason,
      report_id
    ) values (
      v_actor_id,
      'user',
      v_report.reported_user_id,
      'warn',
      v_notes,
      v_report.id
    );

    update public.profiles profile
       set report_count = coalesce(profile.report_count, 0) + 1,
           updated_at = pg_catalog.clock_timestamp()
     where profile.user_id = v_report.reported_user_id;
    v_report_counted := true;

    update public.reports report
       set status = 'resolved',
           resolution = 'warning_issued',
           resolution_notes = v_notes,
           resolved_by = v_actor_id,
           resolved_at = pg_catalog.clock_timestamp(),
           updated_at = pg_catalog.clock_timestamp()
     where report.id = p_report_id
     returning * into v_report;
  elsif v_action = 'hide_item' then
    update public.items item
       set is_active = false,
           status = 'archived',
           updated_at = pg_catalog.clock_timestamp()
     where item.id = v_report.reported_item_id
       and item.owner_id = v_report.reported_user_id
     returning item.id into v_affected_item_id;

    if v_affected_item_id is null then
      raise exception 'Reported item no longer belongs to the reported user'
        using errcode = '23514';
    end if;

    insert into public.moderation_actions (
      moderator_id,
      target_type,
      target_id,
      action,
      reason,
      report_id
    ) values (
      v_actor_id,
      'item',
      v_report.reported_item_id,
      'hide_item',
      v_notes,
      v_report.id
    );

    update public.profiles profile
       set report_count = coalesce(profile.report_count, 0) + 1,
           updated_at = pg_catalog.clock_timestamp()
     where profile.user_id = v_report.reported_user_id;
    v_report_counted := true;

    update public.reports report
       set status = 'resolved',
           resolution = 'item_hidden',
           resolution_notes = v_notes,
           resolved_by = v_actor_id,
           resolved_at = pg_catalog.clock_timestamp(),
           updated_at = pg_catalog.clock_timestamp()
     where report.id = p_report_id
     returning * into v_report;
  else
    update public.profiles profile
       set is_suspended = true,
           suspended_until = pg_catalog.greatest(
             coalesce(profile.suspended_until, '-infinity'::timestamptz),
             pg_catalog.clock_timestamp() + interval '7 days'
           ),
           suspension_reason = v_notes,
           report_count = coalesce(profile.report_count, 0) + 1,
           updated_at = pg_catalog.clock_timestamp()
     where profile.user_id = v_report.reported_user_id;

    if not found then
      raise exception 'Reported user not found' using errcode = 'P0002';
    end if;

    v_report_counted := true;

    insert into public.moderation_actions (
      moderator_id,
      target_type,
      target_id,
      action,
      reason,
      duration_days,
      report_id
    ) values (
      v_actor_id,
      'user',
      v_report.reported_user_id,
      'suspend',
      v_notes,
      7,
      v_report.id
    );

    update public.reports report
       set status = 'resolved',
           resolution = 'user_suspended',
           resolution_notes = v_notes,
           resolved_by = v_actor_id,
           resolved_at = pg_catalog.clock_timestamp(),
           updated_at = pg_catalog.clock_timestamp()
     where report.id = p_report_id
     returning * into v_report;
  end if;

  perform pg_catalog.set_config('swaply.safety_authority', '', true);

  if v_action <> 'investigate' then
    insert into public.safety_report_resolution_effects (
      report_id,
      moderator_id,
      action,
      affected_user_id,
      affected_item_id,
      report_counted
    ) values (
      v_report.id,
      v_actor_id,
      v_action,
      v_report.reported_user_id,
      v_affected_item_id,
      v_report_counted
    );
    v_effect_applied := true;
  end if;

  insert into public.audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    new_data,
    metadata
  ) values (
    v_actor_id,
    'safety.report_' || v_action,
    'report',
    v_report.id::text,
    pg_catalog.jsonb_build_object(
      'status', v_report.status,
      'resolution', v_report.resolution,
      'notes', v_notes
    ),
    pg_catalog.jsonb_build_object(
      'reported_user_id', v_report.reported_user_id,
      'reported_item_id', v_report.reported_item_id,
      'effect_applied', v_effect_applied,
      'report_counted', v_report_counted
    )
  );

  v_response := pg_catalog.jsonb_build_object(
    'report', pg_catalog.to_jsonb(v_report),
    'replayed', false,
    'idempotency_key', v_key,
    'effect_applied', v_effect_applied,
    'report_counted', v_report_counted,
    'affected_user_id', v_report.reported_user_id,
    'affected_item_id', v_affected_item_id
  );

  insert into public.safety_command_requests (
    actor_id,
    command,
    idempotency_key,
    request_hash,
    subject_id,
    response
  ) values (
    v_actor_id,
    'resolve_report',
    v_key,
    v_hash,
    v_report.id,
    v_response
  );

  return v_response;
end;
$function$;

revoke execute on function public.resolve_safety_report_v1(
  uuid,
  text,
  text,
  text,
  text
) from public, anon, service_role;
grant execute on function public.resolve_safety_report_v1(
  uuid,
  text,
  text,
  text,
  text
) to authenticated;

commit;
