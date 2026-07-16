begin;

-- Some installations may still have the historical abuse_reports table.
-- Temporarily accept both legacy and canonical spellings while the following
-- foundation migration copies rows and replaces the constraint permanently.
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
  end if;
end
$legacy_bridge$;

commit;
