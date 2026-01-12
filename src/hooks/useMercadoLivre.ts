import { useQuery } from "@tanstack/react-query";
import {
  getSites,
  getSite,
  searchProducts,
  getCategory,
  getCategories,
  MercadoLivreSite,
  MercadoLivreSearchResult,
  MercadoLivreCategory,
} from "@/lib/mercadoLivreApi";
import { CACHE_TIMES } from "@/lib/queryConfig";

/**
 * Hook para buscar todos os sites disponíveis no Mercado Livre
 */
export function useMercadoLivreSites() {
  return useQuery<MercadoLivreSite[]>({
    queryKey: ["mercado-livre", "sites"],
    queryFn: getSites,
    ...CACHE_TIMES.STATIC, // 24 horas staleTime, 48 horas gcTime
  });
}

/**
 * Hook para buscar informações de um site específico
 */
export function useMercadoLivreSite(siteId: string) {
  return useQuery<MercadoLivreSite>({
    queryKey: ["mercado-livre", "site", siteId],
    queryFn: () => getSite(siteId),
    enabled: !!siteId,
    ...CACHE_TIMES.STATIC, // 24 horas staleTime, 48 horas gcTime
  });
}

/**
 * Hook para buscar produtos no Mercado Livre
 */
export function useMercadoLivreSearch(
  query: string,
  siteId: string = "MLB",
  limit: number = 10,
  enabled: boolean = true
) {
  return useQuery<MercadoLivreSearchResult>({
    queryKey: ["mercado-livre", "search", query, siteId, limit],
    queryFn: () => searchProducts(query, siteId, limit),
    enabled: enabled && !!query && query.length > 0,
    ...CACHE_TIMES.FREQUENT, // 5 minutos staleTime, 15 minutos gcTime
  });
}

/**
 * Hook para buscar categorias de um site
 */
export function useMercadoLivreCategories(siteId: string = "MLB") {
  return useQuery<MercadoLivreCategory[]>({
    queryKey: ["mercado-livre", "categories", siteId],
    queryFn: () => getCategories(siteId),
    enabled: !!siteId,
    ...CACHE_TIMES.STATIC, // 24 horas staleTime, 48 horas gcTime
  });
}

/**
 * Hook para buscar informações de uma categoria específica
 */
export function useMercadoLivreCategory(categoryId: string) {
  return useQuery<MercadoLivreCategory>({
    queryKey: ["mercado-livre", "category", categoryId],
    queryFn: () => getCategory(categoryId),
    enabled: !!categoryId,
    ...CACHE_TIMES.STATIC, // 24 horas staleTime, 48 horas gcTime
  });
}
