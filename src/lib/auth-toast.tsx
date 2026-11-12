import toast from 'react-hot-toast';
import { friendlyAuthError, isEmailSendError, WHATSAPP_URL, WHATSAPP_LABEL } from '@/lib/auth-errors';

// Mostra o erro de autenticação em português. Quando o e-mail não pôde ser enviado,
// "WhatsApp" vira um link clicável para o número da Araguaia.
export function toastAuthError(
  message: string,
  action: 'login' | 'cadastro' | 'senha',
  opts: { duration?: number } = {},
) {
  const text = friendlyAuthError(message, action);
  if (!isEmailSendError(message)) return toast.error(text, opts);

  const [before] = text.split('pelo WhatsApp');
  return toast.error(
    <span>
      {before}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#af1518', fontWeight: 700, textDecoration: 'underline' }}
      >
        pelo WhatsApp {WHATSAPP_LABEL}
      </a>.
    </span>,
    { ...opts, duration: 10000 },
  );
}
