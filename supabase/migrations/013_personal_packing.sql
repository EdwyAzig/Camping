-- Private per-user packing checklist (not visible to other trip members)

create table if not exists public.personal_packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  custom_label text,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (trip_id, user_id, item_key)
);

alter table public.personal_packing_items enable row level security;

create policy "Users manage own packing items"
  on public.personal_packing_items for all
  using (user_id = auth.uid() and public.is_trip_member(trip_id))
  with check (user_id = auth.uid() and public.is_trip_member(trip_id));

create index if not exists personal_packing_items_trip_user_idx
  on public.personal_packing_items (trip_id, user_id);
