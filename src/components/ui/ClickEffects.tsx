'use client';

import { useEffect } from 'react';

/**
 * Efeito de clique global (onda) para botões e links com aparência de botão.
 *
 * A onda é desenhada em uma camada própria, fixa sobre o elemento clicado e recortada no mesmo
 * formato dele — não altera o layout nem o DOM dos botões. Respeita "reduzir movimento" do sistema.
 * Para desativar em um elemento: data-no-ripple. Links que parecem botão: data-ripple.
 */
const TARGETS = [
  'button',
  '[role="button"]',
  'a[data-ripple]',
  'header a',
  'a[class*="bg-primary"]',
  'a[class*="bg-foreground"]',
].join(',');

const SKIP = '[disabled], [aria-disabled="true"], [role="option"], [data-no-ripple]';

function rippleColor(el: HTMLElement): string {
  const bg = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
  const alpha = bg && bg.length > 3 ? parseFloat(bg[3]) : bg ? 1 : 0;
  if (!bg || alpha < 0.4) return 'rgba(175, 21, 24, 0.16)';          // fundo claro/transparente → tom da marca
  const lum = 0.299 * +bg[0] + 0.587 * +bg[1] + 0.114 * +bg[2];
  return lum < 150 ? 'rgba(255, 255, 255, 0.35)' : 'rgba(175, 21, 24, 0.16)'; // fundo escuro → onda clara
}

export default function ClickEffects() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onDown = (e: PointerEvent) => {
      if (reduce.matches) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>(TARGETS);
      if (!el || el.matches(SKIP) || el.closest('[data-no-ripple]')) return;

      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;

      const wrap = document.createElement('span');
      Object.assign(wrap.style, {
        position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`,
        borderRadius: getComputedStyle(el).borderRadius, overflow: 'hidden',
        pointerEvents: 'none', zIndex: '2147483000',
      } as CSSStyleDeclaration);

      const size = Math.max(rect.width, rect.height) * 2;
      const dot = document.createElement('span');
      Object.assign(dot.style, {
        position: 'absolute', borderRadius: '50%', background: rippleColor(el),
        width: `${size}px`, height: `${size}px`,
        left: `${e.clientX - rect.left - size / 2}px`, top: `${e.clientY - rect.top - size / 2}px`,
        transform: 'scale(0)', opacity: '1',
        transition: 'transform 520ms cubic-bezier(.2,.6,.2,1), opacity 560ms ease-out',
      } as CSSStyleDeclaration);

      wrap.appendChild(dot);
      document.body.appendChild(wrap);
      requestAnimationFrame(() => { dot.style.transform = 'scale(1)'; dot.style.opacity = '0'; });
      window.setTimeout(() => wrap.remove(), 650);
    };

    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  return null;
}
