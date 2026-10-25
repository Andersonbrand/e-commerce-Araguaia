-- Migration: tabela de categorias de produto
-- Executar no Supabase Dashboard → SQL Editor
-- Permite cadastrar uma categoria em "Gerenciar Categorias" ANTES de existir
-- qualquer produto nela. Categorias que já existem nos produtos continuam
-- funcionando normalmente (o painel junta as duas fontes).

CREATE TABLE IF NOT EXISTS product_categories (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Nome único sem diferenciar maiúsculas/minúsculas
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_name
  ON product_categories (lower(name));

-- RLS: leitura pública, escrita apenas para usuários autenticados (admin)
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_product_categories"
  ON product_categories FOR SELECT USING (true);

CREATE POLICY "auth_write_product_categories"
  ON product_categories FOR ALL USING (auth.role() = 'authenticated');

-- Importa as categorias que já existem nos produtos
INSERT INTO product_categories (name)
SELECT DISTINCT category FROM products
WHERE category IS NOT NULL AND btrim(category) <> ''
ON CONFLICT DO NOTHING;
