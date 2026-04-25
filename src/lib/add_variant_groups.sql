-- ============================================================
-- Migration: grupos de variantes por produto
-- Executar no Supabase Dashboard → SQL Editor
-- ============================================================
-- Adiciona a coluna `variant_group` à tabela product_variants.
-- Permite que um produto tenha múltiplos grupos de variação
-- independentes, ex: "Bitola" + "Comprimento" + "Peso".
-- Cada grupo agrupa suas opções pelo mesmo valor de variant_group.

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS variant_group text NOT NULL DEFAULT 'Espessura';

-- Índice para filtrar por produto + grupo
CREATE INDEX IF NOT EXISTS idx_product_variants_group
  ON product_variants(product_id, variant_group);

-- ============================================================
-- Exemplos de grupos comuns (referência, não executar):
-- 
-- Arames:
--   variant_group = 'Comprimento' → 500m / 1000m
--   variant_group = 'Bitola'      → 10 / 12 / 14 / 16 / 18 (polegadas)
--   variant_group = 'Peso'        → 1kg / 35kg / 40kg
--
-- Chapas Drywall:
--   variant_group = 'Tipo'        → RF / FGA / RU / ST
--
-- Eletrodos:
--   variant_group = 'Tipo'        → E6013 / H7018
--
-- Parafusos TTPC:
--   variant_group = 'Cabeça'      → TA / TB
--   variant_group = 'Ponta'       → F / C
--
-- Pregos:
--   variant_group = 'Medida'      → 10x10 / 13x15 / ... / 25x72
--
-- Perfis / Chapas:
--   variant_group = 'Espessura'   → 1,5mm / 2,0mm / 2,25mm (padrão anterior)
-- ============================================================
