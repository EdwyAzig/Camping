-- List and delete camping sessions created by the current user

create or replace function public.list_my_created_trips()
returns table (
  id uuid,
  name text,
  location_name text,
  invite_code text,
  created_at timestamptz,
  member_count bigint,
  is_active boolean,
  is_member boolean,
  can_delete boolean
)
language sql
security definer
stable
set search_path = public
as $$
  with current_trip as (
    select trip_id
    from public.trip_members
    where user_id = auth.uid()
    limit 1
  )
  select
    t.id,
    t.name,
    t.location_name,
    t.invite_code,
    t.created_at,
    (select count(*) from public.trip_members tm where tm.trip_id = t.id) as member_count,
    exists (select 1 from current_trip ct where ct.trip_id = t.id) as is_active,
    exists (
      select 1 from public.trip_members tm
      where tm.trip_id = t.id and tm.user_id = auth.uid()
    ) as is_member,
    (
      exists (
        select 1 from public.trip_members tm
        where tm.trip_id = t.id and tm.user_id = auth.uid() and tm.role = 'owner'
      )
      or (
        (select count(*) from public.trip_members tm where tm.trip_id = t.id) = 0
        and t.created_by = auth.uid()
      )
    ) as can_delete
  from public.trips t
  where t.created_by = auth.uid()
  order by t.created_at desc;
$$;

create or replace function public.delete_trip_by_id(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member_count int;
begin
  if v_user_id is null then
    raise exception 'Devi essere autenticato';
  end if;

  if not exists (
    select 1 from public.trips t
    where t.id = p_trip_id and t.created_by = v_user_id
  ) then
    raise exception 'Sessione non trovata';
  end if;

  select count(*) into v_member_count
  from public.trip_members
  where trip_id = p_trip_id;

  if exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = v_user_id and role = 'owner'
  ) then
    delete from public.trips where id = p_trip_id;
    return;
  end if;

  if v_member_count = 0 then
    delete from public.trips where id = p_trip_id;
    return;
  end if;

  raise exception 'Solo l''organizzatore può eliminare questa sessione';
end;
$$;

grant execute on function public.list_my_created_trips() to authenticated;
grant execute on function public.delete_trip_by_id(uuid) to authenticated;
