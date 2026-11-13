-- CPF / CNPJ no perfil do usuário (tela "Dados Pessoais").
-- Rode uma vez no SQL Editor do Supabase. Guarda só os dígitos (11 = CPF, 14 = CNPJ).
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
