-- Open Food Facts + barcode + prezzi reali sulla lista spesa
alter table public.shopping_items
  add column if not exists barcode text,
  add column if not exists brand text,
  add column if not exists image_url text,
  add column if not exists food_type text,
  add column if not exists actual_price numeric(10,2),
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'openfoodfacts'));

create index if not exists shopping_items_barcode_idx
  on public.shopping_items (trip_id, barcode)
  where barcode is not null;
