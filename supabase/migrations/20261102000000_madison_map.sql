-- Madison weekend map: places + starred places shared between two phones.
-- Apply with the Supabase SQL editor, or `supabase db push`. Then run supabase/seed.sql.

-- ---------------------------------------------------------------------------
-- places: public, read-only from the browser (edit rows from the dashboard / SQL).
-- ---------------------------------------------------------------------------
create table if not exists public.places (
  id            text primary key,
  name          text not null,
  category      text not null check (
    category in ('hotels','airbnbs','events','nightlife','packers','vikings','sports','coffee','food')
  ),
  lat           double precision not null check (lat between 42.9 and 43.3),
  lng           double precision not null check (lng between -89.7 and -89.1),
  address       text,
  description   text not null default '',
  warning       text,
  coords_approx boolean not null default false,
  url           text check (url is null or url like 'https://%'),
  sort          integer not null default 0,
  updated_at    timestamptz not null default now()
);

alter table public.places enable row level security;

drop policy if exists "places are publicly readable" on public.places;
create policy "places are publicly readable"
  on public.places for select
  to anon, authenticated
  using (true);

grant select on public.places to anon, authenticated;

-- ---------------------------------------------------------------------------
-- shared_pins: the places you've starred, shared by everyone who knows the trip code.
--
-- The app sends the trip code in an `x-trip-code` request header (VITE_TRIP_CODE);
-- row-level security only lets a request see/change rows whose trip_code matches it.
-- This is a lightweight shared secret for a private two-person app — not real auth.
-- ---------------------------------------------------------------------------
create table if not exists public.shared_pins (
  trip_code  text not null check (length(trip_code) >= 8),
  place_id   text not null,
  created_at timestamptz not null default now(),
  primary key (trip_code, place_id)
);

create or replace function public.request_trip_code()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-trip-code', '');
$$;

alter table public.shared_pins enable row level security;

drop policy if exists "trip can read its pins" on public.shared_pins;
create policy "trip can read its pins"
  on public.shared_pins for select
  to anon
  using (trip_code = public.request_trip_code());

drop policy if exists "trip can add its pins" on public.shared_pins;
create policy "trip can add its pins"
  on public.shared_pins for insert
  to anon
  with check (trip_code = public.request_trip_code());

drop policy if exists "trip can remove its pins" on public.shared_pins;
create policy "trip can remove its pins"
  on public.shared_pins for delete
  to anon
  using (trip_code = public.request_trip_code());

grant select, insert, delete on public.shared_pins to anon;
