-- Prezzo singolo e confezione (da Open Food Facts)
alter table public.shopping_items
  add column if not exists unit_price numeric(10,2),
  add column if not exists pack_size text;
