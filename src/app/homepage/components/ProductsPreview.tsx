'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProductImage from '@/components/ui/ProductImage';
import AppIcon from '@/components/ui/AppIcon';
import TiltCard from '@/components/ui/TiltCard';
import { toUpperText } from '@/lib/format';
import Reveal from '@/components/ui/Reveal';
import CategoryMarquee from './CategoryMarquee';
import { supabase, Product } from '@/lib/supabase';
import { usePrices } from '@/context/PriceContext';
import { useCart } from '@/context/CartContext';
import { useCompany, COMPANIES, CompanyId, COMPANY_ORDER, COMPANY_CATEGORIES } from '@/context/CompanyContext';
import toast from 'react-hot-toast';

// Imagens fallback por categoria (usando fotos reais de produtos quando possível)
const CATEGORY_IMAGES: Record<string, string> = {
  'Cimento':            '/assets/images/about/sacos-cimento.jpg',
  'Vergalhões':         '/assets/images/about/vergalhoes.jpg',
  'Ferragens':          '/assets/images/about/estoque.jpg',
  'Serralheria':        '/assets/images/about/estoque.jpg',
  'Barras e Perfis':    '/assets/images/about/vergalhoes.jpg',
  'Aços Planos':        '/assets/images/about/vergalhoes.jpg',
  'Arames':             '/assets/images/about/estoque.jpg',
  'Chapas':             '/assets/images/about/estoque.jpg',
  'Telhas':             'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  'Bobinas de Zinco':   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
  'Colunas e Treliças': '/assets/images/about/vergalhoes.jpg',
  'Colunas':            '/assets/images/about/vergalhoes.jpg',
  'Treliças':           '/assets/images/about/vergalhoes.jpg',
  'Tubos':              '/assets/images/about/vergalhoes.jpg',
  'Parafusos':          '/assets/images/about/estoque.jpg',
};
const FALLBACK_IMAGE = '/assets/images/about/estoque.jpg';

// Card "Destaque" das Categorias Principais; companyId só existe na visão do grupo
type Slot = { category: string; product: Product; companyId?: string };

export default function ProductsPreview() {
  const [products, setProducts] = useState<Product[]>([]);
  const { showPrices }          = usePrices();
  const { addToCart }           = useCart();
  const { activeCompany, company, setActiveCompany, isGrupoView } = useCompany();

  const fetchProducts = useCallback(() => {
    supabase.from('products').select('*').eq('is_active', true).limit(200)
      .then(({ data }) => setProducts((data ?? []) as Product[]));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAdd = (product: Product) => {
    if (!addToCart(product)) return; // sem login: leva ao login e adiciona depois
    toast.success(`${toUpperText(product.name)} adicionado ao orçamento!`);
  };

  // Filtro por empresa
  const filteredProducts = isGrupoView ? products : products.filter(p => {
    if (!company) return true;
    // Prioriza companies[] do produto
    const pCos = (p as any).companies as string[] | undefined;
    if (pCos && pCos.length > 0) return pCos.includes(activeCompany!);
    // Fallback: filtra por categoria
    const allowedCats = COMPANY_CATEGORIES[activeCompany as CompanyId] ?? [];
    return allowedCats.some(cat => p.category.toLowerCase().includes(cat.toLowerCase()));
  });

  // ── Seleção feita pelo ADMIN ──────────────────────────────────────────────
  // Nada aqui é escolhido pelo site: o "mais vendido" e os destaques vêm das marcações do painel.
  const ts = (v?: string | null) => (v ? Date.parse(v) || 0 : 0);
  const byRecentFlag = (a: Product, b: Product) =>
    ts(b.featured_at) - ts(a.featured_at) || ts(b.updated_at) - ts(a.updated_at);

  // "Mais vendido": produto marcado para a empresa ativa (um por empresa).
  // Na visão do grupo, vale o da primeira empresa que tiver um.
  const bestSellerOf = (companyId: string): Product | undefined =>
    products.filter((p) => p.best_seller_for?.includes(companyId)).sort((a, b) => ts(b.updated_at) - ts(a.updated_at))[0];
  const bestSeller: Product | undefined = isGrupoView
    ? COMPANY_ORDER.map((id) => bestSellerOf(id)).find(Boolean)
    : bestSellerOf(activeCompany as string);

  const catKey = (c: string) => c.trim().toLowerCase();
  const principalsOf = (companyId: string) =>
    products.filter((p) => p.main_category_company === companyId).sort((a, b) => ts(a.main_category_at) - ts(b.main_category_at));

  let mainProduct: Product | undefined;     // card grande da esquerda
  let mainIsBestSeller = false;
  let slots: Slot[] = [];                   // 3 cards "Destaque" (2 pequenos + 1 grande)

  if (isGrupoView) {
    // Nenhuma empresa selecionada: 4 cards — 2 da Araguaia, 1 da Aços Confiance e 1 da Confiança Indústria.
    // Cada empresa entra com o seu "mais vendido" (o primeiro marcado) ou, sem ele, com a 1ª categoria principal
    // marcada no painel; a 2ª da Araguaia vem das categorias principais dela. Nenhuma categoria repete entre os cards.
    const used = new Set<string>();
    const autoPick = (id: string) =>
      products.find((p) => p.companies?.includes(id) && p.image_url && !used.has(catKey(p.category)))
      ?? products.find((p) => p.companies?.includes(id) && !used.has(catKey(p.category)));
    const pick = (id: string, preferBestSeller: boolean): Product | undefined => {
      const candidates = [...(preferBestSeller ? [bestSellerOf(id)] : []), ...principalsOf(id)];
      const chosen = candidates.find((p) => p && !used.has(catKey(p.category))) ?? autoPick(id);
      if (chosen) used.add(catKey(chosen.category));
      return chosen;
    };
    const araguaiaMain = pick('araguaia', true);
    const acos         = pick('acos-confiance', true);
    const industria    = pick('confiance-industria', true);
    const araguaia2    = pick('araguaia', false);
    mainProduct       = araguaiaMain;
    mainIsBestSeller  = !!araguaiaMain && bestSellerOf('araguaia')?.id === araguaiaMain.id;
    slots = ([
      araguaia2 && { category: araguaia2.category, product: araguaia2, companyId: 'araguaia' },
      acos      && { category: acos.category,      product: acos,      companyId: 'acos-confiance' },
      industria && { category: industria.category, product: industria, companyId: 'confiance-industria' },
    ].filter(Boolean)) as Slot[];
  } else {
    // Empresa selecionada: "mais vendido" + até 3 categorias principais vinculadas a ela (escolha do admin).
    // Cada empresa tem até 3 vagas; o mais antigo marcado vem primeiro. Sem "mais vendido" escolhido,
    // o primeiro assume o card grande da esquerda.
    const usedCats = new Set<string>(bestSeller ? [catKey(bestSeller.category)] : []);
    const slotProducts: Product[] = [];
    for (const p of principalsOf(activeCompany as string)) {
      if (slotProducts.length >= 3) break;
      if (p.id === bestSeller?.id) continue;
      if (usedCats.has(catKey(p.category))) continue;
      usedCats.add(catKey(p.category));
      slotProducts.push(p);
    }
    mainProduct      = bestSeller ?? slotProducts.shift();
    mainIsBestSeller = !!bestSeller;
    slots            = slotProducts.map((p) => ({ category: p.category, product: p }));
  }
  const hasAdminChoice = !!mainProduct;

  // Só se não houver nada para mostrar, a home usa as categorias com mais produtos para não ficar vazia
  const categoryMap = new Map<string, Product>();
  if (!hasAdminChoice) {
    filteredProducts.forEach((p) => {
      const current = categoryMap.get(p.category);
      if (!current || (!current.image_url && p.image_url)) categoryMap.set(p.category, p);
    });
  }
  const categories = Array.from(categoryMap.entries()).slice(0, 4);
  if (!hasAdminChoice) slots = categories.slice(1).map(([category, product]) => ({ category, product }));

  const getCatImage = (cat: string, product: Product) =>
    product.image_url || CATEGORY_IMAGES[cat] || FALLBACK_IMAGE;
  // Foto real do produto → 'contain' (inteira, sem cortes). Foto ambientada de fallback → 'cover'.
  const getCatFit = (product: Product) => (product.image_url ? 'contain' : 'cover');

  // "Produtos em Destaque": escolha própria do admin (⭐), independente das Categorias Principais.
  // Se o produto também estiver nas Categorias Principais, ele aparece nos dois lugares — quem decide é o admin.
  const featured = filteredProducts
    .filter((p) => p.is_featured)
    .sort(byRecentFlag)
    .slice(0, 4);

  // Todas as categorias (com contagem) para a faixa animada
  const marqueeCategories = Array.from(
    filteredProducts.reduce((m, p) => m.set(p.category, (m.get(p.category) ?? 0) + 1), new Map<string, number>())
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

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
            <h3 className="text-2xl font-bold text-foreground mb-2">Selecione uma empresa para ver os produtos</h3>
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
        {(mainProduct || categories.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
            {mainProduct ? (
              <Link href={`/products/${mainProduct.id}`}
                className="lg:col-span-5 product-card group relative rounded-4xl overflow-hidden shadow-red-lg hover-lift cursor-pointer bg-white border border-border block">
                <div className="relative h-[400px] overflow-hidden">
                  <ProductImage src={getCatImage(mainProduct.category, mainProduct)} alt={mainProduct.name}
                    variant="fill" fit={getCatFit(mainProduct)} padding="24px 24px 140px"
                    imgClassName="product-img transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent pointer-events-none" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className={`badge mb-3 ${mainIsBestSeller ? 'bg-primary text-white' : 'bg-surface-2 text-foreground'}`}>
                    {mainIsBestSeller ? 'Mais vendido' : 'Destaque'}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-1">{toUpperText(mainProduct.name)}</h3>
                  <p className="text-sm text-white/70">
                    {toUpperText(mainProduct.category)}{isGrupoView ? ` · ${toUpperText(COMPANIES['araguaia'].shortName)}` : ''}
                  </p>
                </div>
              </Link>
            ) : categories[0] && (
              <Link href={`/products?categoria=${encodeURIComponent(categories[0][0])}`}
                className="lg:col-span-5 product-card group relative rounded-4xl overflow-hidden shadow-red-lg hover-lift cursor-pointer bg-white border border-border block">
                <div className="relative h-[400px] overflow-hidden">
                  <ProductImage src={getCatImage(categories[0][0], categories[0][1])} alt={categories[0][0]}
                    variant="fill" fit={getCatFit(categories[0][1])} padding="24px 24px 140px"
                    imgClassName="product-img transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent pointer-events-none" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="badge mb-3 bg-primary text-white">Mais vendido</span>
                  <h3 className="text-2xl font-bold text-white mb-1">{toUpperText(categories[0][0])}</h3>
                  <p className="text-sm text-white/70">
                    {filteredProducts.filter(p => p.category === categories[0][0]).length} produtos disponíveis
                  </p>
                </div>
              </Link>
            )}

            <div className="lg:col-span-3 grid grid-rows-2 gap-5">
              {[slots[0], slots[1]].filter(Boolean).map(({ category: cat, product: prod, companyId }) => (
                <Link key={cat} href={`/products?categoria=${encodeURIComponent(cat)}`}
                  onClick={companyId ? () => setActiveCompany(companyId as CompanyId) : undefined}
                  className="product-card group relative rounded-4xl overflow-hidden shadow-sm hover-lift cursor-pointer bg-white border border-border block">
                  <div className="relative h-full min-h-[190px] overflow-hidden">
                    <ProductImage src={getCatImage(cat, prod)} alt={cat}
                      variant="fill" fit={getCatFit(prod)} padding="12px 12px 72px"
                      imgClassName="product-img transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent pointer-events-none" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="badge mb-2 bg-surface-2 text-foreground inline-flex items-center gap-1.5">
                      {companyId && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COMPANIES[companyId as CompanyId].primaryColor }} />}
                      {companyId ? COMPANIES[companyId as CompanyId].shortName : 'Destaque'}
                    </span>
                    <h3 className="text-base font-bold text-white">{toUpperText(cat)}</h3>
                  </div>
                </Link>
              ))}
            </div>

            {slots[2] && (
              <Link href={`/products?categoria=${encodeURIComponent(slots[2].category)}`}
                onClick={slots[2].companyId ? () => setActiveCompany(slots[2].companyId as CompanyId) : undefined}
                className="lg:col-span-4 product-card group relative rounded-4xl overflow-hidden shadow-red-lg hover-lift cursor-pointer bg-white border border-border block">
                <div className="relative h-[400px] overflow-hidden">
                  <ProductImage src={getCatImage(slots[2].category, slots[2].product)} alt={slots[2].category}
                    variant="fill" fit={getCatFit(slots[2].product)} padding="24px 24px 120px"
                    imgClassName="product-img transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent pointer-events-none" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="badge mb-3 bg-surface-2 text-foreground inline-flex items-center gap-1.5">
                    {slots[2].companyId && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COMPANIES[slots[2].companyId as CompanyId].primaryColor }} />}
                    {slots[2].companyId ? COMPANIES[slots[2].companyId as CompanyId].shortName : 'Destaque'}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-1">{toUpperText(slots[2].category)}</h3>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Faixa de categorias animada */}
        <CategoryMarquee categories={marqueeCategories} />

        {/* Produtos destaque */}
        {featured.length > 0 && (
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-foreground mb-8">Produtos em Destaque</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product, idx) => (
                <Reveal key={product.id} delay={idx * 0.08} className="h-full">
                <TiltCard className="h-full">
                <div className="bg-white border border-border rounded-4xl overflow-hidden shadow-sm group-hover:shadow-[0_20px_60px_rgba(175,21,24,0.12)] transition-shadow duration-300 h-full">
                  <a href={`/products/${product.id}`} className="block">
                    <ProductImage src={product.image_url} alt={product.name} variant="card"
                      imgClassName="product-img transition-transform duration-700 group-hover:scale-105">
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-white/90 text-foreground text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow">Ver detalhes</span>
                      </div>
                    </ProductImage>
                  </a>
                  <div className="p-5 space-y-3">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-primary">{toUpperText(product.category)}</span>
                    <h4 className="text-sm font-bold text-foreground leading-snug">{toUpperText(product.name)}</h4>
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
                </TiltCard>
                </Reveal>
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
