-- KARVAAN data model (PostgreSQL / Supabase).
-- Mirrors lib/types.ts. Privacy is enforced in the database, not the UI:
-- anonymous reads go through the `public_*` views, which redact identity
-- according to each owner's visibility setting.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ geography
create table country (code text primary key, name text not null);
create table state (
  code text primary key,
  country_code text not null references country(code),
  name text not null
);
create table city (
  slug text primary key,
  state_code text not null references state(code),
  name text not null,
  rto text not null
);

-- ------------------------------------------------------------------ people
create type privacy as enum ('public', 'club', 'private');

create table profile (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  city_slug text references city(slug),
  portrait_url text,
  bio text default '',
  instagram text,
  phone text,                      -- never exposed publicly
  privacy privacy not null default 'public',
  created_at timestamptz not null default now()
);

-- A garage is 1:1 with a user; kept separate so shared/family garages are possible later.
create table garage (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references profile(id) on delete cascade
);

-- ------------------------------------------------------------------ clubs
create type club_category as enum ('Supercar','Superbike','Car','Bike','Modification','Classic','JDM','Performance');
create type vehicle_kind as enum ('car','bike');

create table club (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short text not null,
  category club_category not null,
  kind text not null check (kind in ('car','bike','mixed')),
  city_slug text not null references city(slug),
  founded int,
  verified boolean not null default false,
  hero_url text,
  about text,
  socials jsonb not null default '{}'
);

create type club_role as enum ('member','admin','owner');
create table club_member (
  club_id uuid references club(id) on delete cascade,
  profile_id uuid references profile(id) on delete cascade,
  role club_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (club_id, profile_id)
);

-- ------------------------------------------------------------------ vehicles
create table vehicle (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  serial serial unique,
  garage_id uuid not null references garage(id) on delete cascade,
  club_id uuid references club(id) on delete set null,
  kind vehicle_kind not null,
  class text not null,
  make text not null,
  model text not null,
  variant text,
  year int not null,
  colour text,
  city_slug text references city(slug),
  engine text,
  power_hp int,
  torque_nm int,
  transmission text,
  drivetrain text,
  zero_to_hundred numeric(3,1),
  top_speed int,
  mods text[] not null default '{}',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
create table vehicle_media (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicle(id) on delete cascade,
  kind text not null check (kind in ('photo','video')),
  url text not null,
  poster_url text,
  title text,
  position int not null default 0
);
create table vehicle_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicle(id) on delete cascade,
  happened_on date not null,
  title text not null,
  detail text
);

-- ------------------------------------------------------------------ routes & events
-- Routes are not standalone: each is created with (and owned by) a Drive,
-- Ride or Road Trip event. See event.route_id.
create table route (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  from_name text not null,
  to_name text not null,
  state_code text references state(code),
  distance_km int not null,
  duration_min int not null,
  difficulty text not null,
  surface text,
  best_time text,
  cover_url text,
  summary text,
  path jsonb not null,             -- [[lat,lng], ...]
  elevation int[] not null default '{}'
);
create table route_stop (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references route(id) on delete cascade,
  kind text not null check (kind in ('start','fuel','food','scenic','photo','end')),
  name text not null,
  km int not null,
  lat double precision not null,
  lng double precision not null,
  note text
);

create table event (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null,
  kind text not null check (kind in ('car','bike','mixed')),
  cover_url text,
  city_slug text not null references city(slug),
  starts_at timestamptz not null,
  ends_at timestamptz,
  organizer_club_id uuid not null references club(id),
  route_id uuid unique references route(id) on delete set null,
  venue text,
  summary text,
  rules text[] not null default '{}',
  created_by uuid not null references profile(id),
  constraint route_only_for_drives check (route_id is null or category in ('Drive','Ride','Road Trip'))
);
create table ticket_type (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references event(id) on delete cascade,
  name text not null,
  price_inr int not null check (price_inr >= 0),
  perks text[] not null default '{}',
  capacity int check (capacity > 0)   -- null = open entry, no slot limit
);
create type ticket_status as enum ('pending','paid','cancelled','checked_in');
create table ticket (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  ticket_type_id uuid not null references ticket_type(id),
  holder_id uuid not null references profile(id),
  quantity int not null check (quantity between 1 and 6),
  subtotal_inr int not null,
  platform_fee_inr int not null,   -- 1.5% of subtotal
  total_inr int not null,
  vehicle_reg text,                -- organiser-only, for check-in
  status ticket_status not null default 'pending',
  payment_ref text,
  created_at timestamptz not null default now()
);
create table event_vehicle (
  event_id uuid references event(id) on delete cascade,
  vehicle_id uuid references vehicle(id) on delete cascade,
  primary key (event_id, vehicle_id)
);

-- ------------------------------------------------------------------ builds
create table build (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  vehicle_id uuid not null references vehicle(id) on delete cascade,
  title text not null,
  stage text not null,
  stock_hp int, tuned_hp int, stock_nm int, tuned_nm int,
  duration_weeks int,
  workshop_id uuid,
  before_url text, after_url text,
  story text
);
create table build_part (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references build(id) on delete cascade,
  slot text not null,
  part text not null,
  brand text,
  cost_inr int
);

-- ------------------------------------------------------------------ businesses & brands
create table business (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  categories text[] not null,
  city_slug text not null references city(slug),
  area text,
  verified boolean not null default false,
  cover_url text,
  about text,
  phone text, website text, instagram text, hours text,
  sponsored boolean not null default false
);
alter table build add constraint build_workshop_fk foreign key (workshop_id) references business(id);
create table business_service (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  name text not null,
  from_inr int
);
create table review (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references business(id) on delete cascade,
  author_id uuid not null references profile(id),
  vehicle_id uuid references vehicle(id),
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (business_id, author_id)
);

create table brand (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  line text,
  kind text
);
-- One table for every placement type (hero, event, club, category, city, showcase).
create table sponsorship (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brand(id),
  placement text not null check (placement in ('home_hero','event','club','category','city','banner','vehicle_showcase')),
  target_id uuid,                  -- event/club/vehicle id, null for global
  target_key text,                 -- category or city slug
  starts_on date not null,
  ends_on date not null
);

-- ------------------------------------------------------------------ follows
create type follow_kind as enum ('owner','club','vehicle','build','business');
create table follow (
  follower_id uuid not null references profile(id) on delete cascade,
  kind follow_kind not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, kind, target_id)
);
create index on follow (kind, target_id);
-- Counts shown on profiles.
create view follower_count as select kind, target_id, count(*)::int as followers from follow group by kind, target_id;
create view following_count as select follower_id, count(*)::int as following from follow group by follower_id;

-- ------------------------------------------------------------------ likes
-- Instagram-style hearts on profiles, clubs, vehicles, builds, events,
-- businesses and individual photos (target_key = media path for images).
create type like_kind as enum ('owner','club','vehicle','build','business','event','image');
create table "like" (
  profile_id uuid not null references profile(id) on delete cascade,
  kind like_kind not null,
  target_key text not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, kind, target_key)
);
create index on "like" (kind, target_key);
create view like_count as select kind, target_key, count(*)::int as likes from "like" group by kind, target_key;
alter table "like" enable row level security;
create policy like_read on "like" for select using (true);
create policy like_self on "like" for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ------------------------------------------------------------------ club membership
-- Cards are independent by default. An owner requests to join; a club admin
-- approves (card is filed under the club) or declines (card stays independent).
-- Admins can also add members directly.
create type request_status as enum ('pending','approved','declined');
create table club_join_request (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references club(id) on delete cascade,
  profile_id uuid not null references profile(id) on delete cascade,
  vehicle_id uuid not null references vehicle(id) on delete cascade,
  message text,
  status request_status not null default 'pending',
  decided_by uuid references profile(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index one_open_request on club_join_request (club_id, vehicle_id) where status = 'pending';

create or replace function is_club_admin(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from club_member where club_id = c and profile_id = auth.uid() and role in ('admin','owner'));
$$;

-- On approval: add membership and file the card under the club, atomically.
create or replace function approve_join_request(req uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r club_join_request;
begin
  select * into r from club_join_request where id = req and status = 'pending' for update;
  if not found then raise exception 'request not pending'; end if;
  if not is_club_admin(r.club_id) then raise exception 'not a club admin'; end if;
  insert into club_member (club_id, profile_id) values (r.club_id, r.profile_id) on conflict do nothing;
  update vehicle set club_id = r.club_id where id = r.vehicle_id;
  update club_join_request set status = 'approved', decided_by = auth.uid(), decided_at = now() where id = req;
end $$;

-- ------------------------------------------------------------------ privacy
create or replace function shares_club(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from club_member m1 join club_member m2 using (club_id)
    where m1.profile_id = a and m2.profile_id = b
  );
$$;

-- Public projection of owners: identity redacted per visibility setting.
create or replace view public_profile with (security_barrier) as
select
  p.id,
  case when p.privacy = 'public' or p.id = auth.uid()
         or (p.privacy = 'club' and shares_club(p.id, auth.uid())) then p.handle end as handle,
  case when p.privacy = 'private' and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000') then 'Private Owner'
       when p.privacy = 'club' and not shares_club(p.id, auth.uid()) and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
         then regexp_replace(p.name, '(\w)\w*', '\1.', 'g')
       else p.name end as name,
  case when p.privacy = 'public' or p.id = auth.uid()
         or (p.privacy = 'club' and shares_club(p.id, auth.uid())) then p.portrait_url end as portrait_url,
  case when p.privacy = 'private' and p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000') then null else p.city_slug end as city_slug,
  (select s.name from city c join state s on s.code = c.state_code where c.slug = p.city_slug) as region,
  p.privacy
from profile p;

-- ------------------------------------------------------------------ RLS
alter table profile enable row level security;
alter table garage enable row level security;
alter table vehicle enable row level security;
alter table ticket enable row level security;
alter table club_member enable row level security;
alter table review enable row level security;

-- Raw profile rows (with phone etc.) are readable only by their owner; everyone else uses public_profile.
create policy profile_self_read on profile for select using (id = auth.uid());
create policy profile_self_write on profile for update using (id = auth.uid());

create policy garage_read on garage for select using (true);
create policy garage_self_write on garage for all using (owner_id = auth.uid());

create policy vehicle_read on vehicle for select using (true);
create policy vehicle_owner_write on vehicle for all
  using (garage_id in (select id from garage where owner_id = auth.uid()));

-- Tickets: holder sees their own; organiser admins see their event's tickets.
create policy ticket_holder on ticket for select using (holder_id = auth.uid());
create policy ticket_organiser on ticket for select using (
  exists (
    select 1 from ticket_type tt
    join event e on e.id = tt.event_id
    join club_member cm on cm.club_id = e.organizer_club_id
    where tt.id = ticket.ticket_type_id and cm.profile_id = auth.uid() and cm.role in ('admin','owner')
  )
);
create policy ticket_insert on ticket for insert with check (holder_id = auth.uid());

create policy club_member_read on club_member for select using (true);
-- No self-join: only admins add members (directly or via approve_join_request).
create policy club_member_admin_add on club_member for insert with check (is_club_admin(club_id));
create policy club_member_admin_remove on club_member for delete using (is_club_admin(club_id) or profile_id = auth.uid());

alter table club_join_request enable row level security;
create policy request_own on club_join_request for select using (profile_id = auth.uid() or is_club_admin(club_id));
create policy request_create on club_join_request for insert with check (
  profile_id = auth.uid() and status = 'pending'
  and vehicle_id in (select v.id from vehicle v join garage g on g.id = v.garage_id where g.owner_id = auth.uid())
);
create policy request_decline on club_join_request for update using (is_club_admin(club_id));

-- Vehicles can only be filed under a club via approval, never by the owner directly.
create policy vehicle_club_guard on vehicle as restrictive for update
  using (true) with check (club_id is null or club_id = (select club_id from vehicle x where x.id = vehicle.id) or is_club_admin(club_id));

-- Only club admins create events for their club.
alter table event enable row level security;
create policy event_admin_write on event for insert with check (is_club_admin(organizer_club_id) and created_by = auth.uid());
create policy event_admin_update on event for update using (is_club_admin(organizer_club_id));

alter table follow enable row level security;
create policy follow_read on follow for select using (true);
create policy follow_self on follow for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

create policy review_read on review for select using (true);
create policy review_write on review for insert with check (author_id = auth.uid());

-- Remaining catalogue tables are public-read.
do $$ declare t text; begin
  foreach t in array array['country','state','city','club','vehicle_media','vehicle_history','route','route_stop','ticket_type','event_vehicle','build','build_part','business','business_service','brand','sponsorship']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (true)', t || '_read', t);
  end loop;
end $$;

create index on vehicle (garage_id);
create index on vehicle (club_id);
create index on vehicle (city_slug);
create index on event (starts_at);
create index on event (city_slug);
create index on ticket (holder_id);
create index on club (city_slug);
create index on business (city_slug);

create policy event_read on event for select using (true);
