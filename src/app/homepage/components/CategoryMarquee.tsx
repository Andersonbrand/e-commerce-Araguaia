'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { assignCategoryIcons } from '@/lib/category-icons';
import { toUpperText } from '@/lib/format';

export interface MarqueeCategory { name: string; count: number; }

/**
 * Faixa horizontal de categorias que rola sozinha.
 * Pausa ao passar o mouse; com prefers-reduced-motion vira uma faixa rolável manualmente.
 */
export default function CategoryMarquee({ categories }: { categories: MarqueeCategory[] }) {
  // Um ícone diferente (e coerente com o material) para cada categoria
  const icons = useMemo(() => assignCategoryIcons(categories.map((c) => c.name)), [categories]);

  if (categories.length < 3) return null;

  // Cada cópia precisa ser mais larga que a tela: com poucas categorias, repete a lista dentro da cópia
  const reps = Math.max(1, Math.ceil(12 / categories.length));
  const group = Array.from({ length: reps }).flatMap(() => categories);
  const duration = Math.max(group.length * 3.2, 24);

  const renderGroup = (hidden: boolean) => (
    <div className="hc-marquee-group" aria-hidden={hidden || undefined}>
      {group.map((c, i) => (
        <Link
          key={`${c.name}-${i}`}
          href={`/products?categoria=${encodeURIComponent(c.name)}`}
          tabIndex={hidden ? -1 : undefined}
          className="group shrink-0 flex items-center gap-3 pl-3 pr-5 py-3 rounded-2xl border border-border bg-white shadow-sm hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all"
        >
          <span className="w-10 h-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:-rotate-12 group-hover:scale-110">
            <CategoryIcon iconKey={icons[c.name]} size={22} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-foreground whitespace-nowrap">{toUpperText(c.name)}</span>
            <span className="block text-[10px] uppercase tracking-widest text-muted font-bold">
              {c.count} {c.count === 1 ? 'produto' : 'produtos'}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="mt-16">
      <p className="text-center text-[10px] uppercase tracking-[0.4em] text-muted font-bold mb-6">
        Navegue por categoria
      </p>
      <div className="hc-marquee">
        <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="hc-marquee-track py-2" style={{ '--hc-marquee-duration': `${duration}s`, '--hc-marquee-gap': '1rem' } as React.CSSProperties}>
          {renderGroup(false)}
          {renderGroup(true)}
        </div>
      </div>
    </div>
  );
}
