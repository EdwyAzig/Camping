-- Camping Control Center schema extensions

-- Trip location & costs
alter table public.trips add column if not exists departure_date text not null default '';
alter table public.trips add column if not exists return_note text not null default '';
alter table public.trips add column if not exists address text not null default '';
alter table public.trips add column if not exists parking_notes text not null default '';
alter table public.trips add column if not exists services text not null default '';
alter table public.trips add column if not exists table_cost numeric(10,2) default 0;
alter table public.trips add column if not exists grill_rental_cost numeric(10,2) default 0;
alter table public.trips add column if not exists parking_cost numeric(10,2) default 0;
alter table public.trips add column if not exists contact_info text not null default '';

-- Schedule: natural phrases vs timeline events
alter table public.schedule_entries add column if not exists entry_type text not null default 'timeline';
alter table public.schedule_entries add column if not exists sort_order int not null default 0;

do $$ begin
  alter table public.schedule_entries
    add constraint schedule_entries_entry_type_check
    check (entry_type in ('natural', 'timeline'));
exception when duplicate_object then null;
end $$;

-- Meals: flexible labels
alter table public.meals add column if not exists title text not null default '';
alter table public.meals add column if not exists who_brings uuid references auth.users(id) on delete set null;
alter table public.meals add column if not exists equipment_needed text not null default '';
alter table public.meals add column if not exists ingredients text not null default '';

alter table public.meals drop constraint if exists meals_trip_id_day_label_meal_type_key;

-- Equipment: critical badge
alter table public.equipment add column if not exists critical boolean not null default false;

-- Activities: richer fields
alter table public.activities add column if not exists scheduled_time text not null default '';
alter table public.activities add column if not exists difficulty text not null default 'facile';
alter table public.activities add column if not exists responsible uuid references auth.users(id) on delete set null;

do $$ begin
  alter table public.activities
    add constraint activities_difficulty_check
    check (difficulty in ('facile', 'media', 'difficile'));
exception when duplicate_object then null;
end $$;

-- Activity votes (1-5 per member)
create table if not exists public.activity_votes (
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  primary key (activity_id, user_id)
);

-- Cassa comune: who paid what
create table if not exists public.trip_payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  label text not null default '',
  created_at timestamptz not null default now()
);

-- RLS new tables
alter table public.activity_votes enable row level security;
alter table public.trip_payments enable row level security;

drop policy if exists "Members manage activity votes" on public.activity_votes;
create policy "Members manage activity votes"
  on public.activity_votes for all
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

drop policy if exists "Members manage trip payments" on public.trip_payments;
create policy "Members manage trip payments"
  on public.trip_payments for all
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

-- Realtime
do $$ begin
  alter publication supabase_realtime add table public.activity_votes;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.trip_payments;
exception when duplicate_object then null;
end $$;

-- Owners can update trip location fields
drop policy if exists "Owners can update trips" on public.trips;
create policy "Owners can update trips"
  on public.trips for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.trip_members
      where trip_id = id and user_id = auth.uid() and role = 'owner'
    )
  );

-- Members can update trip (collaborative location editing)
drop policy if exists "Members can update trip details" on public.trips;
create policy "Members can update trip details"
  on public.trips for update
  using (public.is_trip_member(id));
