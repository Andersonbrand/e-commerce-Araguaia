-- Verificação de e-mail no cadastro
-- Rode no SQL Editor do Supabase (uma vez).
--
-- O Supabase Auth já impede dois usuários com o mesmo e-mail, mas, com confirmação de e-mail ligada,
-- um novo cadastro com e-mail existente "parece" funcionar (nenhum erro volta). Esta função deixa o
-- site avisar ANTES de cadastrar: 'confirmed' (já tem conta), 'unconfirmed' (cadastrou e não confirmou) ou 'none'.
CREATE OR REPLACE FUNCTION public.email_registration_status(p_email TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT COALESCE(
    (SELECT CASE WHEN email_confirmed_at IS NOT NULL THEN 'confirmed' ELSE 'unconfirmed' END
       FROM auth.users
      WHERE lower(email) = lower(btrim(p_email))
      LIMIT 1),
    'none');
$$;

REVOKE ALL ON FUNCTION public.email_registration_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_registration_status(TEXT) TO anon, authenticated;
