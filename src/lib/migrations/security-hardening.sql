-- ============================================================================
-- SEGURANÇA DO BANCO — regras de acesso (RLS) endurecidas
-- Execute no Supabase SQL Editor, de uma vez só (o script é uma transação: se algo falhar, nada muda).
-- Pode ser executado novamente sem problema.
--
-- ANTES de rodar (obrigatório):
--   1) Veja quem é admin hoje:
--        SELECT email,
--               raw_app_meta_data  ->> 'role' AS role_app,
--               raw_user_meta_data ->> 'role' AS role_user
--        FROM auth.users
--        WHERE raw_app_meta_data ->> 'role' = 'admin' OR raw_user_meta_data ->> 'role' = 'admin';
--   2) Todo admin LEGÍTIMO precisa ter role_app = admin. Se faltar, rode (uma vez por admin):
--        SELECT promote_to_admin('email-do-admin@exemplo.com');
--      Se aparecer alguém que você não conhece com role_user = admin, remova essa pessoa dos admins
--      (ela mesma poderia ter se promovido) e confira os registros dela.
--   3) Depois do script, cada admin deve sair e entrar de novo no site (o "crachá" de login é renovado).
--
-- O que este script corrige:
--   • "Admin" era reconhecido também por user_metadata — que o PRÓPRIO usuário consegue editar. Qualquer cliente
--     cadastrado podia se tornar admin. Agora vale só app_metadata (só o servidor/SQL grava).
--   • A função promote_to_admin podia ser chamada por qualquer usuário via API. Agora só pelo SQL Editor.
--   • Categorias, marcas e variações podiam ser editadas por qualquer usuário logado. Agora só admin.
--   • Os PDFs de orçamento podiam ser lidos por qualquer pessoa. Agora só o admin e o cliente dono da resposta.
--   • Pedidos só podem ser criados em nome do próprio usuário logado; formulário de orçamento aceita apenas "novo".
--   • Clientes só podem marcar a própria resposta como "lida" (não alteram valores nem textos).
-- ============================================================================

BEGIN;

-- 0) Trava de segurança: precisa existir ao menos um admin válido (app_metadata), senão ninguém administraria o site
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE raw_app_meta_data ->> 'role' = 'admin') THEN
    RAISE EXCEPTION 'Nenhum usuário admin em app_metadata. Rode antes: SELECT promote_to_admin(''seu-email@exemplo.com'');';
  END IF;
END $$;

-- 1) Quem é admin: somente app_metadata (user_metadata NUNCA)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE
AS $$ SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' $$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2) promote_to_admin: grava só em app_metadata e fica restrita ao SQL Editor / service role
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
     SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   WHERE lower(email) = lower(user_email);
  IF NOT FOUND THEN RAISE EXCEPTION 'Usuário % não encontrado', user_email; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.promote_to_admin(TEXT) FROM PUBLIC, anon, authenticated;

-- 3) Remove o "role" que clientes possam ter escrito em user_metadata (não é mais usado para nada)
UPDATE auth.users
   SET raw_user_meta_data = raw_user_meta_data - 'role'
 WHERE raw_user_meta_data ? 'role';

-- 4) Apaga TODAS as regras antigas das tabelas do site (inclusive as criadas por versões anteriores dos scripts)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE (schemaname = 'public' AND tablename IN
            ('products','orders','quotes','settings','quote_responses','user_profiles',
             'product_brands','product_categories','product_variants'))
       OR (schemaname = 'storage' AND tablename = 'objects'
            AND (COALESCE(qual,'') || ' ' || COALESCE(with_check,'')) ~ '(product-images|quote-pdfs)')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 5) Catálogo: todos leem; só admin escreve
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_read ON products FOR SELECT
  USING (is_active OR public.is_admin());            -- produto inativo só aparece para o admin
CREATE POLICY products_admin_insert ON products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY products_admin_update ON products FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY products_admin_delete ON products FOR DELETE USING (public.is_admin());

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['product_brands','product_categories','product_variants','settings'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', t || '_read', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.is_admin())', t || '_admin_insert', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin())', t || '_admin_update', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (public.is_admin())', t || '_admin_delete', t);
    END IF;
  END LOOP;
END $$;

-- 6) Pedidos do carrinho: o cliente cria e vê só os dele; o admin gerencia
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_read ON orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY orders_insert ON orders FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid() AND status = 'pending');
CREATE POLICY orders_admin_update ON orders FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY orders_admin_delete ON orders FOR DELETE USING (public.is_admin());

-- 7) Formulário de orçamento da home (aberto a visitantes): só entra como "new"; só o admin lê/gerencia
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quotes_insert ON quotes FOR INSERT WITH CHECK (status = 'new');
CREATE POLICY quotes_admin_read ON quotes FOR SELECT USING (public.is_admin());
CREATE POLICY quotes_admin_update ON quotes FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY quotes_admin_delete ON quotes FOR DELETE USING (public.is_admin());

-- limites de tamanho (evita lixo/abuso); NOT VALID = só vale para registros novos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_size_chk') THEN
    ALTER TABLE quotes ADD CONSTRAINT quotes_size_chk CHECK (
      char_length(name) <= 200 AND char_length(email) <= 254 AND char_length(phone) <= 40
      AND char_length(category) <= 200 AND char_length(message) <= 4000
      AND (company IS NULL OR char_length(company) <= 200)) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_size_chk') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_size_chk CHECK (
      char_length(customer_name) <= 200 AND char_length(customer_email) <= 254
      AND char_length(customer_phone) <= 40 AND jsonb_array_length(items) <= 200) NOT VALID;
  END IF;
END $$;

-- 8) Respostas de orçamento: admin cria/lê/apaga; o cliente lê as DELE e só marca como "lida"
ALTER TABLE quote_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY quote_responses_insert ON quote_responses FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY quote_responses_read ON quote_responses FOR SELECT
  USING (public.is_admin() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email', '')));
CREATE POLICY quote_responses_update ON quote_responses FOR UPDATE
  USING (public.is_admin() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email', '')))
  WITH CHECK (public.is_admin() OR lower(customer_email) = lower(COALESCE(auth.jwt() ->> 'email', '')));
CREATE POLICY quote_responses_delete ON quote_responses FOR DELETE USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.guard_quote_response_update() RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  -- SQL Editor / service role (sem usuário) e admin passam; cliente só muda status para 'read'
  IF auth.uid() IS NULL OR public.is_admin() THEN RETURN NEW; END IF;
  IF NEW.status IS DISTINCT FROM 'read'
     OR (to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status') THEN
    RAISE EXCEPTION 'Você só pode marcar a resposta como lida' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_quote_response_update() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_quote_response_update ON quote_responses;
CREATE TRIGGER trg_guard_quote_response_update
  BEFORE UPDATE ON quote_responses FOR EACH ROW EXECUTE FUNCTION public.guard_quote_response_update();

-- 9) Perfil do cliente: cada um vê/edita o seu; admin só lê
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_profiles_own ON user_profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY user_profiles_admin_read ON user_profiles FOR SELECT USING (public.is_admin());

-- 10) Arquivos (Storage)
--   product-images (público): qualquer um vê; só admin envia/altera/apaga
--   quote-pdfs (privado): só admin e o cliente dono da resposta que referencia o arquivo
CREATE POLICY product_images_read ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY product_images_admin_write ON storage.objects FOR ALL
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY quote_pdfs_admin ON storage.objects FOR ALL
  USING (bucket_id = 'quote-pdfs' AND public.is_admin())
  WITH CHECK (bucket_id = 'quote-pdfs' AND public.is_admin());
CREATE POLICY quote_pdfs_customer_read ON storage.objects FOR SELECT
  USING (
    bucket_id = 'quote-pdfs'
    AND EXISTS (
      SELECT 1 FROM public.quote_responses r
      WHERE lower(r.customer_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        AND r.pdf_url IS NOT NULL
        AND (r.pdf_url = storage.objects.name
             OR right(r.pdf_url, length(storage.objects.name) + 1) = '/' || storage.objects.name)
    )
  );

-- 11) Visitantes (anon) nunca escrevem, exceto o formulário de orçamento; ninguém usa TRUNCATE/TRIGGER pela API
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON
  products, orders, settings, quote_responses, user_profiles FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON quotes FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON
  products, orders, quotes, settings, quote_responses, user_profiles FROM authenticated;
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['product_brands','product_categories','product_variants'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon', t);
      EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;

-- 12) Funções internas não precisam ser chamáveis pela API
DO $$
BEGIN
  IF to_regprocedure('public.enforce_single_best_seller()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.enforce_single_best_seller() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

COMMIT;

-- Conferência (opcional): lista as regras que ficaram valendo
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies
--  WHERE schemaname IN ('public','storage') ORDER BY 1, 2, 3;
