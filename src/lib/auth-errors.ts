// Traduz as mensagens (em inglês) do Supabase Auth para o cliente.
export const WHATSAPP_URL = 'https://wa.me/557734512175';
export const WHATSAPP_LABEL = '(77) 3451-2175';

// Falha no envio do e-mail (SMTP/Resend): nesse caso o toast mostra o link do WhatsApp.
export function isEmailSendError(message: string): boolean {
  const m = (message || '').toLowerCase();
  return m.includes('error sending') || m.includes('sending confirmation') || m.includes('sending recovery')
    || m.includes('sending magic link') || m.includes('sending email') || m.includes('smtp');
}

export function friendlyAuthError(message: string, action: 'login' | 'cadastro' | 'senha'): string {
  if (message === 'EMAIL_EXISTS')      return 'Este e-mail já possui cadastro. Entre na sua conta ou use "Esqueci minha senha".';
  if (message === 'EMAIL_UNCONFIRMED') return 'Este e-mail já foi cadastrado, mas ainda não foi confirmado. Procure o e-mail de confirmação na sua caixa de entrada (ou no spam).';
  const m = (message || '').toLowerCase();
  // Falha no envio do e-mail (SMTP do Supabase não configurado, domínio não verificado, limite do provedor...).
  if (isEmailSendError(message))
    return action === 'senha'
      ? 'Não conseguimos enviar o e-mail de recuperação agora, tente novamente em alguns minutos. Se o problema continuar, fale conosco pelo WhatsApp.'
      : 'Não conseguimos enviar o e-mail de confirmação agora, tente novamente em alguns minutos. Se o problema continuar, fale conosco pelo WhatsApp.';
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('fetch failed'))
    return 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
  if (m.includes('signups not allowed') || m.includes('signup is disabled') || m.includes('signups are disabled'))
    return 'Os cadastros estão temporariamente indisponíveis. Tente novamente mais tarde.';
  if (m.includes('database error'))
    return 'Não foi possível concluir o cadastro agora. Tente novamente; se o erro continuar, avise o suporte.';
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
  if (action === 'login') return 'E-mail ou senha inválidos.';
  // Nunca mostra texto técnico em inglês ao cliente.
  return action === 'senha'
    ? 'Não foi possível concluir agora. Tente novamente; se o erro continuar, avise o suporte.'
    : 'Não foi possível criar a conta agora. Tente novamente; se o erro continuar, avise o suporte.';
}
