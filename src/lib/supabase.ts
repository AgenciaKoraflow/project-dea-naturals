import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://plhvyhbezgorodrrbrtm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaHZ5aGJlemdvcm9kcnJicnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDMyMDAsImV4cCI6MjA3ODcxOTIwMH0.R042_HTFN1fgcuOLYLITxmkWVHZsvtfqlYhwnypPUzE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Marketplace {
  id: string;
  name: string;
  logo_url?: string;
  api_key?: string;
  created_at: string;
}

export interface Return {
  id: string;
  order_id: string;
  return_id: string;
  marketplace_id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  product_sku: string;
  product_quantity: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  order_amount: number;
  refund_amount: number;
  request_date: string;
  created_at: string;
  updated_at: string;
}
