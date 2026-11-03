-- Nov 3 update: named lists that sync between phones, the "Outside town" category,
-- and http:// links. Safe to run more than once, and safe on a database that already
-- has the Nov 2 schema (existing stars become the "starred" list).

-- ---------------------------------------------------------------------------
-- places: new category + allow http:// links (a few small venues have no https)
-- ---------------------------------------------------------------------------
alter table public.places drop constraint if exists places_category_check;
alter table public.places add constraint places_category_check check (
  category in ('hotels','airbnbs','outside','events','nightlife','packers','vikings','sports','coffee','food')
);

alter table public.places drop constraint if exists places_url_check;
alter table public.places add constraint places_url_check check (url is null or url ~ '^https?://');

-- ---------------------------------------------------------------------------
-- shared_pins: one row per (trip, list, place). Existing rows are the "starred" list.
-- Row-level security is unchanged: rows are still scoped by trip_code.
-- ---------------------------------------------------------------------------
alter table public.shared_pins add column if not exists list_id text not null default 'starred';
alter table public.shared_pins drop constraint if exists shared_pins_pkey;
alter table public.shared_pins add constraint shared_pins_pkey primary key (trip_code, list_id, place_id);

-- ---------------------------------------------------------------------------
-- trip_lists: names/emoji of custom lists ("Sunday brunch"...). Built-in lists
-- (Starred, Fri night, Saturday, Sunday, Maybe) live in the app and need no row.
-- ---------------------------------------------------------------------------
create table if not exists public.trip_lists (
  trip_code  text not null check (length(trip_code) >= 8),
  list_id    text not null,
  name       text not null check (length(name) between 1 and 40),
  emoji      text,
  created_at timestamptz not null default now(),
  primary key (trip_code, list_id)
);

alter table public.trip_lists enable row level security;

drop policy if exists "trip can read its lists" on public.trip_lists;
create policy "trip can read its lists"
  on public.trip_lists for select
  to anon
  using (trip_code = public.request_trip_code());

drop policy if exists "trip can add its lists" on public.trip_lists;
create policy "trip can add its lists"
  on public.trip_lists for insert
  to anon
  with check (trip_code = public.request_trip_code());

drop policy if exists "trip can remove its lists" on public.trip_lists;
create policy "trip can remove its lists"
  on public.trip_lists for delete
  to anon
  using (trip_code = public.request_trip_code());

grant select, insert, delete on public.trip_lists to anon;
