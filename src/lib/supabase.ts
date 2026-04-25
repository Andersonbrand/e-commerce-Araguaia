// Re-exporta o cliente browser para compatibilidade com código existente
// Todo código que usa `import { supabase } from '@/lib/supabase'` continua funcionando
import { createClient } from '@/lib/supabase/client';

export const supabase = createClient();

// Tipos
export interface ProductVariant {
  id: string;
  product_id: string;
  variant_group: string; // ex: "Espessura", "Bitola", "Comprimento", "Peso", "Tipo", "Medida"
  label: string;         // ex: "1,5mm", "10", "500m", "1kg", "E6013"
  price_delta: number;   // preço específico desta opção (0 = usa preço base)
  stock: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductBrand {
  id: string;
  product_id: string;
  name: string;        // ex: "Gerdau", "Votorantim", "ArcelorMittal"
  price: number;       // preço específico desta marca (0 = sob consulta)
  stock: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string | null;
  price: number;
  unit: string;
  stock: number;
  is_active: boolean;
  companies: string[];      // array: ['araguaia', 'acos-confiance'] — produto pode pertencer a múltiplas empresas
  is_featured: boolean;     // aparece como destaque na homepage
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
}

export interface Quote {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  category: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export async function getShowPrices(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('settings').select('value').eq('key', 'show_prices').single();
    return data?.value !== 'false';
  } catch { return true; }
}

export async function setShowPrices(show: boolean): Promise<void> {
  await supabase
    .from('settings')
    .upsert({ key: 'show_prices', value: String(show) }, { onConflict: 'key' });
}

export interface QuoteResponse {
  id: string;
  request_id: string;
  request_type: 'cart' | 'form';
  customer_email: string;
  customer_name: string;
  message: string | null;
  products_summary: any[] | null;
  observations: string | null;
  requirements: string | null;
  pdf_url: string | null;
  pdf_name: string | null;
  status: 'sent' | 'read';
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  birth_date: string | null;
  address_street: string | null;
  address_number: string | null;
  address_comp: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  updated_at: string;
}
