import { QueryClient } from "@tanstack/react-query";

/**
 * Configurações centralizadas de cache para React Query
 * 
 * O React Query já implementa read-through cache automaticamente:
 * - Se os dados estão no cache e não estão stale, retorna do cache sem fazer fetch
 * - Se os dados estão stale ou não existem, faz fetch e atualiza o cache
 * 
 * staleTime: Tempo até os dados serem considerados "stale" (precisam refetch em background)
 * gcTime (garbage collection time): Tempo que os dados ficam no cache após não serem usados (TTL real)
 */

/**
 * Configurações de cache por tipo de dados
 * Valores em milissegundos
 */
export const CACHE_TIMES = {
  // Dados estáticos que raramente mudam (categorias, sites ML)
  STATIC: {
    staleTime: 1000 * 60 * 60 * 24, // 24 horas - dados considerados frescos por 24h
    gcTime: 1000 * 60 * 60 * 48, // 48 horas - dados ficam no cache por 48h
  },
  
  // Dados semi-estáticos (marketplaces, configurações)
  SEMI_STATIC: {
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60 * 2, // 2 horas
  },
  
  // Dados que mudam com frequência (pedidos, devoluções)
  DYNAMIC: {
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  },
  
  // Dados que mudam muito frequentemente (busca, listagens)
  FREQUENT: {
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
  },
  
  // Credenciais/configurações sensíveis
  SENSITIVE: {
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 15, // 15 minutos
  },
} as const;

/**
 * Cria uma instância do QueryClient com configurações otimizadas de cache
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Configurações padrão para todas as queries
        staleTime: 1000 * 60 * 5, // 5 minutos padrão
        gcTime: 1000 * 60 * 30, // 30 minutos padrão (dados ficam no cache por 30min)
        retry: 2,
        refetchOnWindowFocus: false, // Evita refetch desnecessário ao focar na janela
        refetchOnReconnect: true, // Refetch ao reconectar (útil para offline)
      },
    },
  });
}
