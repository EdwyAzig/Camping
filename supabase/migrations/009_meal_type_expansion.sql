-- Expand meal_type values to match app types (aperitivo, notte, altro, etc.)

alter table public.meals drop constraint if exists meals_meal_type_check;

alter table public.meals
  add constraint meals_meal_type_check
  check (meal_type in (
    'colazione', 'pranzo', 'cena',
    'aperitivo', 'cena_speciale', 'notte', 'altro'
  ));
