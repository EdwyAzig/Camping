-- Camping pitch and other location costs

alter table public.trips add column if not exists pitch_cost_per_night numeric(10,2) default 0;
alter table public.trips add column if not exists other_location_cost numeric(10,2) default 0;
alter table public.trips add column if not exists other_location_cost_label text not null default '';
