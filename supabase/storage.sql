-- Run this in your Supabase SQL Editor to create the Storage Bucket for photos

-- Create the listing-photos bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Note: Row Level Security is usually enabled by default on storage.objects in Supabase.

-- Policy 1: Anyone can read (view) the public photos
create policy "Public Access to listing-photos"
on storage.objects for select
using ( bucket_id = 'listing-photos' );

-- Policy 2: Authenticated users can insert (upload) photos
create policy "Authenticated users can upload photos"
on storage.objects for insert
with check (
  bucket_id = 'listing-photos'
  and auth.role() = 'authenticated'
);

-- Policy 3: Users can update their own photos
create policy "Users can update their own photos"
on storage.objects for update
using (
  bucket_id = 'listing-photos'
  and auth.uid() = owner
);

-- Policy 4: Users can delete their own photos
create policy "Users can delete their own photos"
on storage.objects for delete
using (
  bucket_id = 'listing-photos'
  and auth.uid() = owner
);
