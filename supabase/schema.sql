-- ============================================================
-- ApnaMarket — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Communities ─────────────────────────────────────────────────────────────
create table if not exists communities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  city        text not null default 'Chennai',
  created_at  timestamptz default now()
);

-- Insert a default pilot community
insert into communities (name, city)
values ('Sunrise Apartments', 'Chennai')
on conflict do nothing;

-- ─── Users (extends Supabase auth.users) ─────────────────────────────────────
create table if not exists users (
  id                 uuid primary key references auth.users(id) on delete cascade,
  mobile             text unique not null,
  name               text not null default '',
  block              text not null default '',
  flat_number        text not null default '',
  profile_photo_url  text,
  is_seller          boolean not null default false,
  is_admin           boolean not null default false,
  community_id       uuid references communities(id),
  created_at         timestamptz default now()
);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, mobile)
  values (
    new.id,
    coalesce(new.phone, new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Listings ─────────────────────────────────────────────────────────────────
create table if not exists listings (
  id                  uuid primary key default uuid_generate_v4(),
  seller_id           uuid not null references users(id) on delete cascade,
  community_id        uuid not null references communities(id),
  category            text not null check (category in ('food','clothes','tuition','services','groceries','handmade')),
  title               text not null,
  description         text not null default '',
  primary_photo_url   text,
  is_available        boolean not null default true,
  contact_preference  text not null default 'whatsapp' check (contact_preference in ('phone','whatsapp','in_app')),
  delivery_available  boolean not null default false,
  delivery_charge     numeric,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_updated_at on listings;
create trigger listings_updated_at
  before update on listings
  for each row execute procedure set_updated_at();

-- ─── Listing Photos ────────────────────────────────────────────────────────────
create table if not exists listing_photos (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  uuid not null references listings(id) on delete cascade,
  photo_url   text not null,
  sort_order  integer not null default 0
);

-- ─── Food Details ─────────────────────────────────────────────────────────────
create table if not exists food_details (
  listing_id          uuid primary key references listings(id) on delete cascade,
  price               numeric not null,
  unit                text not null default 'per_plate',
  min_order           integer not null default 1,
  pre_order_required  boolean not null default false,
  order_by_time       text,
  is_veg              boolean not null default true,
  available_days      text[] not null default '{}'
);

-- ─── Cloth Items ──────────────────────────────────────────────────────────────
create table if not exists cloth_items (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  uuid not null references listings(id) on delete cascade,
  item_name   text not null,
  material    text,
  sort_order  integer not null default 0
);

-- ─── Cloth Item Photos ─────────────────────────────────────────────────────────
create table if not exists cloth_item_photos (
  id             uuid primary key default uuid_generate_v4(),
  cloth_item_id  uuid not null references cloth_items(id) on delete cascade,
  photo_url      text not null,
  sort_order     integer not null default 0
);

-- ─── Cloth Variants ────────────────────────────────────────────────────────────
create table if not exists cloth_variants (
  id             uuid primary key default uuid_generate_v4(),
  cloth_item_id  uuid not null references cloth_items(id) on delete cascade,
  size           text not null,
  price          numeric not null,
  stock_count    integer not null default 1
);

-- ─── Tuition Details ──────────────────────────────────────────────────────────
create table if not exists tuition_details (
  listing_id      uuid primary key references listings(id) on delete cascade,
  subjects        text[] not null default '{}',
  grades          text[] not null default '{}',
  board           text not null default 'CBSE',
  fee_per_month   numeric not null,
  max_students    integer not null default 5,
  mode            text not null default 'home' check (mode in ('home','online','both')),
  experience      text not null default '',
  batch_timings   text[] not null default '{}'
);

-- ─── Service Details ──────────────────────────────────────────────────────────
create table if not exists service_details (
  listing_id      uuid primary key references listings(id) on delete cascade,
  service_type    text not null,
  starting_price  numeric not null,
  price_type      text not null default 'fixed' check (price_type in ('fixed','starting_from','on_inspection')),
  availability    text not null default '',
  experience      text not null default ''
);

-- ─── Orders (Phase 2 placeholder) ─────────────────────────────────────────────
create table if not exists orders (
  id              uuid primary key default uuid_generate_v4(),
  buyer_id        uuid not null references users(id),
  seller_id       uuid not null references users(id),
  listing_id      uuid not null references listings(id),
  items_json      jsonb not null default '{}',
  total_amount    numeric not null,
  payment_status  text not null default 'pending' check (payment_status in ('pending','paid','refunded')),
  order_status    text not null default 'pending' check (order_status in ('pending','confirmed','preparing','ready','delivered','cancelled')),
  created_at      timestamptz default now()
);

-- ─── Reviews (Phase 2 placeholder) ────────────────────────────────────────────
create table if not exists reviews (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references orders(id),
  reviewer_id  uuid not null references users(id),
  seller_id    uuid not null references users(id),
  rating       integer not null check (rating between 1 and 5),
  comment      text not null default '',
  created_at   timestamptz default now()
);

-- ─── Storage Bucket ────────────────────────────────────────────────────────────
-- Run this separately in the Supabase Storage UI or via the dashboard:
-- Create a public bucket named "listing-photos"
-- Policy: allow authenticated users to upload; allow public read

-- ─── Row Level Security (RLS) ──────────────────────────────────────────────────
alter table communities    enable row level security;
alter table users          enable row level security;
alter table listings       enable row level security;
alter table listing_photos enable row level security;
alter table food_details   enable row level security;
alter table cloth_items    enable row level security;
alter table cloth_item_photos enable row level security;
alter table cloth_variants enable row level security;
alter table tuition_details enable row level security;
alter table service_details enable row level security;
alter table orders         enable row level security;
alter table reviews        enable row level security;

-- Communities: anyone can read
create policy "communities_read_all" on communities for select using (true);

-- Users: read all, update own
create policy "users_read_all" on users for select using (true);
create policy "users_insert_own" on users for insert with check (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);

-- Listings: read all available, insert/update/delete own
create policy "listings_read_all" on listings
  for select using (is_available = true or seller_id = auth.uid());

create policy "listings_insert_own" on listings
  for insert with check (auth.uid() = seller_id);

create policy "listings_update_own" on listings
  for update using (auth.uid() = seller_id);

create policy "listings_delete_own" on listings
  for delete using (auth.uid() = seller_id);

-- Listing photos: read all, manage own
create policy "listing_photos_read_all" on listing_photos for select using (true);
create policy "listing_photos_insert_own" on listing_photos
  for insert with check (
    exists (select 1 from listings where id = listing_id and seller_id = auth.uid())
  );
create policy "listing_photos_delete_own" on listing_photos
  for delete using (
    exists (select 1 from listings where id = listing_id and seller_id = auth.uid())
  );

-- Food details: read all, manage own
create policy "food_details_read_all" on food_details for select using (true);
create policy "food_details_insert_own" on food_details
  for insert with check (
    exists (select 1 from listings where id = listing_id and seller_id = auth.uid())
  );
create policy "food_details_update_own" on food_details
  for update using (
    exists (select 1 from listings where id = listing_id and seller_id = auth.uid())
  );
create policy "food_details_delete_own" on food_details
  for delete using (
    exists (select 1 from listings where id = listing_id and seller_id = auth.uid())
  );

-- Cloth items
create policy "cloth_items_read_all" on cloth_items for select using (true);
create policy "cloth_items_manage_own" on cloth_items
  for all using (
    exists (select 1 from listings where id = listing_id and seller_id = auth.uid())
  );

-- Cloth item photos
create policy "cloth_item_photos_read_all" on cloth_item_photos for select using (true);
create policy "cloth_item_photos_manage_own" on cloth_item_photos
  for all using (
    exists (
      select 1 from cloth_items ci
      join listings l on l.id = ci.listing_id
      where ci.id = cloth_item_id and l.seller_id = auth.uid()
    )
  );

-- Cloth variants
create policy "cloth_variants_read_all" on cloth_variants for select using (true);
create policy "cloth_variants_manage_own" on cloth_variants
  for all using (
    exists (
      select 1 from cloth_items ci
      join listings l on l.id = ci.listing_id
      where ci.id = cloth_item_id and l.seller_id = auth.uid()
    )
  );

-- Tuition details
create policy "tuition_details_read_all" on tuition_details for select using (true);
create policy "tuition_details_manage_own" on tuition_details
  for all using (
    exists (select 1 from listings where id = listing_id and seller_id = auth.uid())
  );

-- Service details
create policy "service_details_read_all" on service_details for select using (true);
create policy "service_details_manage_own" on service_details
  for all using (
    exists (select 1 from listings where id = listing_id and seller_id = auth.uid())
  );

-- ─── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_listings_community on listings(community_id);
create index if not exists idx_listings_category  on listings(category);
create index if not exists idx_listings_seller    on listings(seller_id);
create index if not exists idx_listings_created   on listings(created_at desc);
create index if not exists idx_cloth_items_listing on cloth_items(listing_id);
