-- Trip phases: partenza, soggiorno, ritorno, generale

alter table public.schedule_entries
  add column if not exists phase text not null default 'generale';

alter table public.activities
  add column if not exists phase text not null default 'soggiorno';

do $$ begin
  alter table public.schedule_entries
    add constraint schedule_entries_phase_check
    check (phase in ('partenza', 'soggiorno', 'ritorno', 'generale'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.activities
    add constraint activities_phase_check
    check (phase in ('partenza', 'soggiorno', 'ritorno', 'generale'));
exception when duplicate_object then null;
end $$;
