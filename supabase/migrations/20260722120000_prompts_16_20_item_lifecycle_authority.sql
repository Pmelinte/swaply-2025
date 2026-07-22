-- Prompt 17-18: owner-only item editing/lifecycle authority helpers.

alter table public.items
  drop constraint if exists items_status_check;

alter table public.items
  add constraint items_status_check
  check (status in ('active', 'reserved', 'traded', 'swapped', 'paused', 'archived'));

create index if not exists idx_items_owner_status_updated_at
  on public.items (owner_id, status, updated_at desc);

create or replace function public.set_item_lifecycle_v1(
  p_item_id text,
  p_status text
)
returns table(id text, status text, is_active boolean, updated_at timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_status not in ('active', 'paused', 'archived') then
    raise exception 'invalid item lifecycle status';
  end if;

  return query
  update public.items i
     set status = p_status,
         is_active = (p_status = 'active'),
         updated_at = now()
   where i.id = p_item_id
     and i.owner_id = auth.uid()
   returning i.id, i.status, i.is_active, i.updated_at;
end;
$$;

grant execute on function public.set_item_lifecycle_v1(text, text) to authenticated;
