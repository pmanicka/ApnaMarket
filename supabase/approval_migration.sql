-- ============================================================
-- ApnaMarket — Approval System Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add is_approved column to users (if not already present)
alter table users add column if not exists is_approved boolean not null default false;

-- 2. Add is_active flag to communities so admin can enable/disable them
alter table communities add column if not exists is_active boolean not null default true;

-- 3. Auto-approve admins
update users set is_approved = true where is_admin = true;

-- 4. Mark the existing pilot community as active
update communities set is_active = true;

-- 5. RLS: Users can only view/list communities that are active
-- (Add this policy in Supabase Dashboard → Authentication → Policies if not already done)
-- drop policy if exists "Public can view active communities" on communities;
-- create policy "Public can view active communities"
--   on communities for select
--   using (is_active = true);
