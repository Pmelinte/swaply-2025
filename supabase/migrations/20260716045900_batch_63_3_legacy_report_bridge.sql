begin;

-- Reconcile the historical abuse_reports table before the canonical foundation
-- runs. The legacy table uses UUID columns, so no text regex/cast probing is
-- needed. Once copied, the parallel table is removed.
do $legacy_bridge$
begin
  if to_regclass('public.abuse_reports') is not null
     and to_regclass('public.reports') is not null then
    alter table public.reports
      drop constraint if exists reports_reason_check;

    alter table public.reports
      add constraint reports_reason_check
      check (reason in (
        'scam',
        'inappropriate_content',
        'inappropriate',
        'fake_item',
        'spam',
        'harassment',
        'prohibited_item',
        'other'
      ));

    insert into public.reports (
      id,
      reporter_id,
      entity_type,
      entity_id,
      reason,
      description,
      status,
      created_at
    )
    select
      legacy.id,
      legacy.reporter_id,
      case when legacy.reported_item_id is not null then 'item' else 'profile' end,
      coalesce(legacy.reported_item_id, legacy.reported_user_id),
      legacy.reason,
      coalesce(legacy.description, ''),
      case legacy.status
        when 'pending' then 'open'
        when 'reviewed' then 'investigating'
        else legacy.status
      end,
      legacy.created_at
    from public.abuse_reports legacy
    where coalesce(legacy.reported_item_id, legacy.reported_user_id) is not null
    on conflict (id) do nothing;

    drop table public.abuse_reports;
  end if;
end
$legacy_bridge$;

commit;
