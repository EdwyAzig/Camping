-- Session join/leave: lookup before auth, leave own membership, switch trips by code

grant execute on function public.get_trip_by_invite(text) to anon;

create policy "Users can leave trips"
  on public.trip_members for delete
  using (auth.uid() = user_id);

create or replace function public.leave_trip_internal(
  p_user_id uuid,
  p_trip_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_member_count int;
  v_next_owner uuid;
begin
  select role into v_role
  from public.trip_members
  where trip_id = p_trip_id and user_id = p_user_id;

  if v_role is null then
    return;
  end if;

  if v_role = 'owner' then
    select count(*) into v_member_count
    from public.trip_members
    where trip_id = p_trip_id;

    if v_member_count > 1 then
      select user_id into v_next_owner
      from public.trip_members
      where trip_id = p_trip_id and user_id <> p_user_id
      order by joined_at
      limit 1;

      update public.trip_members
      set role = 'owner'
      where trip_id = p_trip_id and user_id = v_next_owner;
    end if;
  end if;

  delete from public.trip_members
  where trip_id = p_trip_id and user_id = p_user_id;
end;
$$;

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
  v_existing_trip_id uuid;
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

  select tm.trip_id into v_existing_trip_id
  from public.trip_members tm
  where tm.user_id = v_user_id
  limit 1;

  if v_existing_trip_id is not null then
    perform public.leave_trip_internal(v_user_id, v_existing_trip_id);
  end if;

  insert into public.trip_members (trip_id, user_id, display_name, role)
  values (v_trip_id, v_user_id, trim(display_name), 'member');

  return v_trip_id;
end;
$$;

create or replace function public.leave_trip_session()
returns void
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

  select trip_id into v_trip_id
  from public.trip_members
  where user_id = v_user_id
  limit 1;

  if v_trip_id is null then
    return;
  end if;

  perform public.leave_trip_internal(v_user_id, v_trip_id);
end;
$$;

grant execute on function public.join_trip_by_code(text, text) to authenticated;
grant execute on function public.leave_trip_session() to authenticated;
