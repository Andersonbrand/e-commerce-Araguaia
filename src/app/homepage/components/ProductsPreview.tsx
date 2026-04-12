'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import AppIcon from '@/components/ui/AppIcon';
import { supabase, Product } from '@/lib/supabase';
import { usePrices } from '@/context/PriceContext';
import { useCart } from '@/context/CartContext';
import { useCompany, COMPANIES, CompanyId, COMPANY_ORDER, COMPANY_CATEGORIES } from '@/context/CompanyContext';
import toast from 'react-hot-toast';

// Imagens por categoria — fotos reais do estoque da Comercial Araguaia
const CATEGORY_IMAGES: Record<string, string> = {
  // Araguaia
  'Cimento': '/assets/images/categories/cimento.png',
  'Vergalhões': '/assets/images/categories/vergalhoes.png',
  'Barras e Perfis': '/assets/images/categories/barras-perfis.png',
  'Chapas': '/assets/images/categories/chapas.png',
  'Arames': '/assets/images/categories/arames.png',
  'Tubos': '/assets/images/categories/tubos.png',
  'Argamassas': '/assets/images/categories/argamassas.png',

  // Confiance Indústria
  'Telhas de Zinco': '/assets/images/categories/telhas-zinco.png',
  'Bobinas de Zinco': '/assets/images/categories/bobinas.png',
  'Colunas': '/assets/images/categories/coluna-aco.png',
  'Treliças': '/assets/images/categories/trelicas.png',

  // Aços Confiance / compartilhadas
  'Telhas de Fibrocimento': '/assets/images/categories/telhas.png',
  'Aços Planos': '/assets/images/categories/acos-planos.png',          // chapas planas em rack — literalmente "aços planos"
};
const FALLBACK_IMAGE = '/assets/images/categories/estoque-geral.png';

export default function ProductsPreview() {
  const [products, setProducts] = useState<Product[]>([]);
  const { showPrices } = usePrices();
  const { addToCart } = useCart();
  const { activeCompany, company, setActiveCompany, isGrupoView } = useCompany();

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).limit(40)
      .then(({ data }) => setProducts(data ?? []));
  }, []);

  const handleAdd = (product: Product) => {
    addToCart(product, activeCompany);
    toast.success(`${product.name} adicionado ao orçamento!`);
  };

  // Filtro por empresa
  const filteredProducts = isGrupoView ? products : products.filter(p => {
    if (!company) return true;
    // 1. companies[] do banco (após migration)
    const pCos = (p as any).companies as string[] | undefined;
    if (pCos && pCos.length > 0) return pCos.includes(activeCompany!);
    // 2. Fallback: comparação EXATA por categoria (sem substring para evitar vazamento)
    const allowedCats = COMPANY_CATEGORIES[activeCompany as CompanyId] ?? [];
    return allowedCats.some(cat => cat.toLowerCase() === p.category.toLowerCase());
  });

  // Categorias com produto representativo:
  // Prioridade: 1) is_featured=true com imagem 2) is_featured=true sem imagem 3) com imagem 4) qualquer
  const categoryMap = new Map<string, Product>();
  filteredProducts.forEach(p => {
    if (!categoryMap.has(p.category)) {
      categoryMap.set(p.category, p);
    } else {
      const current = categoryMap.get(p.category)!;
      const pFeatured = (p as any).is_featured;
      const cFeatured = (current as any).is_featured;
      // Substitui se: p é featured e atual não; ou ambos featured mas p tem imagem; ou atual sem imagem e p tem
      if ((pFeatured && !cFeatured) ||
        (pFeatured && cFeatured && !current.image_url && p.image_url) ||
        (!cFeatured && !current.image_url && p.image_url)) {
        categoryMap.set(p.category, p);
      }
    }
  });
  const categories = Array.from(categoryMap.entries()).slice(0, 4);

  // Bento: usa a image_url do produto em destaque daquela categoria.
  // O categoryMap já priorizou is_featured=true com imagem no loop acima.
  // Fallback: mapa estático → imagem geral.
  // Sempre usa a imagem da categoria do mapa estático quando disponível
  // Isso garante que o bento exibe a imagem correta independente do produto representante
  const getBentoCatImage = (cat: string, prod?: Product) =>
    CATEGORY_IMAGES[cat] || prod?.image_url || FALLBACK_IMAGE;

  // Cards "Itens em Destaque": usa a imagem real do produto cadastrada pelo admin.
  // Fallback: mapa de categoria → imagem geral.
  const getProductImage = (product: Product) =>
    product.image_url || CATEGORY_IMAGES[product.category] || FALLBACK_IMAGE;

  // Verifica se a empresa atual tem categoria Cimento
  const hasCimento = categories.some(([cat]) => cat.toLowerCase() === 'cimento');

  // Produtos em destaque: prefere is_featured=true, senão usa os primeiros disponíveis
  const featuredFirst = filteredProducts.filter(p => (p as any).is_featured);
  const nonFeatured = filteredProducts.filter(p => !(p as any).is_featured);
  const featured = [...featuredFirst, ...nonFeatured].slice(0, 4);

  // Cimento Montes Claros só é priorizado no bento QUANDO empresa tem Cimento
  const cimentoMontesClaros = hasCimento
    ? filteredProducts.find(p =>
      p.name.toLowerCase().includes('montes claros') || p.name.toLowerCase().includes('cpii')
    )
    : undefined;
  const categoriesSorted = [...categories].sort((a, b) => {
    if (hasCimento) {
      if (a[0].toLowerCase() === 'cimento') return -1;
      if (b[0].toLowerCase() === 'cimento') return 1;
    }
    return 0;
  });

  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            {company && (
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: company.primaryColor }} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: company.primaryColor }}>
                  {company.name}
                </span>
              </div>
            )}
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary block">Nosso Catálogo</span>
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

        {/* Gateway: se nenhuma empresa selecionada, mostrar convite para selecionar */}
        {isGrupoView && (
          <div className="mb-12 rounded-4xl border-2 border-dashed border-[#dde3ed] p-10 text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted mb-4">Grupo HC</p>
            <h3 className="text-2xl font-bold text-foreground mb-2 text-center">Selecione uma empresa para ver os produtos</h3>
            <p className="text-muted mb-6 text-sm">Cada empresa tem seu próprio portfólio especializado.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {COMPANY_ORDER.map((id) => {
                const co = COMPANIES[id];
                return (
                  <button key={id} onClick={() => setActiveCompany(id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all hover:-translate-y-0.5"
                    style={{ borderColor: co.primaryColor, color: co.primaryColor, backgroundColor: co.bgLight }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: co.primaryColor }} />
                    {co.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bento grid de categorias */}
        {categories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
            {categoriesSorted[0] && (
              <Link href={`/products?categoria=${encodeURIComponent(categoriesSorted[0][0])}`}
                className="lg:col-span-5 product-card group relative rounded-4xl overflow-hidden shadow-red-lg hover-lift cursor-pointer bg-surface block">
                <div className="relative h-[400px] overflow-hidden bg-white">
                  {/* Usa imagem do Cimento Montes Claros se disponível, senão fallback da categoria */}
                  <AppImage
                    src={getBentoCatImage(categoriesSorted[0][0], categoriesSorted[0][1])}
                    alt={categoriesSorted[0][0]}
                    className="product-img transition-transform duration-700 group-hover:scale-105"
                    style={{ objectFit: 'cover' }}
                    fill
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="badge mb-3 bg-primary text-white">
                    {hasCimento ? 'Mais vendido' : 'Destaque'}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-1">{categoriesSorted[0][0]}</h3>
                  <p className="text-sm text-white/70">
                    {filteredProducts.filter(p => p.category === categoriesSorted[0][0]).length} produtos disponíveis
                  </p>
                </div>
              </Link>
            )}

            <div className="lg:col-span-3 grid grid-rows-2 gap-5">
              {[categoriesSorted[1], categoriesSorted[2]].filter(Boolean).map(([cat, prod]) => (
                <Link key={cat} href={`/products?categoria=${encodeURIComponent(cat)}`}
                  className="product-card group relative rounded-4xl overflow-hidden shadow-sm hover-lift cursor-pointer bg-surface block">
                  <div className="relative h-full min-h-[190px] overflow-hidden">
                    <AppImage src={getBentoCatImage(cat, prod)} alt={cat}
                      className="product-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" fill />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="badge mb-2 bg-surface-2 text-foreground">Destaque</span>
                    <h3 className="text-base font-bold text-white">{cat}</h3>
                  </div>
                </Link>
              ))}
            </div>

            {categoriesSorted[3] && (
              <Link href={`/products?categoria=${encodeURIComponent(categoriesSorted[3][0])}`}
                className="lg:col-span-4 product-card group relative rounded-4xl overflow-hidden shadow-red-lg hover-lift cursor-pointer bg-surface block">
                <div className="relative h-[400px] overflow-hidden">
                  <AppImage src={getBentoCatImage(categoriesSorted[3][0], categoriesSorted[3][1])} alt={categoriesSorted[3][0]}
                    className="product-img w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" fill />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="badge mb-3 bg-surface-2 text-foreground">Destaque</span>
                  <h3 className="text-2xl font-bold text-white mb-1">{categoriesSorted[3][0]}</h3>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Produtos destaque */}
        {featured.length > 0 && (
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-foreground mb-8">Produtos em Destaque</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <div key={product.id} className="product-card group bg-white border border-border rounded-4xl overflow-hidden hover-lift shadow-sm">
                  <a href={`/products/${product.id}`} className="relative overflow-hidden bg-white block" style={{ height: '200px' }}>
                    <AppImage
                      src={getProductImage(product)}
                      alt={product.name} fill
                      className="product-img transition-transform duration-700 group-hover:scale-105"
                      style={{ objectFit: 'contain', padding: '12px' }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
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
