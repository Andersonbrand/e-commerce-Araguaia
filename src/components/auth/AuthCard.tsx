'use client';

import React from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';
import { GrupoHCLogoFull } from '@/components/ui/AppLogo';

/** Moldura das telas de conta (esqueci a senha, nova senha, confirmação de e-mail). */
export default function AuthCard({
  title, subtitle, children, backHref = '/login', backLabel = 'Voltar para o login',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden px-4 py-10">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, #0a1a3a30, transparent)' }} />
      <div className="w-full max-w-md relative z-10">
        <div className="rounded-3xl p-8 md:p-10 shadow-xl border border-[#dde3ed] bg-white">
          <div className="flex flex-col items-center mb-8">
            <GrupoHCLogoFull width={200} height={90} />
            <div className="w-full h-px bg-[#f0f0f0] mt-3 mb-5" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight text-center">{title}</h1>
            {subtitle && <p className="text-sm text-muted mt-1 text-center">{subtitle}</p>}
          </div>
          {children}
        </div>
        <div className="text-center mt-6">
          <Link href={backHref} className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-foreground font-semibold transition-colors">
            <AppIcon name="ArrowLeftIcon" size={14} />{backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}

export const authInputClass =
  'w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-[#0a1a3a] focus:ring-2 focus:ring-[#0a1a3a]/10 transition-all';
export const authPrimaryButtonClass =
  'w-full py-3.5 rounded-xl text-white text-[12px] font-bold uppercase tracking-widest transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2';
