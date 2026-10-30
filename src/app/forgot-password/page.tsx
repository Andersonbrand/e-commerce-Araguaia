'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';
import Turnstile, { TURNSTILE_ENABLED } from '@/components/ui/Turnstile';
import AuthCard, { authInputClass, authPrimaryButtonClass } from '@/components/auth/AuthCard';
import { useAuth } from '@/context/AuthContext';
import { friendlyAuthError } from '@/lib/auth-errors';

const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [cooldown, setCooldown]   = useState(0);
  const [captcha, setCaptcha]     = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  // contagem regressiva para poder reenviar (o Supabase também limita pedidos seguidos)
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;
    if (TURNSTILE_ENABLED && !captcha) { toast.error('Aguarde a verificação anti-robô carregar e tente de novo.'); return; }
    setLoading(true);
    try {
      const { error } = await resetPassword(email.trim(), captcha);
      if (error) { toast.error(friendlyAuthError(error, 'senha'), { duration: 6000 }); return; }
      // Mesma resposta exista o e-mail ou não: não revela quem tem conta no site
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch {
      toast.error('Não foi possível enviar agora. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
      setCaptchaReset((n) => n + 1); // o token vale para uma única tentativa
    }
  };

  return (
    <AuthCard title="Esqueci minha senha" subtitle={sent ? undefined : 'Informe seu e-mail para receber o link de redefinição'}>
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <AppIcon name="EnvelopeIcon" size={26} />
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Se <strong>{email}</strong> estiver cadastrado, enviamos um link para criar uma nova senha.
            Confira também a caixa de spam. O link vale por pouco tempo.
          </p>
          <button type="button" onClick={() => { setSent(false); }} disabled={cooldown > 0}
            className="text-sm font-bold disabled:opacity-50" style={{ color: '#af1518' }}>
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Não recebi, reenviar'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-muted">E-mail</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"><AppIcon name="EnvelopeIcon" size={16} /></span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                placeholder="seu@email.com.br" className={authInputClass} />
            </div>
          </div>
          <Turnstile onToken={setCaptcha} resetSignal={captchaReset} />
          <Button type="submit" loading={loading} disabled={cooldown > 0} className={authPrimaryButtonClass} style={{ backgroundColor: '#0a1a3a' }}>
            Enviar link
          </Button>
          <p className="text-center text-sm text-muted">
            Lembrou a senha?{' '}
            <Link href="/login" className="font-bold hover:underline" style={{ color: '#af1518' }}>Entrar</Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
