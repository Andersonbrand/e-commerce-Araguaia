'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Descobre quais produtos têm opções a escolher (variações de medida/espessura e/ou marcas).
 *
 * Esses produtos NÃO podem ir direto para o orçamento pela listagem: o cliente precisa abrir
 * /products/[id] e escolher a opção, senão o pedido chega sem especificação.
 *
 * - `hasOptions(id)`: usa a lista já carregada (2 consultas leves para a página toda).
 * - `checkOptions(id)`: confirma no banco para UM produto; usada quando o clique acontece antes
 *   da lista terminar de carregar (ou se a lista falhar), para a trava nunca ser "furada".
 */
export function useProductsWithOptions() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      supabase.from('product_variants').select('product_id').eq('is_active', true),
      supabase.from('product_brands').select('product_id').eq('is_active', true),
    ]).then(([v, b]) => {
      if (!alive) return;
      if (v.error || b.error) return; // fica "não pronto": o clique confirma direto no banco
      const set = new Set<string>();
      (v.data ?? []).forEach((r: any) => set.add(r.product_id));
      (b.data ?? []).forEach((r: any) => set.add(r.product_id));
      setIds(set);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  const hasOptions = useCallback((id: string) => ids.has(id), [ids]);

  const checkOptions = useCallback(async (id: string): Promise<boolean> => {
    if (ready) return ids.has(id);
    const [v, b] = await Promise.all([
      supabase.from('product_variants').select('id', { count: 'exact', head: true }).eq('product_id', id).eq('is_active', true),
      supabase.from('product_brands').select('id', { count: 'exact', head: true }).eq('product_id', id).eq('is_active', true),
    ]);
    return (v.count ?? 0) > 0 || (b.count ?? 0) > 0;
  }, [ready, ids]);

  return { hasOptions, checkOptions, ready };
}
