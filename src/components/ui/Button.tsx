'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';

/**
 * Button — botão de AÇÃO da aplicação (gravar, enviar, excluir, sair...).
 *
 * Enquanto a operação roda o botão fica inacessível e mostra "Carregando...", e novos cliques
 * são ignorados até a operação terminar — assim nada é lançado em duplicidade.
 *
 * Como usar:
 *  - onClick assíncrono: <Button onClick={async () => { await salvar(); }}>Salvar</Button>
 *    (o botão detecta a Promise sozinho e trava até ela terminar)
 *  - botão de formulário: <Button type="submit" loading={saving}>Salvar</Button>
 *
 * O estilo continua vindo do className, como nos botões normais.
 */
type ClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onClick?: ClickHandler;
  /** Controle externo (ex.: o estado `saving` de um formulário) */
  loading?: boolean;
  /** Texto durante a operação. Padrão: "Carregando...". Use null para mostrar só o spinner. */
  loadingText?: React.ReactNode | null;
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { onClick, loading, loadingText = 'Carregando...', disabled, children, type = 'button', ...props }, ref,
) {
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);      // trava imediata (antes do React redesenhar)
  const mounted = useRef(true);
  // StrictMode (npm run dev) monta → desmonta → monta de novo: precisa voltar para true na montagem,
  // senão o botão nunca sai do "Carregando..." depois que a operação termina.
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const isBusy = !!loading || busy;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isBusy || locked.current) { e.preventDefault(); return; }
    if (!onClick) return;
    const result = onClick(e);
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      locked.current = true;
      setBusy(true);
      Promise.resolve(result)
        .catch((err) => console.error('[Button] operação falhou:', err))
        .finally(() => {
          locked.current = false;
          if (mounted.current) setBusy(false);
        });
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      {...props}
      disabled={disabled || isBusy}
      aria-busy={isBusy || undefined}
      onClick={handleClick}
    >
      {isBusy ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Spinner />
          {loadingText}
        </span>
      ) : children}
    </button>
  );
});

export default Button;
