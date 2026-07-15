-- Batch 62.1: public read, authority-only write contract for Reviews.

alter table public.reviews enable row level security;

revoke insert, update, delete on table public.reviews
  from public, anon, authenticated;
grant select on table public.reviews to anon, authenticated;

drop policy if exists reviews_insert_participant on public.reviews;
drop policy if exists reviews_update_response on public.reviews;
drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all
  on public.reviews for select
  to public
  using (true);

create or replace function public.require_review_authority()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_authority text := pg_catalog.current_setting('swaply.review_authority', true);
begin
  if tg_op = 'INSERT' then
    if v_authority <> 'submit_swap_review_v1' then
      raise exception 'Direct review inserts are forbidden'
        using errcode = '42501';
    end if;
  elsif tg_op = 'UPDATE' then
    if v_authority <> 'respond_to_swap_review_v1' then
      raise exception 'Direct review updates are forbidden'
        using errcode = '42501';
    end if;

    if new.id is distinct from old.id
       or new.swap_id is distinct from old.swap_id
       or new.reviewer_id is distinct from old.reviewer_id
       or new.reviewed_id is distinct from old.reviewed_id
       or new.rating is distinct from old.rating
       or new.comment is distinct from old.comment
       or new.tags is distinct from old.tags
       or new.photos is distinct from old.photos
       or new.created_at is distinct from old.created_at
       or new.idempotency_key is distinct from old.idempotency_key
       or new.request_hash is distinct from old.request_hash then
      raise exception 'Only the review response may be updated'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;

revoke execute on function public.require_review_authority()
  from public, anon, authenticated, service_role;

drop trigger if exists require_review_authority_trigger on public.reviews;
create trigger require_review_authority_trigger
before insert or update on public.reviews
for each row execute function public.require_review_authority();
