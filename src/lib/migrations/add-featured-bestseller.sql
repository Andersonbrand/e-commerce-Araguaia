-- Migration: destaques e "mais vendido" decididos pelo ADMIN
-- Execute no Supabase SQL Editor (uma vez), ANTES de publicar a nova versão do site.
--
-- O que muda:
--   featured_at     → quando o produto foi marcado como destaque (os marcados mais recentemente aparecem primeiro)
--   best_seller_for → empresas para as quais o produto é o "mais vendido" (ex.: {araguaia}). Um produto por empresa.

ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS best_seller_for TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN products.featured_at IS 'Quando o admin marcou o produto como destaque (ordem de exibição na home: mais recente primeiro)';
COMMENT ON COLUMN products.best_seller_for IS 'IDs das empresas para as quais este produto é o mais vendido (no máximo um produto por empresa)';

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO OPCIONAL — limpar a marcação em massa da migration antiga (add-featured-column.sql).
-- Aquela migration marcou TODO produto ativo com imagem como destaque, então "tudo" é destaque e o
-- admin não consegue escolher. Confira antes:
--     SELECT count(*) FILTER (WHERE is_featured) AS em_destaque, count(*) AS total FROM products;
-- Se quase todos estão em destaque, remova o "--" da linha abaixo e execute; depois o admin
-- marca só os que quiser pelo painel (Produtos → editar → "Produto em destaque").
--
-- UPDATE products SET is_featured = FALSE, featured_at = NULL;
-- ─────────────────────────────────────────────────────────────────────────────

-- Produtos que já estão marcados ganham uma data (senão ficam sem ordem de exibição)
UPDATE products SET featured_at = COALESCE(updated_at, now())
WHERE is_featured AND featured_at IS NULL;

-- Mantém o que o site já mostrava: Cimento Montes Claros continua como "Mais vendido" da Araguaia
-- (só se a Araguaia ainda não tiver nenhum mais vendido; o admin troca quando quiser).
UPDATE products SET best_seller_for = ARRAY['araguaia']
WHERE id = (
        SELECT id FROM products
        WHERE name ILIKE '%montes claros%' AND 'araguaia' = ANY(companies)
        ORDER BY updated_at DESC NULLS LAST LIMIT 1
      )
  AND NOT EXISTS (SELECT 1 FROM products WHERE 'araguaia' = ANY(best_seller_for));

-- Garante "um mais vendido por empresa": ao marcar um produto, as empresas dele são removidas dos demais.
CREATE OR REPLACE FUNCTION enforce_single_best_seller() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(array_length(NEW.best_seller_for, 1), 0) > 0 THEN
    UPDATE products p
       SET best_seller_for = ARRAY(SELECT c FROM unnest(p.best_seller_for) AS c WHERE NOT (c = ANY(NEW.best_seller_for)))
     WHERE p.id <> NEW.id
       AND p.best_seller_for && NEW.best_seller_for;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_best_seller ON products;
CREATE TRIGGER trg_single_best_seller
  AFTER INSERT OR UPDATE OF best_seller_for ON products
  FOR EACH ROW
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION enforce_single_best_seller();
