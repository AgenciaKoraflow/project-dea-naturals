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

/**
 * Hook para buscar todos os sites disponíveis no Mercado Livre
 */
export function useMercadoLivreSites() {
  return useQuery<MercadoLivreSite[]>({
    queryKey: ["mercado-livre", "sites"],
    queryFn: getSites,
    staleTime: 1000 * 60 * 60, // 1 hora - sites mudam raramente
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
    staleTime: 1000 * 60 * 60, // 1 hora
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
    staleTime: 1000 * 60 * 5, // 5 minutos - resultados de busca mudam frequentemente
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
    staleTime: 1000 * 60 * 60, // 1 hora - categorias mudam raramente
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
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}
