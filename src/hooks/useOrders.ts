import { useQuery } from "@tanstack/react-query";
import {
  MercadoLivreOrdersResponse,
  OrdersFilters,
} from "@/lib/mercadoLivreTypes";
import { CACHE_TIMES } from "@/lib/queryConfig";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
/**
 * Busca pedidos do Mercado Livre via API
 */
async function fetchOrders(
  filters: OrdersFilters = {}
): Promise<MercadoLivreOrdersResponse> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.append("status", filters.status);
  }
  if (filters.limit) {
    params.append("limit", filters.limit.toString());
  }
  if (filters.offset !== undefined) {
    params.append("offset", filters.offset.toString());
  }
  if (filters.sort) {
    params.append("sort", filters.sort);
  }

  const url = `${API_BASE_URL}/api/mercadolibre/orders${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Erro ao buscar pedidos: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Hook para buscar pedidos do Mercado Livre
 */
export function useOrders(filters: OrdersFilters = {}) {
  return useQuery<MercadoLivreOrdersResponse>({
    queryKey: ["orders", filters],
    queryFn: () => fetchOrders(filters),
    ...CACHE_TIMES.DYNAMIC, // 2 minutos staleTime, 10 minutos gcTime
    retry: 2,
  });
}

/**
 * Hook para buscar um pedido específico
 */
export function useOrder(orderId: number | string) {
  return useQuery<MercadoLivreOrdersResponse>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      // Por enquanto, busca todos e filtra - idealmente teria um endpoint específico
      const response = await fetchOrders({ limit: 50 });
      const order = response.orders.results.find(
        (o) => o.id.toString() === orderId.toString()
      );

      if (!order) {
        throw new Error("Pedido não encontrado");
      }

      return {
        ...response,
        orders: {
          ...response.orders,
          results: [order],
          paging: { ...response.orders.paging, total: 1 },
        },
      };
    },
    enabled: !!orderId,
    ...CACHE_TIMES.DYNAMIC, // 2 minutos staleTime, 10 minutos gcTime
  });
}
