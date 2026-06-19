-- Corregge coordinate Parco del Gravio (Condove, TO) — prima erano sbagliate (Lombardia)
update public.trips
set
  lat = 45.1163418,
  lng = 7.2956743,
  location_name = case
    when location_name ilike '%gravio%' then 'Parco del Gravio, Condove'
    else location_name
  end,
  address = case
    when address is null or address = '' or address ilike '%lombardia%' or address = location_name
    then 'Borgata Poisatto 68, 10055 Condove (TO)'
    else address
  end
where
  (lat between 45.67 and 45.69 and lng between 9.51 and 9.52)
  or (location_name ilike '%parco del gravio%' and lat <> 45.1163418);
