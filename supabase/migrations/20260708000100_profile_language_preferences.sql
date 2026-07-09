alter table public.profiles
  add column if not exists primary_language text,
  add column if not exists secondary_language text,
  add column if not exists tertiary_language text,
  add column if not exists auto_translate_messages boolean not null default true,
  add column if not exists show_original_language boolean not null default false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'preferred_language'
  ) then
    execute '
      update public.profiles
      set primary_language = coalesce(primary_language, preferred_language)
      where primary_language is null
        and preferred_language is not null
    ';
  end if;
end $$;

comment on column public.profiles.primary_language is
  'User primary language for visible UI/content/chat fallback. Must be evaluated before route/source/default locale.';
comment on column public.profiles.secondary_language is
  'User secondary language used before visible English technical fallback.';
comment on column public.profiles.tertiary_language is
  'User tertiary language used before visible English technical fallback.';
comment on column public.profiles.auto_translate_messages is
  'Whether chat/messages should be automatically translated using the user language fallback chain.';
comment on column public.profiles.show_original_language is
  'Whether translated content should display the original language text by default.';
