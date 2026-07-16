-- Batch 65 locale registry completion.
--
-- The canonical application registry contains 43 locales. Yiddish (`yi`) is
-- the final active locale and must be accepted by the database normalizer too.

begin;

create or replace function public.normalize_swaply_locale(p_locale text)
returns text
language plpgsql
immutable
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_locale text;
  v_supported constant text[] := array[
    'en', 'ro', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'el',
    'hu', 'bg', 'cs', 'sk', 'hr', 'sl', 'sr', 'sv', 'da', 'fi',
    'no', 'lt', 'lv', 'et', 'ga', 'mt', 'ru', 'tr', 'ar', 'zh',
    'hi', 'bn', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'fil', 'fa',
    'mn', 'uk', 'yi'
  ];
begin
  v_locale := lower(replace(btrim(coalesce(p_locale, '')), '_', '-'));

  if v_locale = '' then
    return null;
  end if;

  if v_locale = any(v_supported) then
    return v_locale;
  end if;

  v_locale := split_part(v_locale, '-', 1);
  if v_locale = any(v_supported) then
    return v_locale;
  end if;

  return null;
end;
$function$;

revoke execute on function public.normalize_swaply_locale(text) from public, anon;
grant execute on function public.normalize_swaply_locale(text) to authenticated, service_role;

commit;
