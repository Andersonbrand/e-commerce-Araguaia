'use client';

import React from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';

export interface MarqueeCategory { name: string; count: number; }

// Ícone por palavra-chave do nome da categoria (cai em TagIcon se nada combinar)
const ICON_RULES: Array<[RegExp, string]> = [
  [/cimento|argamassa|concreto/i,        'CubeIcon'],
  [/vergalh|barra|perfil|a[çc]o|treli|coluna/i, 'Bars3BottomLeftIcon'],
  [/telha|cobertura|zinco/i,             'HomeModernIcon'],
  [/arame|corda|cabo|corrente/i,         'LinkIcon'],
  [/chapa|lambri|forro|drywall/i,        'Squares2X2Icon'],
  [/parafus|prego|ferrag|fixa/i,         'Cog6ToothIcon'],
  [/serralh|ferrament/i,                 'WrenchScrewdriverIcon'],
  [/tubo|cano/i,                         'Square3Stack3DIcon'],
];
const iconFor = (name: string) => ICON_RULES.find(([re]) => re.test(name))?.[1] ?? 'TagIcon';

/**
 * Faixa horizontal de categorias que rola sozinha.
 * Pausa ao passar o mouse; com prefers-reduced-motion vira uma faixa rolável manualmente.
 */
export default function CategoryMarquee({ categories }: { categories: MarqueeCategory[] }) {
  if (categories.length < 3) return null;
  const track = [...categories, ...categories]; // duplicado para loop contínuo (-50%)
  const duration = Math.max(categories.length * 3.2, 24);

  return (
    <div className="mt-16">
      <style>{`
        @keyframes hc-cat-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .hc-cat-track { animation: hc-cat-marquee ${duration}s linear infinite; width: max-content; }
        .hc-cat-wrap:hover .hc-cat-track, .hc-cat-wrap:focus-within .hc-cat-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .hc-cat-track { animation: none; }
          .hc-cat-wrap { overflow-x: auto; }
        }
      `}</style>

      <p className="text-center text-[10px] uppercase tracking-[0.4em] text-muted font-bold mb-6">
        Navegue por categoria
      </p>
      <div className="hc-cat-wrap relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="hc-cat-track flex gap-4 py-2">
          {track.map((c, i) => (
            <Link
              key={`${c.name}-${i}`}
              href={`/products?categoria=${encodeURIComponent(c.name)}`}
              aria-hidden={i >= categories.length ? true : undefined}
              tabIndex={i >= categories.length ? -1 : undefined}
              className="group shrink-0 flex items-center gap-3 pl-3 pr-5 py-3 rounded-2xl border border-border bg-white shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all"
            >
              <span className="w-10 h-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:-rotate-12 group-hover:scale-110">
                <AppIcon name={iconFor(c.name)} size={20} />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-foreground whitespace-nowrap">{c.name}</span>
                <span className="block text-[10px] uppercase tracking-widest text-muted font-bold">
                  {c.count} {c.count === 1 ? 'produto' : 'produtos'}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
