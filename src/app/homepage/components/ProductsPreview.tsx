'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import AppIcon from '@/components/ui/AppIcon';
import { supabase, Product } from '@/lib/supabase';
import { usePrices } from '@/context/PriceContext';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

// Imagens reais da empresa para categorias
const CATEGORY_IMAGES: Record<string, { image: string; alt: string; tag: string; tagColor: string }> = {
  'Cimento':     { image: '/assets/images/about/sacos-cimento.jpg',  alt: 'Sacos de cimento Comercial Araguaia', tag: 'Mais vendido', tagColor: 'bg-primary text-white' },
  'Vergalhões':  { image: '/assets/images/about/vergalhoes.jpg',     alt: 'Vergalhões e perfis metálicos',       tag: 'Estrutural',   tagColor: 'bg-accent text-white' },
  'Ferragens':   { image: '/assets/images/about/estoque.jpg',        alt: 'Estoque de ferragens',                tag: 'Variedade',    tagColor: 'bg-surface-2 text-foreground' },
  'Serralheria': { image: '/assets/images/about/estoque.jpg',        alt: 'Materiais de serralheria',            tag: 'Completo',     tagColor: 'bg-surface-2 text-foreground' },
};

const FALLBACK = {
  image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
  alt: 'Materiais de construção', tag: 'Destaque', tagColor: 'bg-primary text-white',
};

export default function ProductsPreview() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const { showPrices }          = usePrices();
  const { addToCart }           = useCart();

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).limit(8)
      .then(({ data }) => setFeatured(data ?? []));
  }, []);

  const handleAdd = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} adicionado ao orçamento!`);
  };

  const categories = Array.from(new Set(featured.map((p) => p.category))).slice(0, 4);

  const getCatInfo = (cat: string) => CATEGORY_IMAGES[cat] ?? FALLBACK;

  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Nosso Catálogo</span>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
              Categorias{' '}
              <span className="font-display italic text-gradient-red">principais.</span>
            </h2>
          </div>
          <Link href="/products" className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] font-bold text-muted hover:text-primary transition-colors group">
            Ver todos os produtos
            <AppIcon name="ArrowRightIcon" size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Bento grid — cada card linka para /products?categoria=X */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {categories[0] && (
            <Link href={`/products?categoria=${encodeURIComponent(categories[0])}`}
              className="lg:col-span-5 product-card group relative rounded-4xl overflow-hidden shadow-red-lg hover-lift cursor-pointer bg-surface block">
              <div className="relative h-[460px] overflow-hidden">
                <AppImage src={getCatInfo(categories[0]).image} alt={getCatInfo(categories[0]).alt}
                  className="product-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" fill />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className={`badge mb-3 ${getCatInfo(categories[0]).tagColor}`}>{getCatInfo(categories[0]).tag}</span>
                <h3 className="text-2xl font-bold text-white mb-1">{categories[0]}</h3>
                <p className="text-sm text-white/70">{featured.filter((p) => p.category === categories[0]).length} produtos disponíveis</p>
              </div>
            </Link>
          )}

          <div className="lg:col-span-3 grid grid-rows-2 gap-5">
            {[categories[1], categories[2]].filter(Boolean).map((cat) => (
              <Link key={cat} href={`/products?categoria=${encodeURIComponent(cat)}`}
                className="product-card group relative rounded-4xl overflow-hidden shadow-sm hover-lift cursor-pointer bg-surface block">
                <div className="relative h-full min-h-[210px] overflow-hidden">
                  <AppImage src={getCatInfo(cat).image} alt={getCatInfo(cat).alt}
                    className="product-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" fill />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className={`badge mb-2 ${getCatInfo(cat).tagColor}`}>{getCatInfo(cat).tag}</span>
                  <h3 className="text-lg font-bold text-white">{cat}</h3>
                </div>
              </Link>
            ))}
          </div>

          {categories[3] && (
            <Link href={`/products?categoria=${encodeURIComponent(categories[3])}`}
              className="lg:col-span-4 product-card group relative rounded-4xl overflow-hidden shadow-red-lg hover-lift cursor-pointer bg-surface block">
              <div className="relative h-[460px] overflow-hidden">
                <AppImage src={getCatInfo(categories[3]).image} alt={getCatInfo(categories[3]).alt}
                  className="product-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" fill />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className={`badge mb-3 ${getCatInfo(categories[3]).tagColor}`}>{getCatInfo(categories[3]).tag}</span>
                <h3 className="text-2xl font-bold text-white mb-1">{categories[3]}</h3>
              </div>
            </Link>
          )}
        </div>

        {/* Produtos destaque */}
        {featured.length > 0 && (
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-foreground mb-8">Produtos em Destaque</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.slice(0, 4).map((product) => (
                <div key={product.id} className="product-card group bg-white border border-border rounded-4xl overflow-hidden hover-lift shadow-sm">
                  <a href={`/products/${product.id}`} className="relative h-48 overflow-hidden bg-surface block">
                    <AppImage src={product.image_url ?? '/assets/images/no_image.png'} alt={product.name} fill
                      className="product-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 text-foreground text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow">Ver detalhes</span>
                    </div>
                  </a>
                  <div className="p-5 space-y-3">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-primary">{product.category}</span>
                    <h4 className="text-sm font-bold text-foreground leading-snug">{product.name}</h4>
                    <div className="flex items-center justify-between pt-1">
                      {showPrices && product.price > 0
                        ? <span className="text-base font-bold text-foreground">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                        : <span className="text-sm text-muted italic">Sob consulta</span>}
                      <button onClick={() => handleAdd(product)}
                        className="px-3 py-1.5 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary-dark transition-all">
                        + Orçamento
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/products" className="inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-red-lg hover:-translate-y-0.5">
            <AppIcon name="Squares2X2Icon" size={18} />
            Explorar Catálogo Completo
          </Link>
        </div>
      </div>
    </section>
  );
}
