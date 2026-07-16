-- Batch 65 follow-up guard.
--
-- profile_revision is server-controlled. Authenticated users may create their
-- initial row, but they cannot choose an arbitrary starting revision or mutate
-- server-owned profile fields through a direct table write.

begin;

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.badge := 'free';
      new.role := 'user';
      new.onboarding_completed := false;
      new.is_suspended := false;
      new.suspended_until := null;
      new.suspension_reason := null;
      new.is_banned := false;
      new.ban_reason := null;
      new.report_count := 0;
      new.event_badges := '{}'::text[];
      new.stripe_customer_id := null;
      new.paypal_payer_id := null;
      new.id_verified := false;
      new.id_verified_at := null;
      new.id_verified_method := null;
      new.phone_verified := false;
      new.phone_verified_at := null;
      new.address_verified := false;
      new.trust_level := 'starter';
      new.trust_score := 0;
      new.swaps_completed := 0;
      new.swaps_cancelled := 0;
      new.swaps_disputed := 0;
      new.response_time_avg_h := null;
      new.response_rate_pct := 0;
      new.subscription_plan := 'free';
      new.subscription_until := null;
      new.token_balance := 0;
      new.lifetime_tokens := 0;
      new.api_key_hash := null;
      new.stats := '{}'::jsonb;
      new.profile_revision := 1;
    else
      new.badge := old.badge;
      new.role := old.role;
      new.onboarding_completed := old.onboarding_completed;
      new.is_suspended := old.is_suspended;
      new.suspended_until := old.suspended_until;
      new.suspension_reason := old.suspension_reason;
      new.is_banned := old.is_banned;
      new.ban_reason := old.ban_reason;
      new.report_count := old.report_count;
      new.event_badges := old.event_badges;
      new.stripe_customer_id := old.stripe_customer_id;
      new.paypal_payer_id := old.paypal_payer_id;
      new.id_verified := old.id_verified;
      new.id_verified_at := old.id_verified_at;
      new.id_verified_method := old.id_verified_method;
      new.phone_verified := old.phone_verified;
      new.phone_verified_at := old.phone_verified_at;
      new.address_verified := old.address_verified;
      new.trust_level := old.trust_level;
      new.trust_score := old.trust_score;
      new.swaps_completed := old.swaps_completed;
      new.swaps_cancelled := old.swaps_cancelled;
      new.swaps_disputed := old.swaps_disputed;
      new.response_time_avg_h := old.response_time_avg_h;
      new.response_rate_pct := old.response_rate_pct;
      new.subscription_plan := old.subscription_plan;
      new.subscription_until := old.subscription_until;
      new.token_balance := old.token_balance;
      new.lifetime_tokens := old.lifetime_tokens;
      new.api_key_hash := old.api_key_hash;
      new.stats := old.stats;
      new.profile_revision := old.profile_revision;
    end if;

    new.preferences := coalesce(new.preferences, '{}'::jsonb) - 'role';
  end if;

  return new;
end;
$function$;

revoke execute on function public.protect_profile_privileged_fields()
  from public, anon, authenticated;

commit;
