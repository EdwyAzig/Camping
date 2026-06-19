-- User-created shopping list groups (e.g. "Pranzo 1", "Cena 2")

create table if not exists public.shopping_groups (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shopping_groups_trip_idx
  on public.shopping_groups (trip_id, sort_order);

alter table public.shopping_groups enable row level security;

create policy "Members manage shopping groups"
  on public.shopping_groups for all
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

alter table public.shopping_items
  add column if not exists group_id uuid references public.shopping_groups(id) on delete set null;

alter table public.shopping_items
  drop column if exists meal_group;

alter publication supabase_realtime add table public.shopping_groups;
