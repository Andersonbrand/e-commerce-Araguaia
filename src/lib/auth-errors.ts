// Traduz as mensagens (em inglês) do Supabase Auth para o cliente.
export function friendlyAuthError(message: string, action: 'login' | 'cadastro' | 'senha'): string {
  const m = message.toLowerCase();
  if (m.includes('captcha'))
    return 'Não foi possível validar a verificação anti-robô. Aguarde o quadro carregar e tente de novo.';
  if (m.includes('expired') || m.includes('otp') || (m.includes('token') && m.includes('invalid')))
    return 'Este link expirou ou já foi usado. Peça um novo link.';
  if (m.includes('different from the old password') || m.includes('same_password'))
    return 'A nova senha precisa ser diferente da senha atual.';
  if (m.includes('weak') || m.includes('easy to guess') || m.includes('pwned'))
    return 'Essa senha é muito fraca ou já apareceu em vazamentos. Escolha outra mais forte.';
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('over_email_send_rate_limit'))
    return 'Muitos pedidos de e-mail em pouco tempo. Aguarde cerca de uma hora e tente novamente.';
  if (m.includes('email not confirmed'))
    return 'Confirme seu e-mail antes de entrar: abra a mensagem que enviamos para você (veja também o spam).';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este e-mail já está cadastrado. Tente entrar.';
  if (m.includes('password') && m.includes('characters'))
    return 'A senha é curta demais. Use pelo menos 8 caracteres.';
  if (m.includes('invalid email') || m.includes('unable to validate email'))
    return 'Informe um e-mail válido.';
  return action === 'login' ? 'E-mail ou senha inválidos.' : message;
}
