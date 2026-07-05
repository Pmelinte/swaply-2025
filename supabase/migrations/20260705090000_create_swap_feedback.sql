create table if not exists public.swap_feedback (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  would_swap_again boolean default true,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (swap_id, reviewer_id)
);

alter table public.swap_feedback enable row level security;

drop policy if exists "swap_feedback participants can read" on public.swap_feedback;
create policy "swap_feedback participants can read"
  on public.swap_feedback for select
  using (
    auth.uid() = reviewer_id
    or auth.uid() = reviewee_id
  );

drop policy if exists "swap_feedback reviewers can insert" on public.swap_feedback;
create policy "swap_feedback reviewers can insert"
  on public.swap_feedback for insert
  with check (auth.uid() = reviewer_id);

drop policy if exists "swap_feedback reviewers can update own" on public.swap_feedback;
create policy "swap_feedback reviewers can update own"
  on public.swap_feedback for update
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

create index if not exists idx_swap_feedback_swap_id on public.swap_feedback(swap_id);
create index if not exists idx_swap_feedback_reviewee_id on public.swap_feedback(reviewee_id);
