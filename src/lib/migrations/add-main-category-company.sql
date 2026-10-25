-- Migration: "Categorias Principais" da home vinculadas a UMA empresa (escolha do admin)
-- Execute no Supabase SQL Editor (uma vez). Pode ser executado de novo sem problema.
-- Requer que add-featured-bestseller.sql já tenha sido executado.
--
--   main_category_company → empresa em cujas Categorias Principais o produto aparece (só uma por produto)
--   main_category_at      → quando foi marcado (define a ordem dos cards: o mais antigo primeiro)
--
-- A categoria não pode se repetir em outra empresa: o índice abaixo impede dois produtos
-- da mesma categoria (ignorando maiúsculas/espaços) como categoria principal ao mesmo tempo.
-- Sem nenhum produto marcado para uma empresa, a home dela usa as categorias com mais produtos
-- (para não ficar vazia); o "Produtos em Destaque" (is_featured) é independente.

ALTER TABLE products ADD COLUMN IF NOT EXISTS main_category_company TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS main_category_at TIMESTAMPTZ;

COMMENT ON COLUMN products.main_category_company IS 'ID da empresa em cujas "Categorias Principais" da home este produto aparece (NULL = nenhuma)';
COMMENT ON COLUMN products.main_category_at IS 'Quando o admin marcou como categoria principal (ordem dos cards na home)';

CREATE UNIQUE INDEX IF NOT EXISTS uq_main_category_per_category
  ON products (lower(btrim(category)))
  WHERE main_category_company IS NOT NULL;
