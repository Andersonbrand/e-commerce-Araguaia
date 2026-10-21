'use client';

import { useEffect } from 'react';

/**
 * Efeito de clique global (onda) para botões e links com aparência de botão.
 *
 * A onda é desenhada em uma camada própria, fixa sobre o elemento clicado e recortada no mesmo
 * formato dele — não altera o layout nem o DOM dos botões. Respeita "reduzir movimento" do sistema.
 * Para desativar em um elemento: data-no-ripple. Links que parecem botão: data-ripple.
 * Cor própria da onda: data-ripple-color="#1a3a6b" (hex vira translúcido; rgba/hsl são usados como estão).
 * Links com a classe .nav-fill (menu do header) também ficam preenchidos em vermelho por ~0,8s (ver tailwind.css).
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

/** '#1a3a6b' → 'rgba(26, 58, 107, a)'. Qualquer outro formato de cor é devolvido como está. */
function withAlpha(color: string, a: number): string {
  const m = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return color;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function rippleColor(el: HTMLElement): string {
  const custom = el.getAttribute('data-ripple-color');
  if (custom) return withAlpha(custom, 0.24);
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

      if (el.classList.contains('nav-fill')) {
        el.setAttribute('data-pressed', '');
        window.setTimeout(() => el.removeAttribute('data-pressed'), 800);
      }

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
