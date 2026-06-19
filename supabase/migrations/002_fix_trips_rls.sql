-- Fix: allow trip creator to read trip before trip_members row exists
-- (needed for .insert().select() on trip creation)

drop policy if exists "Creators can view their trips" on public.trips;
create policy "Creators can view their trips"
  on public.trips for select
  using (created_by = auth.uid());
