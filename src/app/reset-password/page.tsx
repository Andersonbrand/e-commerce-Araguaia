'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';
import AuthCard, { authInputClass, authPrimaryButtonClass } from '@/components/auth/AuthCard';
import { createClient } from '@/lib/supabase/client';
import { friendlyAuthError } from '@/lib/auth-errors';
import { PASSWORD_MIN_LENGTH, passwordProblem } from '@/lib/password';

/**
 * Tela aberta pelo link do e-mail de redefinição:
 *   /reset-password?token_hash=...&type=recovery
 * O link só é "consumido" quando a pessoa envia a nova senha — assim, verificadores de link de e-mail
 * (Outlook, antivírus) que apenas abrem a página não invalidam o link.
 */
function ResetPasswordForm() {
  const params    = useSearchParams();
  const tokenHash = params.get('token_hash');
  const type      = params.get('type');
  const validLink = !!tokenHash && type === 'recovery';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [expired, setExpired]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !tokenHash) return;
    const problem = passwordProblem(password);
    if (problem) { toast.error(problem); return; }
    if (password !== confirm) { toast.error('As senhas não coincidem.'); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
      if (verifyError) { setExpired(true); return; }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { toast.error(friendlyAuthError(updateError.message, 'senha'), { duration: 6000 }); return; }

      // Encerra as outras sessões abertas dessa conta (se alguém tinha acesso, perde)
      await supabase.auth.signOut({ scope: 'others' }).catch(() => {});

      toast.success('Senha alterada com sucesso!');
      await new Promise((r) => setTimeout(r, 400));
      window.location.href = '/homepage';
    } catch {
      toast.error('Não foi possível alterar a senha agora. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!validLink || expired) {
    return (
      <AuthCard title="Link inválido ou expirado">
        <div className="space-y-5 text-center">
          <p className="text-sm text-muted leading-relaxed">
            Este link de redefinição de senha expirou, já foi usado ou está incompleto. Peça um novo link para continuar.
          </p>
          <Link href="/forgot-password"
            className={authPrimaryButtonClass} style={{ backgroundColor: '#0a1a3a' }}>
            Pedir novo link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Crie uma nova senha" subtitle={`Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { label: 'Nova senha', value: password, set: setPassword, auto: 'new-password' },
          { label: 'Confirmar nova senha', value: confirm, set: setConfirm, auto: 'new-password' },
        ].map((f, i) => (
          <div key={f.label} className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-muted">{f.label}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"><AppIcon name="LockClosedIcon" size={16} /></span>
              <input type={show ? 'text' : 'password'} value={f.value} onChange={(e) => f.set(e.target.value)}
                required minLength={PASSWORD_MIN_LENGTH} autoComplete={f.auto} placeholder="••••••••"
                className={`${authInputClass} pr-12`} />
              {i === 0 && (
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                  <AppIcon name={show ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
        <Button type="submit" loading={loading} className={authPrimaryButtonClass} style={{ backgroundColor: '#0a1a3a' }}>
          Salvar nova senha
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#0a1a3a] border-t-transparent animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
