'use client';

import React from 'react';
import AppImage from '@/components/ui/AppImage';

/**
 * ProductImage — componente GLOBAL para qualquer foto de produto.
 *
 * Garante que a imagem:
 *  - ocupa sempre uma "moldura" de proporção fixa (nunca estica o card);
 *  - é exibida inteira (object-contain) e nunca é cortada nem ultrapassa a moldura;
 *  - tem fallback automático quando a URL quebra;
 *  - mantém o mesmo respiro (padding) e o mesmo efeito de hover em todo o sistema.
 *
 * Variantes:
 *  - thumb   → miniatura quadrada (lista do admin, carrinho). O tamanho vem do pai (w-10, w-20…).
 *  - card    → card do catálogo, destaques da home e relacionados (proporção 4:3).
 *  - detail  → imagem principal da página do produto (quadrada, respiro maior).
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

const VARIANTS: Record<ProductImageVariant, { frame: string; padding: number; sizes: string }> = {
  thumb:  { frame: 'relative w-full aspect-square',  padding: 4,  sizes: '96px' },
  card:   { frame: 'relative w-full aspect-[4/3]',   padding: 12, sizes: '(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw' },
  detail: { frame: 'relative w-full aspect-square',  padding: 32, sizes: '(max-width: 1024px) 100vw, 50vw' },
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

  return (
    <div className={`${v.frame} overflow-hidden bg-white ${className}`}>
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
          style={{ objectFit: fit, padding: typeof pad === 'number' ? `${pad}px` : pad }}
          {...(onError ? { onError } : {})}
        />
      </div>
      {children}
    </div>
  );
}
