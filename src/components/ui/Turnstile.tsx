'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Verificação anti-robô do Cloudflare Turnstile (gratuito).
 * Só aparece se NEXT_PUBLIC_TURNSTILE_SITE_KEY estiver definida — sem a chave, o site funciona normalmente
 * (útil em desenvolvimento). O token gerado é enviado ao Supabase (captchaToken), que o valida com a chave
 * secreta configurada em Authentication → Attack Protection.
 *
 * Cada token vale para UMA tentativa: aumente `resetSignal` após cada envio para gerar um novo.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
export const TURNSTILE_ENABLED = !!SITE_KEY;

const SCRIPT_ID = 'cf-turnstile-script';
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('Falha ao carregar a verificação anti-robô')); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface TurnstileProps {
  /** Recebe o token (ou null quando expira/falha). */
  onToken: (token: string | null) => void;
  /** Mude este número para gerar um novo desafio (tokens são de uso único). */
  resetSignal?: number;
  className?: string;
}

export default function Turnstile({ onToken, resetSignal = 0, className }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'light',
          language: 'pt-br',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
      }
      widgetIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetSignal === 0) return;
    if (widgetIdRef.current && window.turnstile) {
      try { window.turnstile.reset(widgetIdRef.current); } catch { /* ignore */ }
    }
    onTokenRef.current(null);
  }, [resetSignal]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className={className ?? 'flex justify-center min-h-[65px]'} />;
}
