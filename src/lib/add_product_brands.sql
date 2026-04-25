-- Migration: tabela de marcas de produto
-- Executar no Supabase Dashboard → SQL Editor
-- Permite vincular múltiplas marcas a um único produto,
-- cada marca com seu próprio preço e estoque.

CREATE TABLE IF NOT EXISTS product_brands (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        text        NOT NULL,           -- ex: "Gerdau", "Votorantim", "ArcelorMittal"
  price       numeric     NOT NULL DEFAULT 0, -- preço específico desta marca (0 = sob consulta)
  stock       integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: leitura pública, escrita apenas para usuários autenticados (admin)
ALTER TABLE product_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_brands"
  ON product_brands FOR SELECT USING (true);

CREATE POLICY "auth_write_brands"
  ON product_brands FOR ALL USING (auth.role() = 'authenticated');

-- Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_product_brands_product_id
  ON product_brands(product_id);
