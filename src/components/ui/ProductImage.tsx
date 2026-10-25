'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';

/**
 * ProductImage — componente GLOBAL para qualquer foto de produto.
 *
 * Garante que a imagem:
 *  - ocupa sempre uma "moldura" de proporção fixa (nunca estica o card);
 *  - é exibida inteira (object-contain) e nunca é cortada nem ultrapassa a moldura;
 *  - tem fallback automático quando a URL quebra;
 *  - mantém o mesmo respiro (padding) e o mesmo efeito de hover em todo o sistema;
 *  - ENQUADRA O PRODUTO: fotos com margens brancas grandes (ou transparentes) são ampliadas e
 *    centralizadas para que o produto ocupe sempre a mesma fração da moldura — assim todas as imagens
 *    ficam com o mesmo tamanho aparente, independente da margem que a foto original tem.
 *    (Funciona com fundo branco/transparente; fotos com fundo colorido/degradê ficam como estão.)
 *
 * Variantes:
 *  - thumb   → miniatura quadrada (lista do admin, carrinho). O tamanho vem do pai (w-10, w-20…).
 *  - card    → card do catálogo, destaques da home e relacionados (proporção 4:3).
 *  - detail  → imagem principal da página do produto (quadrada, respiro mínimo para preencher a moldura).
 *  - fill    → preenche 100% do pai posicionado (cards bento da home, preview do admin).
 *              Use `padding` para reservar espaço (ex.: para o texto sobreposto).
 */
export type ProductImageVariant = 'thumb' | 'card' | 'detail' | 'fill';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  variant?: ProductImageVariant;
  /** Classes extras da moldura (ex.: rounded-2xl, bg-surface, border). */
  className?: string;
  /** Classes extras da <img> (ex.: product-img, group-hover:scale-105). */
  imgClassName?: string;
  /** Respiro interno em px (ou qualquer valor CSS). Sobrescreve o padrão da variante. */
  padding?: number | string;
  /** 'contain' (padrão, nunca corta) ou 'cover' (só para fotos ambientadas, não para produtos). */
  fit?: 'contain' | 'cover';
  priority?: boolean;
  sizes?: string;
  /** Chamado quando a imagem falha ao carregar (ex.: preview de URL inválida no admin). */
  onError?: () => void;
  children?: React.ReactNode; // overlays (badges, gradientes) renderizados por cima da imagem
}

export const FALLBACK_IMAGE = '/assets/images/no_image.png';

/** Fração da área útil da moldura que o produto deve ocupar depois do enquadramento. */
const PRODUCT_FILL = 0.9;

// ---------- Enquadramento automático ----------
type Box = { x0: number; y0: number; x1: number; y1: number; ar: number }; // caixa do produto (0–1) e proporção da foto
const boxCache = new Map<string, Promise<Box | null>>();

/** Só analisamos imagens locais ou do Supabase Storage (que libera CORS); as demais ficam sem enquadramento. */
function canAnalyze(src: string): boolean {
  if (src.startsWith('/') && !src.startsWith('//')) return true;
  try { return new URL(src).hostname.endsWith('.supabase.co'); } catch { return false; }
}
const needsCors = (src: string) => /^https?:/i.test(src) && canAnalyze(src);

/** Descobre onde está o produto dentro da foto, ignorando fundo branco e transparente. */
function analyze(src: string): Promise<Box | null> {
  const cached = boxCache.get(src);
  if (cached) return cached;
  const job = new Promise<Box | null>((resolve) => {
    const img = new window.Image();
    if (needsCors(src)) img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const nw = img.naturalWidth, nh = img.naturalHeight;
        if (!nw || !nh) return resolve(null);
        const ar = nw / nh;
        const MAX = 140;
        const w = ar >= 1 ? MAX : Math.max(8, Math.round(MAX * ar));
        const h = ar >= 1 ? Math.max(8, Math.round(MAX / ar)) : MAX;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let y = 1; y < h - 1; y++) {            // ignora a borda de 1px (artefatos de escala)
          for (let x = 1; x < w - 1; x++) {
            const i = (y * w + x) * 4;
            const a = data[i + 3];
            const isBg = a < 24 || (data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238);
            if (!isBg) {
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < 0 || maxY < 0) return resolve(null);
        resolve({ x0: minX / w, y0: minY / h, x1: (maxX + 1) / w, y1: (maxY + 1) / h, ar });
      } catch {
        resolve(null); // canvas bloqueado por CORS: mantém a imagem como está
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  boxCache.set(src, job);
  return job;
}

/** Converte "24px 24px 140px" / número em [topo, direita, baixo, esquerda] (px). */
function parsePadding(pad: number | string): [number, number, number, number] {
  if (typeof pad === 'number') return [pad, pad, pad, pad];
  const v = pad.trim().split(/\s+/).map((n) => parseFloat(n) || 0);
  if (v.length === 1) return [v[0], v[0], v[0], v[0]];
  if (v.length === 2) return [v[0], v[1], v[0], v[1]];
  if (v.length === 3) return [v[0], v[1], v[2], v[1]];
  return [v[0], v[1], v[2], v[3]];
}

/** Calcula a ampliação (s) e o deslocamento (tx, ty) que centralizam o produto na área útil da moldura. */
export function trimTransform(
  box: Box, W: number, H: number, pad: [number, number, number, number], fill = PRODUCT_FILL,
): { tx: number; ty: number; s: number } | null {
  const [pt, pr, pb, pl] = pad;
  const cw = W - pl - pr, ch = H - pt - pb;
  if (cw <= 0 || ch <= 0) return null;
  // tamanho que a foto inteira ocupa com object-fit: contain
  const dw = cw / ch > box.ar ? ch * box.ar : cw;
  const dh = cw / ch > box.ar ? ch : cw / box.ar;
  const left = pl + (cw - dw) / 2, top = pt + (ch - dh) / 2;
  const bw = (box.x1 - box.x0) * dw, bh = (box.y1 - box.y0) * dh;
  if (bw <= 0 || bh <= 0) return null;
  const s = Math.min(Math.min((fill * cw) / bw, (fill * ch) / bh), 4);
  if (s < 1.04) return null; // já ocupa bem a moldura
  const bcx = left + ((box.x0 + box.x1) / 2) * dw, bcy = top + ((box.y0 + box.y1) / 2) * dh;
  const cfx = W / 2, cfy = H / 2;
  return { s, tx: pl + cw / 2 - cfx - s * (bcx - cfx), ty: pt + ch / 2 - cfy - s * (bcy - cfy) };
}

const VARIANTS: Record<ProductImageVariant, { frame: string; padding: number; sizes: string }> = {
  thumb:  { frame: 'relative w-full aspect-square',  padding: 4,  sizes: '96px' },
  card:   { frame: 'relative w-full aspect-[4/3]',   padding: 12, sizes: '(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw' },
  detail: { frame: 'relative w-full aspect-square',  padding: 8,  sizes: '(max-width: 1024px) 100vw, 50vw' },
  fill:   { frame: 'absolute inset-0',               padding: 8,  sizes: '(max-width: 768px) 100vw, 40vw' },
};

export default function ProductImage({
  src,
  alt,
  variant = 'card',
  className = '',
  imgClassName = '',
  padding,
  fit = 'contain',
  priority = false,
  sizes,
  onError,
  children,
}: ProductImageProps) {
  const v = VARIANTS[variant];
  const resolvedSrc = src && src.trim() ? src : FALLBACK_IMAGE;
  const pad = padding ?? v.padding;

  // ----- enquadramento do produto -----
  const frameRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const analyzable = fit === 'contain' && canAnalyze(resolvedSrc) && resolvedSrc !== FALLBACK_IMAGE;

  useEffect(() => {
    let alive = true;
    setBox(null);
    if (analyzable) analyze(resolvedSrc).then((b) => { if (alive) setBox(b); });
    return () => { alive = false; };
  }, [resolvedSrc, analyzable]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) => (prev && Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1 ? prev : { w: width, h: height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const trim = useMemo(
    () => (box && size ? trimTransform(box, size.w, size.h, parsePadding(pad)) : null),
    [box, size, pad],
  );

  return (
    <div ref={frameRef} className={`${v.frame} overflow-hidden bg-white ${className}`}>
      {/* camada absoluta: dá altura definida para o <Image fill> mesmo quando a moldura usa aspect-ratio */}
      <div className="absolute inset-0">
        <AppImage
          // key força recarregar quando a URL muda (ex.: novo upload no modal do admin)
          key={resolvedSrc}
          src={resolvedSrc}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes ?? v.sizes}
          className={imgClassName}
          style={{
            objectFit: fit,
            padding: typeof pad === 'number' ? `${pad}px` : pad,
            // Fotos de produto: o "quase branco" do JPG (ex.: #FCFCFC) vira branco puro e o retângulo da imagem
            // some no card branco. Só afeta tons ≥ ~246; o restante da foto muda menos de 4%.
            // (fotos ambientadas, fit="cover", ficam como estão)
            ...(fit === 'contain' ? { filter: 'brightness(1.035)' } : {}),
            // propriedades individuais (translate/scale) somam com o transform do hover, sem substituí-lo
            ...(trim ? {
              translate: `${trim.tx.toFixed(2)}px ${trim.ty.toFixed(2)}px`,
              scale: trim.s.toFixed(4),
              transitionProperty: 'translate, scale, transform',
              transitionDuration: '350ms, 350ms, 700ms',
            } : {}),
          }}
          {...(needsCors(resolvedSrc) ? { crossOrigin: 'anonymous' as const } : {})}
          {...(onError ? { onError } : {})}
        />
      </div>
      {children}
    </div>
  );
}
