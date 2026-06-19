-- Date vere per programma e viaggio

alter table public.trips
  add column if not exists start_date date,
  add column if not exists end_date date;

alter table public.schedule_entries
  add column if not exists event_date date;

-- Backfill: prova a derivare start/end dal testo esistente (best effort)
update public.trips
set
  start_date = coalesce(start_date, current_date + ((7 - extract(dow from current_date)::int) % 7)),
  end_date = coalesce(end_date, current_date + ((7 - extract(dow from current_date)::int) % 7) + 1)
where start_date is null;

-- Backfill eventi esistenti da etichette giorno + date viaggio
update public.schedule_entries se
set event_date = t.start_date
from public.trips t
where se.trip_id = t.id
  and se.event_date is null
  and se.entry_type = 'timeline'
  and t.start_date is not null
  and lower(se.day_label) in ('domenica', 'dom');

update public.schedule_entries se
set event_date = coalesce(t.end_date, t.start_date + 1)
from public.trips t
where se.trip_id = t.id
  and se.event_date is null
  and se.entry_type = 'timeline'
  and t.start_date is not null
  and lower(se.day_label) in ('lunedì', 'lunedi', 'lun');
