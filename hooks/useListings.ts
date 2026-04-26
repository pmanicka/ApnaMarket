import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Listing } from '../types';

interface UseListingsOptions {
  communityId?: string;
  category?: string;
  searchQuery?: string;
  sellerId?: string;
  status?: 'active' | 'paused' | 'all';
  sortBy?: 'latest' | 'oldest';
  isVegOnly?: boolean;
}

const PAGE_SIZE = 10;

export function useListings({ communityId, category, searchQuery, sellerId, status = 'active', sortBy = 'latest', isVegOnly = false }: UseListingsOptions = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const fetchListings = useCallback(async (pageIndex: number, isRefresh = false) => {
    // We require either communityId or sellerId
    if (!communityId && !sellerId) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else if (pageIndex === 0) {
      setIsLoading(true);
    } else {
      setIsFetchingNextPage(true);
    }
    
    if (pageIndex === 0) setError(null);

    try {
      const selectString = isVegOnly 
        ? `
          *,
          seller:users!seller_id(name, block, flat_number, profile_photo_url),
          food_details!inner(*),
          tuition_details(*),
          service_details(*),
          cloth_items(id, item_name, variants:cloth_variants(price))
        `
        : `
          *,
          seller:users!seller_id(name, block, flat_number, profile_photo_url),
          food_details(*),
          tuition_details(*),
          service_details(*),
          cloth_items(id, item_name, variants:cloth_variants(price))
        `;

      let query = supabase
        .from('listings')
        .select(selectString, { count: 'exact' })
        .order('created_at', { ascending: sortBy === 'latest' ? false : true });

      if (communityId) query = query.eq('community_id', communityId);
      if (sellerId) query = query.eq('seller_id', sellerId);

      if (status === 'active') query = query.eq('is_available', true);
      if (status === 'paused') query = query.eq('is_available', false);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      if (isVegOnly) {
        query = query.eq('food_details.is_veg', true);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const fetchedListings = (data as unknown as Listing[]) || [];
      
      if (pageIndex === 0) {
        setListings(fetchedListings);
      } else {
        setListings(prev => [...prev, ...fetchedListings]);
      }

      setHasMore(count !== null && from + fetchedListings.length < count);
    } catch (err: any) {
      console.error('Error fetching listings:', err);
      if (pageIndex === 0) setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsFetchingNextPage(false);
    }
  }, [communityId, category, searchQuery, sellerId, status, sortBy]);

  // Reset page to 0 and fetch when filters change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchListings(0);
  }, [fetchListings]);

  const fetchNextPage = () => {
    if (!hasMore || isFetchingNextPage || isLoading || isRefreshing) return;
    const nextPageIndex = page + 1;
    setPage(nextPageIndex);
    fetchListings(nextPageIndex);
  };

  const refetch = () => {
    setPage(0);
    setHasMore(true);
    fetchListings(0, true);
  };

  return {
    listings,
    isLoading,
    error,
    isRefreshing,
    isFetchingNextPage,
    hasMore,
    refetch,
    fetchNextPage,
  };
}
