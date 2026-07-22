-- Product-memory Prompts 11-13: Exchange completion, token/rank anti-abuse and RLS hardening.

alter table public.swap_intents drop constraint if exists swap_intents_status_check;
alter table public.swap_intents add constraint swap_intents_status_check
  check (status in ('proposed','accepted','scheduled','in_progress','shipped','received','completed','cancelled','disputed'));

alter table public.swap_intents
  add column if not exists logistics_mode text not null default 'local_handover'
    check (logistics_mode in ('local_handover','national_courier','international_courier','vacation_handover','property_exchange','service_exchange','event_reservation_transfer')),
  add column if not exists completion_checklist jsonb not null default '{"condition_confirmed":false,"packaging_confirmed":false,"shipment_pickup_confirmed":false,"received_confirmed":false,"feedback_requested":false}'::jsonb,
  add column if not exists story_prompted_at timestamptz,
  add column if not exists story_suspended_at timestamptz;

create table if not exists public.exchange_stories (
  id uuid primary key default gen_random_uuid(),
  swap_id text not null references public.swap_intents(id) on delete cascade,
  author_id text not null references public.profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','pending_review','validated','published','suspended','rejected')),
  title text not null default '',
  body text not null default '',
  consent jsonb not null default '{}'::jsonb,
  validated_at timestamptz,
  published_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (swap_id, author_id)
);

alter table public.exchange_stories enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='exchange_stories' and policyname='exchange_stories_select_participant_or_published') then
    create policy exchange_stories_select_participant_or_published on public.exchange_stories
      for select to authenticated
      using (
        status = 'published'
        or author_id = current_setting('request.jwt.claims', true)::json->>'sub'
        or exists (
          select 1 from public.swap_intents s
          where s.id = swap_id
            and (s.requester_id = current_setting('request.jwt.claims', true)::json->>'sub'
              or s.responder_id = current_setting('request.jwt.claims', true)::json->>'sub')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='exchange_stories' and policyname='exchange_stories_insert_author_completed_feedback') then
    create policy exchange_stories_insert_author_completed_feedback on public.exchange_stories
      for insert to authenticated
      with check (
        author_id = current_setting('request.jwt.claims', true)::json->>'sub'
        and exists (
          select 1 from public.swap_intents s
          where s.id = swap_id
            and s.status = 'completed'
            and s.feedback is not null
            and s.status <> 'disputed'
            and (s.requester_id = author_id or s.responder_id = author_id)
        )
      );
  end if;
end $$;

grant select, insert on public.exchange_stories to authenticated;

alter table public.token_ledger
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists unique_key text,
  add column if not exists moderated_at timestamptz,
  add column if not exists trust_rank_eligible boolean not null default false;

alter table public.token_ledger drop constraint if exists token_ledger_reason_check;
alter table public.token_ledger add constraint token_ledger_reason_check
  check (reason in ('signup_bonus','profile_completion','first_item','swap_completed','completed_exchange','feedback_submitted','validated_story','approved_blog_contribution','referral','purchase','boost_spent','monthly_grant','admin_grant','ai_feature_usage','listing_boost','courier_support'));

create unique index if not exists token_ledger_unique_key_idx
  on public.token_ledger(unique_key)
  where unique_key is not null;

create index if not exists token_ledger_monthly_cap_idx
  on public.token_ledger(user_id, reason, created_at desc);

create or replace function public.award_token_reward_once_v1(
  p_user_id text,
  p_amount integer,
  p_reason text,
  p_source_type text,
  p_source_id text,
  p_unique_key text,
  p_moderated boolean default false
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_monthly_total integer;
begin
  if p_amount <= 0 then
    raise exception using errcode='22023', message='Reward amount must be positive.';
  end if;

  if p_reason in ('validated_story','approved_blog_contribution','feedback_submitted') and not p_moderated then
    return false;
  end if;

  select coalesce(sum(amount), 0) into v_monthly_total
  from public.token_ledger
  where user_id = p_user_id
    and amount > 0
    and created_at >= date_trunc('month', now());

  if v_monthly_total + p_amount > 500 then
    return false;
  end if;

  insert into public.token_ledger (user_id, amount, reason, source_type, source_id, unique_key, moderated_at, trust_rank_eligible)
  values (p_user_id, p_amount, p_reason, p_source_type, p_source_id, p_unique_key, case when p_moderated then now() else null end, false)
  on conflict (unique_key) where unique_key is not null do nothing;

  return found;
end;
$$;

revoke all on function public.award_token_reward_once_v1(text, integer, text, text, text, text, boolean) from public, anon;
grant execute on function public.award_token_reward_once_v1(text, integer, text, text, text, text, boolean) to authenticated, service_role;

-- Critical RLS posture for sensitive content reviewed in Prompt 13.
alter table public.token_ledger enable row level security;
revoke update, delete on public.token_ledger from authenticated;

create table if not exists public.blog_suggestions (
  id uuid primary key default gen_random_uuid(),
  author_id text not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.blog_suggestions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='blog_suggestions' and policyname='blog_suggestions_author_private') then
    create policy blog_suggestions_author_private on public.blog_suggestions
      for all to authenticated
      using (author_id = current_setting('request.jwt.claims', true)::json->>'sub')
      with check (author_id = current_setting('request.jwt.claims', true)::json->>'sub');
  end if;
end $$;

grant select, insert, update on public.blog_suggestions to authenticated;
