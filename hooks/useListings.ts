import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Listing } from '../types';

interface UseListingsOptions {
  communityId?: string;
  category?: string;
  searchQuery?: string;
}

export function useListings({ communityId, category, searchQuery }: UseListingsOptions = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchListings = useCallback(async (refresh = false) => {
    if (!communityId) return;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          seller:users!seller_id(name, block, flat_number, profile_photo_url),
          food_details(*),
          tuition_details(*),
          service_details(*),
          cloth_items(
            id, item_name,
            variants:cloth_variants(price)
          )
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Type cast the response. We are using standard Postgres joined querying.
      // @ts-ignore - Supabase types can be tricky with deep joins
      setListings((data as Listing[]) || []);
    } catch (err: any) {
      console.error('Error fetching listings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [communityId, category, searchQuery]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    isLoading,
    error,
    isRefreshing,
    refetch: () => fetchListings(true),
  };
}
