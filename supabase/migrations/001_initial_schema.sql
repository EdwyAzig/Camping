-- Camping Organizer schema

create extension if not exists "pgcrypto";

-- Trips
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location_name text not null default '',
  lat double precision not null default 45.0,
  lng double precision not null default 9.0,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Trip members
create table if not exists public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- Schedule
create table if not exists public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_label text not null,
  time_note text not null default '',
  description text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Shopping
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  category text not null check (category in ('cibo', 'bevande', 'altro')) default 'cibo',
  quantity text not null default '1',
  assigned_to uuid references auth.users(id) on delete set null,
  bought boolean not null default false,
  estimated_price numeric(10,2),
  created_at timestamptz not null default now()
);

-- Meals
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_label text not null,
  meal_type text not null check (meal_type in ('colazione', 'pranzo', 'cena')),
  menu text not null default '',
  cook uuid references auth.users(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (trip_id, day_label, meal_type)
);

-- Equipment
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  item_name text not null,
  assigned_to uuid references auth.users(id) on delete set null,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  description text not null default '',
  estimated_cost numeric(10,2),
  map_link text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Activity participants
create table if not exists public.activity_participants (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (activity_id, user_id)
);

-- Helper: is user a trip member?
create or replace function public.is_trip_member(trip uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = trip and user_id = auth.uid()
  );
$$;

-- RLS
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.schedule_entries enable row level security;
alter table public.shopping_items enable row level security;
alter table public.meals enable row level security;
alter table public.equipment enable row level security;
alter table public.activities enable row level security;
alter table public.activity_participants enable row level security;

-- Trips policies
create policy "Members can view their trips"
  on public.trips for select
  using (public.is_trip_member(id));

create policy "Creators can view their trips"
  on public.trips for select
  using (created_by = auth.uid());

create policy "Authenticated users can create trips"
  on public.trips for insert
  with check (auth.uid() = created_by);

create policy "Owners can update trips"
  on public.trips for update
  using (
    exists (
      select 1 from public.trip_members
      where trip_id = id and user_id = auth.uid() and role = 'owner'
    )
  );

-- Trip members policies
create policy "Members can view trip members"
  on public.trip_members for select
  using (public.is_trip_member(trip_id));

create policy "Users can join trips"
  on public.trip_members for insert
  with check (auth.uid() = user_id);

create policy "Users can update own membership"
  on public.trip_members for update
  using (auth.uid() = user_id);

-- Lookup trip by invite code (minimal fields, no membership required)
create or replace function public.get_trip_by_invite(code text)
returns table (id uuid, name text, location_name text)
language sql
security definer
stable
as $$
  select t.id, t.name, t.location_name
  from public.trips t
  where upper(t.invite_code) = upper(code)
  limit 1;
$$;

grant execute on function public.get_trip_by_invite(text) to authenticated;

-- Schedule
create policy "Members manage schedule"
  on public.schedule_entries for all
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- Shopping
create policy "Members manage shopping"
  on public.shopping_items for all
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- Meals
create policy "Members manage meals"
  on public.meals for all
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- Equipment
create policy "Members manage equipment"
  on public.equipment for all
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- Activities
create policy "Members manage activities"
  on public.activities for all
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- Activity participants
create policy "Members manage activity participants"
  on public.activity_participants for all
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and public.is_trip_member(a.trip_id)
    )
  )
  with check (
    exists (
      select 1 from public.activities a
      where a.id = activity_id and public.is_trip_member(a.trip_id)
    )
  );

-- Realtime
alter publication supabase_realtime add table public.shopping_items;
alter publication supabase_realtime add table public.schedule_entries;
alter publication supabase_realtime add table public.meals;
alter publication supabase_realtime add table public.equipment;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.activity_participants;

-- Seed function for new trips (called from app after trip creation)
-- Default coords: Parco del Gravio area (Lombardia) approximate
comment on table public.trips is 'Camping trips';
