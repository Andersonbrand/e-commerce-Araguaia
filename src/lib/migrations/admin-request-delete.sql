-- ============================================================
-- Permite que o ADMIN exclua solicitações (carrinho e formulário)
-- e as respostas vinculadas a elas.
-- Execute no Supabase Dashboard → SQL Editor
-- (a edição usa as policies de UPDATE que já existem em rls-fix.sql)
-- ============================================================

DROP POLICY IF EXISTS "admin_delete_orders" ON orders;
CREATE POLICY "admin_delete_orders" ON orders
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "admin_delete_quotes" ON quotes;
CREATE POLICY "admin_delete_quotes" ON quotes
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "admin_delete_quote_responses" ON quote_responses;
CREATE POLICY "admin_delete_quote_responses" ON quote_responses
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
