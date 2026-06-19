-- Allow trip owners to permanently delete their camping session (cascade removes all trip data)

create or replace function public.delete_trip_session()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip_id uuid;
  v_role text;
begin
  if v_user_id is null then
    raise exception 'Devi essere autenticato';
  end if;

  select trip_id, role into v_trip_id, v_role
  from public.trip_members
  where user_id = v_user_id
  limit 1;

  if v_trip_id is null then
    return;
  end if;

  if v_role <> 'owner' then
    raise exception 'Solo l''organizzatore può eliminare la sessione';
  end if;

  delete from public.trips where id = v_trip_id;
end;
$$;

grant execute on function public.delete_trip_session() to authenticated;
