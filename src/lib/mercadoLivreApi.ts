/**
 * Serviço para integração com a API do Mercado Livre
 * Documentação: https://developers.mercadolivre.com.br/pt_br/itens-e-buscas
 */

const API_BASE_URL = "https://api.mercadolibre.com";

export interface MercadoLivreSite {
  id: string;
  name: string;
  country_id: string;
  sale_fees_mode: string;
  mercadopago_version: number;
  default_currency_id: string;
  immediate_payment: string;
  payment_method_ids: string[];
  settings: {
    identification_types: string[];
    taxpayer_types: string[];
    buy_it_now_enabled: string;
    accepted_payment_methods: string[];
    gift_wrap_enabled: boolean;
  };
  currencies: Array<{
    id: string;
    symbol: string;
    description: string;
    decimal_places: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
  }>;
}

export interface MercadoLivreCategory {
  id: string;
  name: string;
  picture?: string;
  permalink?: string;
  total_items_in_this_category?: number;
  path_from_root?: Array<{
    id: string;
    name: string;
  }>;
  children_categories?: Array<{
    id: string;
    name: string;
    total_items_in_this_category: number;
  }>;
  attribute_types?: string;
  settings?: {
    adult_content: boolean;
    buying_allowed: boolean;
    buying_modes: string[];
    catalog_domain: string;
    coverage_areas: string;
    currencies: string[];
    fragile: boolean;
    immediate_payment: string;
    item_conditions: string[];
    items_reviews_allowed: boolean;
    listing_allowed: boolean;
    max_description_length: number;
    max_pictures_per_item: number;
    max_sub_title_length: number;
    max_title_length: number;
    maximum_price?: number;
    maximum_price_currency?: string;
    minimum_price?: number;
    minimum_price_currency?: string;
    mirror_category?: string;
    mirror_master_category?: string;
    mirror_slave_categories: string[];
    price: string;
    reservation_allowed: string;
    restrictions: string[];
    rounded_address: boolean;
    seller_contact: string;
    shipping_modes: string[];
    shipping_options: string[];
    shipping_profile: string;
    show_contact_information: boolean;
    simple_shipping: string;
    stock: string;
    sub_vertical: string;
    subscribable: boolean;
    tags: string[];
    vertical: string;
    vip_subdomain: string;
    buyer_protection_programs: string[];
    status: string;
  };
}

export interface MercadoLivreSearchResult {
  site_id: string;
  query: string;
  paging: {
    total: number;
    offset: number;
    limit: number;
    primary_results: number;
  };
  results: Array<{
    id: string;
    site_id: string;
    title: string;
    seller: {
      id: number;
      permalink?: string;
      registration_date?: string;
      car_dealer?: boolean;
      real_estate_agency?: boolean;
      tags?: string[];
      eshop?: {
        eshop_id: number;
        seller: number;
        nick_name: string;
        eshop_status_id: number;
        site_id: string;
        eshop_experience: number;
        eshop_rubro?: string;
        eshop_locations: Array<{
          neighborhood?: {
            id: string;
            name: string;
          };
          city?: {
            id: string;
            name: string;
          };
          state?: {
            id: string;
            name: string;
          };
        }>;
        is_hipster: boolean;
        is_marketplace: boolean;
        is_official_store: boolean;
        is_promoted: boolean;
        is_verified: boolean;
        eshop_logo_url?: string;
      };
      seller_reputation?: {
        level_id?: string;
        power_seller_status?: string;
        transactions?: {
          total?: number;
          canceled?: number;
          period?: string;
          ratings?: {
            negative?: number;
            neutral?: number;
            positive?: number;
          };
          completed?: number;
        };
      };
    };
    price: number;
    prices?: {
      id: string;
      prices: Array<{
        id: string;
        type: string;
        amount: number;
        regular_amount?: number;
        currency_id: string;
        last_updated: string;
        conditions?: {
          context_restrictions: string[];
          start_time?: string;
          end_time?: string;
          eligible: boolean;
        };
        exchange_rate_context: string;
        metadata?: Record<string, unknown>;
      }>;
      presentation?: {
        display_currency: string;
      };
      payment_method_prices: unknown[];
      reference_prices: Array<{
        id: string;
        type: string;
        conditions?: {
          context_restrictions: string[];
          start_time?: string;
          end_time?: string;
          eligible: boolean;
        };
        amount: number;
        currency_id: string;
        exchange_rate_context: string;
        tags?: unknown[];
        last_updated: string;
      }>;
      purchase_discounts: unknown[];
    };
    sale_price?: number;
    currency_id: string;
    available_quantity: number;
    sold_quantity: number;
    buying_mode: string;
    listing_type_id: string;
    stop_time: string;
    condition: string;
    permalink: string;
    thumbnail: string;
    pictures: Array<{
      id: string;
      url: string;
      secure_url: string;
      size: string;
      max_size: string;
      quality: string;
    }>;
    accepts_mercadopago: boolean;
    installments?: {
      quantity: number;
      amount: number;
      rate: number;
      currency_id: string;
    };
    address?: {
      state_id: string;
      state_name: string;
      city_id?: string;
      city_name: string;
    };
    shipping: {
      free_shipping: boolean;
      mode: string;
      tags: string[];
      logistic_type?: string;
      store_pick_up?: boolean;
    };
    seller_address?: {
      id: string;
      comment: string;
      address_line: string;
      zip_code: string;
      country: {
        id: string;
        name: string;
      };
      state: {
        id: string;
        name: string;
      };
      city: {
        id: string;
        name: string;
      };
      latitude?: string;
      longitude?: string;
    };
    attributes: Array<{
      id: string;
      name: string;
      value_id?: string;
      value_name: string;
      value_struct?: {
        number: number;
        unit: string;
      };
      attribute_group_id?: string;
      attribute_group_name?: string;
    }>;
    variations?: unknown[];
    status: string;
    sub_status: string[];
    tags: string[];
    warranty?: string;
    catalog_product_id?: string;
    domain_id: string;
    parent_item_id?: string;
    differential_pricing?: {
      id: number;
    };
    deal_ids?: string[];
    automatic_relist?: boolean;
    date_created: string;
    last_updated: string;
    health?: number;
    catalog_listing?: boolean;
    channels: string[];
  }>;
  secondary_results: unknown[];
  related_results: unknown[];
  sort: {
    id: string;
    name: string;
  };
  available_sorts: Array<{
    id: string;
    name: string;
  }>;
  filters: unknown[];
  available_filters: unknown[];
}

/**
 * Busca os sites disponíveis no Mercado Livre
 */
export async function getSites(): Promise<MercadoLivreSite[]> {
  const response = await fetch(`${API_BASE_URL}/sites`);
  if (!response.ok) {
    throw new Error(`Erro ao buscar sites: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Busca informações de um site específico
 */
export async function getSite(siteId: string): Promise<MercadoLivreSite> {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}`);
  if (!response.ok) {
    throw new Error(`Erro ao buscar site ${siteId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Busca produtos no Mercado Livre
 */
export async function searchProducts(
  query: string,
  siteId: string = "MLB", // Brasil por padrão
  limit: number = 10
): Promise<MercadoLivreSearchResult> {
  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(
    `${API_BASE_URL}/sites/${siteId}/search?q=${encodedQuery}&limit=${limit}`
  );
  if (!response.ok) {
    throw new Error(`Erro ao buscar produtos: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Busca informações de uma categoria específica
 */
export async function getCategory(
  categoryId: string
): Promise<MercadoLivreCategory> {
  const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`);
  if (!response.ok) {
    throw new Error(
      `Erro ao buscar categoria ${categoryId}: ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Busca categorias de um site específico
 */
export async function getCategories(
  siteId: string = "MLB"
): Promise<MercadoLivreCategory[]> {
  const response = await fetch(`${API_BASE_URL}/sites/${siteId}/categories`);
  if (!response.ok) {
    throw new Error(`Erro ao buscar categorias: ${response.statusText}`);
  }
  return response.json();
}
