import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Listing } from '../types';

export function useListing(id: string) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select(`
          *,
          seller:users!seller_id(name, block, flat_number, profile_photo_url, mobile),
          food_items(*),
          food_menu_settings(*),
          tuition_details(*),
          service_details(*),
          photos:listing_photos(photo_url, sort_order),
          cloth_items(
            id, item_name, material, sort_order,
            variants:cloth_variants(id, size, price, stock_count)
          ),
          grocery_items(*),
          reviews(
            id, rating, comment, created_at,
            reviewer:users!reviewer_id(id, name, profile_photo_url)
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      setListing((data as unknown as Listing) || null);
    } catch (err: any) {
      console.error('Error fetching listing details:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  return {
    listing,
    isLoading,
    error,
    refetch: fetchListing,
  };
}
