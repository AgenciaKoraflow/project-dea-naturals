/**
 * Tipos para a API de Pedidos do Mercado Livre
 */

export interface MercadoLivreBuyer {
  id: number;
  nickname: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface MercadoLivreOrderItem {
  item: {
    id: string;
    title: string;
    category_id?: string;
    variation_id?: number;
    seller_custom_field?: string;
    variation_attributes?: Array<{
      id: string;
      name: string;
      value_id?: string;
      value_name: string;
    }>;
  };
  quantity: number;
  unit_price: number;
  full_unit_price: number;
  currency_id: string;
  manufacturing_days?: number;
  sale_fee: number;
  listing_type_id: string;
}

export interface MercadoLivreShipping {
  id: number;
  status: string;
  status_detail?: {
    code: string;
    description: string;
  };
  date_created?: string;
  date_first_printed?: string;
  receiver_address?: {
    id?: number;
    address_line?: string;
    street_name?: string;
    street_number?: string;
    comment?: string;
    zip_code?: string;
    city?: {
      id?: string;
      name?: string;
    };
    state?: {
      id?: string;
      name?: string;
    };
    country?: {
      id?: string;
      name?: string;
    };
    neighborhood?: {
      id?: string;
      name?: string;
    };
    latitude?: number;
    longitude?: number;
    receiver_name?: string;
    receiver_phone?: string;
  };
  shipping_option?: {
    id: number;
    shipping_method_id: number;
    name: string;
    currency_id: string;
    list_cost: number;
    cost: number;
    estimated_delivery_time?: {
      date?: string;
      unit?: string;
    };
  };
}

export interface MercadoLivrePayment {
  id: number;
  order_id: number;
  payer_id: number;
  collector: {
    id: number;
  };
  currency_id: string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  shipping_cost: number;
  total_paid_amount: number;
  marketplace_fee: number;
  coupon_amount: number;
  date_created: string;
  date_last_modified: string;
  payment_method_id: string;
  payment_type: string;
  installments: number;
  reason: string;
  activation_uri?: string;
  atm_transfer_reference?: {
    company_id?: string;
    transaction_id?: string;
  };
  card_id?: number;
  authorization_code?: string;
  installment_amount?: number;
}

export interface MercadoLivreOrder {
  id: number;
  date_created: string;
  date_closed?: string;
  last_updated?: string;
  manufacturing_ending_date?: string;
  expiration_date?: string;
  status: 'confirmed' | 'payment_required' | 'payment_in_process' | 'paid' | 'partially_paid' | 'cancelled' | 'invalid';
  status_detail?: {
    code?: string;
    description?: string;
  };
  buyer: MercadoLivreBuyer;
  seller?: {
    id: number;
    nickname?: string;
  };
  order_items: MercadoLivreOrderItem[];
  total_amount: number;
  currency_id: string;
  shipping?: MercadoLivreShipping;
  payments?: MercadoLivrePayment[];
  feedback?: {
    purchase?: {
      fulfilled?: boolean;
      rating?: string;
    };
    sale?: {
      fulfilled?: boolean;
      rating?: string;
    };
  };
  context?: {
    channel?: string;
    site?: string;
    flows?: string[];
  };
  tags?: string[];
  pack_id?: number;
  fulfilled?: boolean;
}

export interface MercadoLivreOrdersResponse {
  seller_id: number;
  orders: {
    query?: string;
    paging: {
      total: number;
      offset: number;
      limit: number;
    };
    results: MercadoLivreOrder[];
    sort: {
      id: string;
      name: string;
    };
    available_sorts?: Array<{
      id: string;
      name: string;
    }>;
    filters?: unknown[];
    available_filters?: unknown[];
  };
}

export type OrderStatus = 
  | 'confirmed'
  | 'payment_required'
  | 'payment_in_process'
  | 'paid'
  | 'partially_paid'
  | 'cancelled'
  | 'invalid'
  | '';

export interface OrdersFilters {
  status?: OrderStatus;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: 'date_desc' | 'date_asc';
}
