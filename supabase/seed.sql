-- ApnaMarket Test Data Seed Script
-- Run this in the Supabase SQL Editor to populate your local/test DB

-- Ensure we have a default community
insert into communities (id, name, city)
values ('6f929d56-c997-485f-9376-a07f5e8a9e5a', 'Sunrise Apartments', 'Chennai')
on conflict (id) do nothing;

-- Create some mock users (sellers)
do $$
declare
  v_community_id uuid := '6f929d56-c997-485f-9376-a07f5e8a9e5a';
  user1 uuid := uuid_generate_v4();
  user2 uuid := uuid_generate_v4();
  user3 uuid := uuid_generate_v4();
  listing1 uuid := uuid_generate_v4();
  listing2 uuid := uuid_generate_v4();
  listing3 uuid := uuid_generate_v4();
  listing4 uuid := uuid_generate_v4();
  listing5 uuid := uuid_generate_v4();
begin

  -- Insert mock users into auth.users (requires bypassing standard signup, but for simple test data we can just insert directly if triggers allow, or we just insert into public.users and disable RLS temporarily. But since public.users references auth.users, we need auth users.)
  -- Wait, the simplest way to seed is to just insert into auth.users first.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values 
    (user1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seller1@test.com', 'none', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (user2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seller2@test.com', 'none', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
    (user3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seller3@test.com', 'none', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

  -- Wait, triggers might have already created public.users. Let's update them instead.
  update public.users set name = 'Priya Sharma', block = 'A', flat_number = '401', is_seller = true, community_id = v_community_id, mobile = '9999999991' where id = user1;
  update public.users set name = 'Rahul Kumar', block = 'B', flat_number = '102', is_seller = true, community_id = v_community_id, mobile = '9999999992' where id = user2;
  update public.users set name = 'Anita Desai', block = 'C', flat_number = '305', is_seller = true, community_id = v_community_id, mobile = '9999999993' where id = user3;

  -- Food Listing (Priya)
  insert into listings (id, seller_id, community_id, category, title, description, primary_photo_url, contact_preference, delivery_available)
  values (listing1, user1, v_community_id, 'food', 'Sunday Special Chicken Biriyani', 'Authentic Hyderabadi dum biriyani. Served with raita and salan. Taking pre-orders for Sunday lunch.', 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?w=800&auto=format&fit=crop', 'whatsapp', true);
  
  insert into food_details (listing_id, price, unit, min_order, pre_order_required, order_by_time, is_veg, available_days)
  values (listing1, 250, 'per_plate', 1, true, 'Saturday 8 PM', false, '{sun}');

  -- Clothes Listing (Anita)
  insert into listings (id, seller_id, community_id, category, title, description, primary_photo_url, contact_preference)
  values (listing2, user3, v_community_id, 'clothes', 'Summer Cotton Kurtis', 'Pure cotton kurtis direct from Jaipur. Fast colors, no shrinking. Multiple sizes available.', 'https://images.unsplash.com/photo-1583391733958-611825512b41?w=800&auto=format&fit=crop', 'whatsapp');

  insert into cloth_items (id, listing_id, item_name, material, sort_order)
  values 
    (uuid_generate_v4(), listing2, 'Blue Floral Print Kurti', 'Cotton', 1);

  insert into cloth_variants (cloth_item_id, size, price, stock_count)
  select id, 'M', 450, 5 from cloth_items where listing_id = listing2;

  -- Tuition Listing (Rahul)
  insert into listings (id, seller_id, community_id, category, title, description, contact_preference)
  values (listing3, user2, v_community_id, 'tuition', 'Math & Science Tuition (Class 8-10)', 'Experienced engineer offering evening tuition classes. Small batches of max 5 students to ensure personal attention.', 'whatsapp');

  insert into tuition_details (listing_id, subjects, grades, board, fee_per_month, max_students, mode, experience, batch_timings)
  values (listing3, '{Math,Science}', '{"Class 8","Class 9","Class 10"}', 'CBSE', 1500, 5, 'home', '5 years teaching experience', '{"Mon-Wed-Fri 5 PM to 7 PM"}');

  -- Services Listing (Rahul)
  insert into listings (id, seller_id, community_id, category, title, description, contact_preference)
  values (listing4, user2, v_community_id, 'services', 'AC Repair & Servicing', 'Expert AC technician living in the same community. Quick response for gas refilling, general service, and repairs.', 'phone');

  insert into service_details (listing_id, service_type, starting_price, price_type, availability, experience)
  values (listing4, 'AC Service', 499, 'starting_from', 'Weekends only', '7 years certified technician');

  -- Groceries / Homemade (Priya)
  insert into listings (id, seller_id, community_id, category, title, description, primary_photo_url, contact_preference)
  values (listing5, user1, v_community_id, 'groceries', 'Homemade Mango Pickle', 'Traditional Andhra style avakaya pickle made with cold pressed sesame oil. No preservatives.', 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=800&auto=format&fit=crop', 'in_app');

end $$;
