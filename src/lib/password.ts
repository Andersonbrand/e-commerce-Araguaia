// Regras de senha do site (o Supabase também deve exigir o mínimo em Authentication → Sign In / Providers → Email).
export const PASSWORD_MIN_LENGTH = 8;

const TOO_COMMON = new Set([
  '12345678', '123456789', '1234567890', '87654321', '11111111', '00000000', '99999999',
  'password', 'password1', 'senha123', 'senha1234', 'qwertyui', 'qwerty123', 'abcd1234', 'abc12345', 'iloveyou',
]);

/** Retorna a mensagem do problema da senha, ou null se estiver ok. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (TOO_COMMON.has(password.toLowerCase())) return 'Essa senha é muito comum. Escolha outra mais difícil de adivinhar.';
  if (/^(.)\1+$/.test(password)) return 'A senha não pode ser um único caractere repetido.';
  return null;
}
