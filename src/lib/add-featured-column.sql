-- Migration: adicionar coluna is_featured para controle de destaque por empresa
-- Execute no Supabase SQL Editor

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Marcar como destaque os produtos que já estavam como representativos
-- (admins podem ajustar pelo painel depois)
UPDATE products SET is_featured = TRUE
WHERE is_active = TRUE
  AND image_url IS NOT NULL;

COMMENT ON COLUMN products.is_featured IS 'Produto aparece como destaque na homepage (controlado pelo admin)';
