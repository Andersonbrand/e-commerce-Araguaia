-- ============================================================
-- Preferência de retorno do cliente nos pedidos do carrinho
-- Execute no SQL Editor do Supabase ANTES de publicar o código novo.
-- Pode ser executado de novo com segurança (idempotente).
--
-- contact_methods: 'whatsapp', 'email' e/ou 'site'
--                  ('site' é escolha única, não combina com os outros)
-- contact_email:   e-mail digitado para o retorno (só quando 'email' foi escolhido)
-- customer_phone:  WhatsApp digitado (vazio quando 'whatsapp' não foi escolhido)
-- observation:     observação opcional escrita no carrinho
-- customer_email:  e-mail da conta do cliente (é por ele que a resposta aparece no perfil)
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS contact_methods TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS observation TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_contact_methods_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_contact_methods_chk CHECK (
      contact_methods <@ ARRAY['whatsapp','email','site']::TEXT[]
      AND cardinality(contact_methods) <= 3
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_contact_site_exclusive_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_contact_site_exclusive_chk CHECK (
      NOT ('site' = ANY(contact_methods) AND cardinality(contact_methods) > 1)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_contact_email_size_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_contact_email_size_chk CHECK (
      contact_email IS NULL OR char_length(contact_email) <= 254
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_observation_size_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_observation_size_chk CHECK (
      observation IS NULL OR char_length(observation) <= 1000
    );
  END IF;
END $$;

-- Faz o PostgREST (API do Supabase) enxergar as colunas novas imediatamente
NOTIFY pgrst, 'reload schema';
