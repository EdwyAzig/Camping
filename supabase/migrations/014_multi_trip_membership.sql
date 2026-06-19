-- Multi-trip membership: join multiple camping groups, leave/delete by trip id

create or replace function public.join_trip_by_code(
  code text,
  display_name text default 'Campeggiatore'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip_id uuid;
begin
  if v_user_id is null then
    raise exception 'Devi essere autenticato';
  end if;

  select t.id into v_trip_id
  from public.trips t
  where upper(t.invite_code) = upper(trim(code))
  limit 1;

  if v_trip_id is null then
    raise exception 'Codice invito non trovato';
  end if;

  if exists (
    select 1 from public.trip_members
    where trip_id = v_trip_id and user_id = v_user_id
  ) then
    return v_trip_id;
  end if;

  insert into public.trip_members (trip_id, user_id, display_name, role)
  values (v_trip_id, v_user_id, trim(display_name), 'member');

  return v_trip_id;
end;
$$;

create or replace function public.leave_trip_by_id(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Devi essere autenticato';
  end if;

  if p_trip_id is null then
    raise exception 'Sessione non specificata';
  end if;

  perform public.leave_trip_internal(v_user_id, p_trip_id);
end;
$$;

create or replace function public.leave_trip_session(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.leave_trip_by_id(p_trip_id);
end;
$$;

create or replace function public.delete_trip_session(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
begin
  if v_user_id is null then
    raise exception 'Devi essere autenticato';
  end if;

  if p_trip_id is null then
    raise exception 'Sessione non specificata';
  end if;

  select role into v_role
  from public.trip_members
  where trip_id = p_trip_id and user_id = v_user_id;

  if v_role is null then
    return;
  end if;

  if v_role <> 'owner' then
    raise exception 'Solo l''organizzatore può eliminare la sessione';
  end if;

  delete from public.trips where id = p_trip_id;
end;
$$;

create or replace function public.list_my_memberships()
returns table (
  id uuid,
  name text,
  location_name text,
  invite_code text,
  role text,
  joined_at timestamptz,
  member_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    t.id,
    t.name,
    t.location_name,
    t.invite_code,
    tm.role,
    tm.joined_at,
    (select count(*) from public.trip_members tm2 where tm2.trip_id = t.id) as member_count
  from public.trip_members tm
  join public.trips t on t.id = tm.trip_id
  where tm.user_id = auth.uid()
  order by tm.joined_at desc;
$$;

create or replace function public.list_my_created_trips(p_active_trip_id uuid default null)
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
  select
    t.id,
    t.name,
    t.location_name,
    t.invite_code,
    t.created_at,
    (select count(*) from public.trip_members tm where tm.trip_id = t.id) as member_count,
    (p_active_trip_id is not null and t.id = p_active_trip_id) as is_active,
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

grant execute on function public.leave_trip_by_id(uuid) to authenticated;
grant execute on function public.list_my_memberships() to authenticated;
