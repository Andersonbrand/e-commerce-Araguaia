'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AppIcon from '@/components/ui/AppIcon';
import { GrupoHCLogoFull } from '@/components/ui/AppLogo';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function LoginForm() {
  const [form, setForm]                 = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const { signIn }                      = useAuth();
  const router                          = useRouter();
  const searchParams                    = useSearchParams();
  const redirectTo                      = searchParams.get('redirect') ?? '/homepage';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(form.email, form.password);
    if (error) { setLoading(false); toast.error('E-mail ou senha inválidos.'); return; }
    toast.success('Bem-vindo!');
    // Aguarda o Supabase propagar a sessão nos cookies antes de navegar.
    // router.refresh() logo após router.push() cancela a navegação em curso
    // causando o tela de loading infinito — por isso usamos só window.location.
    await new Promise(resolve => setTimeout(resolve, 300));
    window.location.href = redirectTo;
  };

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #0a1a3a30, transparent)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl p-8 md:p-10 shadow-xl border border-[#dde3ed] bg-white">

          {/* Logo do Grupo HC — SVG tipográfico oficial */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-2">
              <GrupoHCLogoFull width={200} height={90} />
            </div>
            <div className="w-full h-px bg-[#f0f0f0] mt-3 mb-5" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Acesse sua conta</h1>
            <p className="text-sm text-muted mt-1">Entre para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-muted">E-mail</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                  <AppIcon name="EnvelopeIcon" size={16} />
                </span>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="seu@email.com.br" required autoComplete="email"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-[#0a1a3a] focus:ring-2 focus:ring-[#0a1a3a]/10 transition-all" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.15em] font-bold text-muted">Senha</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                  <AppIcon name="LockClosedIcon" size={16} />
                </span>
                <input type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3.5 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-[#0a1a3a] focus:ring-2 focus:ring-[#0a1a3a]/10 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                  <AppIcon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-[12px] font-bold uppercase tracking-widest transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#0a1a3a' }}>
              {loading ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Entrando...</>
              ) : 'Entrar'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" /><span className="text-[11px] text-muted font-medium">ou</span><div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-center text-sm text-muted">
            Não tem uma conta?{' '}
            <Link href="/register" className="font-bold hover:underline transition-colors" style={{ color: '#af1518' }}>
              Cadastre-se grátis
            </Link>
          </p>
        </div>
        <div className="text-center mt-6">
          <Link href="/homepage" className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-foreground font-semibold transition-colors">
            <AppIcon name="ArrowLeftIcon" size={14} />Voltar para o início
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#0a1a3a] border-t-transparent animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
