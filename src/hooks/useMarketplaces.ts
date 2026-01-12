import { useQuery } from '@tanstack/react-query';
import { supabase, Marketplace } from '@/lib/supabase';
import { CACHE_TIMES } from '@/lib/queryConfig';

export function useMarketplaces() {
  return useQuery({
    queryKey: ['marketplaces'],
    ...CACHE_TIMES.SEMI_STATIC, // 30 minutos staleTime, 2 horas gcTime
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Marketplace[];
    },
  });
}
