import { useQuery } from '@tanstack/react-query';
import { supabase, Return } from '@/lib/supabase';
import { CACHE_TIMES } from '@/lib/queryConfig';

interface UseReturnsOptions {
  searchQuery?: string;
  status?: string;
  marketplaceId?: string;
  startDate?: Date;
  endDate?: Date;
}

export function useReturns(options: UseReturnsOptions = {}) {
  const { searchQuery, status, marketplaceId, startDate, endDate } = options;

  return useQuery({
    queryKey: ['returns', searchQuery, status, marketplaceId, startDate, endDate],
    ...CACHE_TIMES.DYNAMIC, // 2 minutos staleTime, 10 minutos gcTime
    queryFn: async () => {
      let query = supabase
        .from('returns')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtro por busca
      if (searchQuery) {
        query = query.or(`order_id.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,product_name.ilike.%${searchQuery}%`);
      }

      // Filtro por status
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Filtro por marketplace
      if (marketplaceId && marketplaceId !== 'all') {
        query = query.eq('marketplace_id', marketplaceId);
      }

      // Filtro por data
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Return[];
    },
  });
}

export function useReturn(id: string) {
  return useQuery({
    queryKey: ['return', id],
    ...CACHE_TIMES.DYNAMIC, // 2 minutos staleTime, 10 minutos gcTime
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Return;
    },
    enabled: !!id,
  });
}
