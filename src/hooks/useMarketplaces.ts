import { useQuery } from '@tanstack/react-query';
import { supabase, Marketplace } from '@/lib/supabase';

export function useMarketplaces() {
  return useQuery({
    queryKey: ['marketplaces'],
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
