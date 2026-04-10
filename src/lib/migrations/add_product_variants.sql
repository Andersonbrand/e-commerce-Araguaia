-- Migration: tabela de variações de produto (espessuras / chapas)
-- Executar no Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS product_variants (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label       text        NOT NULL,           -- ex: "1,5mm", "2,0mm", "3,0mm"
  price_delta numeric     NOT NULL DEFAULT 0, -- acréscimo (+) ou desconto (-) em R$ sobre o preço base
  stock       integer     NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: leitura pública, escrita apenas para usuários autenticados (admin)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_variants"
  ON product_variants FOR SELECT USING (true);

CREATE POLICY "auth_write_variants"
  ON product_variants FOR ALL USING (auth.role() = 'authenticated');

-- Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON product_variants(product_id);
