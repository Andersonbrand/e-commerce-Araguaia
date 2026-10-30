'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';
import AuthCard, { authPrimaryButtonClass } from '@/components/auth/AuthCard';
import { createClient } from '@/lib/supabase/client';

/**
 * Tela aberta pelo link do e-mail de confirmação de cadastro:
 *   /auth/confirm?token_hash=...&type=email
 * A confirmação só acontece quando a pessoa clica no botão (verificadores de link de e-mail não consomem o link).
 */
function ConfirmForm() {
  const params    = useSearchParams();
  const tokenHash = params.get('token_hash');
  const type      = params.get('type');
  const validLink = !!tokenHash && (type === 'email' || type === 'signup');

  const [loading, setLoading] = useState(false);
  const [failed, setFailed]   = useState(false);
  const [done, setDone]       = useState(false);

  const handleConfirm = async () => {
    if (loading || !tokenHash) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash });
      if (error) { setFailed(true); return; }
      setDone(true);
      toast.success('E-mail confirmado! Bem-vindo(a).');
      await new Promise((r) => setTimeout(r, 1200));
      window.location.href = '/homepage'; // a sessão já está aberta
    } catch {
      toast.error('Não foi possível confirmar agora. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!validLink || failed) {
    return (
      <AuthCard title="Link inválido ou expirado">
        <div className="space-y-5 text-center">
          <p className="text-sm text-muted leading-relaxed">
            Este link de confirmação expirou, já foi usado ou está incompleto. Se o seu e-mail já foi confirmado, é só entrar.
            Se não, tente entrar com a sua senha: o site oferece o reenvio de um novo e-mail de confirmação.
          </p>
          <Link href="/login" className={authPrimaryButtonClass} style={{ backgroundColor: '#0a1a3a' }}>Ir para o login</Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={done ? 'E-mail confirmado!' : 'Confirme seu e-mail'}
      subtitle={done ? 'Redirecionando você para o site...' : 'Falta só um clique para ativar sua conta'}>
      {done ? (
        <div className="mx-auto w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600">
          <AppIcon name="CheckIcon" size={26} />
        </div>
      ) : (
        <Button type="button" onClick={handleConfirm} loading={loading} className={authPrimaryButtonClass} style={{ backgroundColor: '#0a1a3a' }}>
          Confirmar meu e-mail
        </Button>
      )}
    </AuthCard>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#0a1a3a] border-t-transparent animate-spin" /></div>}>
      <ConfirmForm />
    </Suspense>
  );
}
