-- Group shopping items by meal / day (e.g. colazione:1, pranzo:2, merenda)
alter table public.shopping_items
  add column if not exists meal_group text;
