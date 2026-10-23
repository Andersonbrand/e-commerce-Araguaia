'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompany } from '@/context/CompanyContext';
import AppIcon from '@/components/ui/AppIcon';
import AppLogo from '@/components/ui/AppLogo';
import { toUpperText } from '@/lib/format';

// Rotas onde o card nunca deve aparecer
const HIDDEN_ON_ROUTES = ['/login', '/register'];

// Lembra se a pessoa minimizou/expandiu o card durante a sessão
const STORAGE_KEY = 'company-card-expanded';

/**
 * Card flutuante da empresa selecionada (canto inferior direito).
 * - Desktop (≥ 640px): abre expandido, no mesmo estilo dos cards de produto.
 * - Mobile (< 640px): abre minimizado como uma bolinha com o logo; toque para expandir,
 *   toque fora (ou no botão de minimizar) para recolher.
 */
export default function CompanyBanner() {
  const { company, setActiveCompany, isGrupoView } = useCompany();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Entrada suave
  useEffect(() => {
    if (!isGrupoView) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [isGrupoView]);

  // Detecta mobile e define o estado inicial (respeitando a escolha da sessão)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    let stored: string | null = null;
    try { stored = sessionStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }
    setExpanded(stored !== null ? stored === '1' : !mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const updateExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    try { sessionStorage.setItem(STORAGE_KEY, value ? '1' : '0'); } catch { /* ignore */ }
  }, []);

  // No mobile: tocar fora do card recolhe para a bolinha
  useEffect(() => {
    if (!isMobile || !expanded) return;
    const onOutside = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) updateExpanded(false);
    };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [isMobile, expanded, updateExpanded]);

  // Esc recolhe
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') updateExpanded(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [expanded, updateExpanded]);

  if (HIDDEN_ON_ROUTES.some((route) => pathname?.startsWith(route))) return null;
  if (isGrupoView || !company) return null;

  const extraCategories = Math.max(company.categories.length - 1, 0);

  return (
    <div
      ref={rootRef}
      className={`fixed right-3 sm:right-6 z-50 pointer-events-none transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/* ── Card expandido ─────────────────────────────────────── */}
      <div
        role="region"
        aria-label={`Empresa selecionada: ${company.name}`}
        aria-hidden={!expanded}
        className={`origin-bottom-right transition-all duration-300 ease-out w-[min(13.5rem,calc(100vw-1.5rem))] bg-white border border-border rounded-4xl overflow-hidden ${
          expanded ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none absolute bottom-0 right-0'
        }`}
        style={{ boxShadow: `0 12px 40px ${company.primaryColor}33` }}
      >
        {/* Topo com logo */}
        <div
          className="relative h-16 flex items-center justify-center"
          style={{ backgroundColor: `${company.primaryColor}14` }}
        >
          <AppLogo size={44} forceCompany={company.id} />

          {/* Minimizar */}
          <button
            type="button"
            onClick={() => updateExpanded(false)}
            tabIndex={expanded ? 0 : -1}
            title="Minimizar"
            aria-label="Minimizar card da empresa"
            className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-foreground transition-colors"
          >
            <AppIcon name="ChevronDownIcon" size={14} />
          </button>

          {/* Voltar ao grupo */}
          <button
            type="button"
            onClick={() => setActiveCompany(null)}
            tabIndex={expanded ? 0 : -1}
            title="Voltar ao Grupo"
            aria-label="Voltar ao Grupo"
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-foreground transition-colors"
          >
            <AppIcon name="XMarkIcon" size={14} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-3.5 pt-3 pb-3.5">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: company.primaryColor }}>
            Visualizando
          </p>
          <p className="text-sm font-bold text-foreground leading-tight mt-0.5 mb-2.5">
            {toUpperText(company.name)}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {company.categories.slice(0, 1).map((cat) => (
              <span
                key={cat}
                className="text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap max-w-full truncate"
                style={{ backgroundColor: `${company.primaryColor}14`, color: company.primaryDark }}
              >
                {toUpperText(cat)}
              </span>
            ))}
            {extraCategories > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
                style={{ backgroundColor: `${company.primaryColor}14`, color: company.primaryDark }}
              >
                +{extraCategories}
              </span>
            )}
          </div>

          <Link
            href={`/products?empresa=${company.id}`}
            onClick={() => { if (isMobile) updateExpanded(false); }}
            tabIndex={expanded ? 0 : -1}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white hover:brightness-110 active:scale-[0.98] transition-all"
            style={{ backgroundColor: company.primaryColor }}
          >
            <AppIcon name="Squares2X2Icon" size={13} />
            Ver Produtos
          </Link>
        </div>
      </div>

      {/* ── Bolinha minimizada ─────────────────────────────────── */}
      <button
        type="button"
        onClick={() => updateExpanded(true)}
        aria-expanded={expanded}
        aria-label={`Empresa selecionada: ${company.name}. Toque para abrir`}
        tabIndex={expanded ? -1 : 0}
        className={`relative ml-auto flex items-center justify-center w-14 h-14 rounded-full bg-white border border-border origin-bottom-right transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${
          expanded ? 'opacity-0 scale-50 pointer-events-none absolute bottom-0 right-0' : 'opacity-100 scale-100 pointer-events-auto'
        }`}
        style={{ boxShadow: `0 8px 24px ${company.primaryColor}40` }}
      >
        <AppLogo size={34} forceCompany={company.id} />
        <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" aria-hidden="true" />
      </button>
    </div>
  );
}
