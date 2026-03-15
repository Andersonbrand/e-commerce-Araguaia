'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import AppIcon from '@/components/ui/AppIcon';
import { supabase, Product } from '@/lib/supabase';
import { usePrices } from '@/context/PriceContext';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

const PAGE_SIZE = 16;

export default function ProductCatalog() {
  const searchParams                        = useSearchParams();
  const router                              = useRouter();
  const [products, setProducts]             = useState<Product[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('categoria') ?? 'Todos');
  const [search, setSearch]                 = useState(searchParams.get('busca') ?? '');
  const [page, setPage]                     = useState(1);
  const { showPrices }                      = usePrices();
  const { addToCart }                       = useCart();

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).order('category')
      .then(({ data }) => { setProducts(data ?? []); setLoading(false); });
  }, []);

  useEffect(() => {
    const cat   = searchParams.get('categoria');
    const busca = searchParams.get('busca');
    if (cat)   setActiveCategory(cat);
    if (busca) setSearch(busca);
  }, [searchParams]);

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(products.map((p) => p.category))).sort()],
    [products]
  );

  const filtered = useMemo(() =>
    products.filter((p) => {
      const matchCat    = activeCategory === 'Todos' || p.category === activeCategory;
      const q           = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) ||
                          (p.description ?? '').toLowerCase().includes(q) ||
                          p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    }), [products, activeCategory, search]);

  // Paginação
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} adicionado ao orçamento!`);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'Todos') params.delete('categoria');
    else params.set('categoria', cat);
    router.replace(`/products${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('busca', value);
    else params.delete('busca');
    router.replace(`/products${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
  };

  return (
    <>
      {/* Cabeçalho */}
      <div className="pt-32 pb-10 bg-gradient-to-b from-surface to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Catálogo Completo</span>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground mt-3 mb-4">
            Nossos <span className="font-display italic text-gradient-red">Produtos</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl">
            Qualidade certificada · Entrega em Guanambi e região ·{' '}
            <span className="font-semibold text-foreground">{products.length} produtos</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex gap-8">

          {/* ── SIDEBAR ── */}
          <aside className="hidden md:flex flex-col gap-2 w-56 shrink-0 pt-6">
            {/* Busca */}
            <div className="relative mb-2">
              <AppIcon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Buscar produto..." value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors" />
              {search && (
                <button onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                  <AppIcon name="XMarkIcon" size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted">Categorias</p>
              <span className="text-[10px] text-muted">{categories.length - 1}</span>
            </div>

            <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <button key={cat} onClick={() => handleCategoryChange(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    activeCategory === cat
                      ? 'bg-primary text-white border-primary shadow-red-lg'
                      : 'bg-white text-muted border-border hover:border-primary/30 hover:text-primary'
                  }`}>
                  <span className="truncate block">{cat}</span>
                  {cat !== 'Todos' && (
                    <span className={`text-[11px] font-normal ${activeCategory === cat ? 'text-white/70' : 'text-muted/60'}`}>
                      {products.filter((p) => p.category === cat).length} produtos
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* ── GRID ── */}
          <div className="flex-1 min-w-0 pt-6">

            {/* Busca + filtros mobile */}
            <div className="md:hidden space-y-3 mb-5">
              <div className="relative">
                <AppIcon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" placeholder="Buscar produto..." value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => handleCategoryChange(cat)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all ${
                      activeCategory === cat ? 'bg-primary text-white border-primary' : 'border-border text-muted bg-white'
                    }`}>{cat}</button>
                ))}
              </div>
            </div>

            {/* Barra de resultado */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-[12px] uppercase tracking-widest text-muted font-bold">
                {loading ? 'Carregando...' : `${filtered.length} produto${filtered.length !== 1 ? 's' : ''}`}
                {activeCategory !== 'Todos' && <span className="text-primary"> em {activeCategory}</span>}
                {search && <span> para "{search}"</span>}
              </p>
              {(activeCategory !== 'Todos' || search) && (
                <button onClick={() => { handleCategoryChange('Todos'); handleSearch(''); }}
                  className="text-[11px] text-muted hover:text-primary transition-colors flex items-center gap-1 font-medium">
                  <AppIcon name="XMarkIcon" size={12} />
                  Limpar filtros
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 16 }).map((_, i) => <div key={i} className="bg-surface rounded-4xl h-72 animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <AppIcon name="FaceFrownIcon" size={48} className="text-muted mx-auto mb-4" />
                <p className="text-xl font-bold text-foreground">Nenhum produto encontrado</p>
                <p className="text-muted mt-2">Tente outra busca ou selecione outra categoria.</p>
                <button onClick={() => { handleCategoryChange('Todos'); handleSearch(''); }}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all">
                  Ver todos os produtos
                </button>
              </div>
            ) : (
              <>
                {/* Grid 4 colunas — 16 por página */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paginated.map((product) => (
                    <div key={product.id} className="product-card group bg-white border border-border rounded-3xl overflow-hidden hover-lift shadow-sm flex flex-col">
                      {/* Imagem → página do produto */}
                      <a href={`/products/${product.id}`} className="relative h-44 overflow-hidden bg-surface block flex-shrink-0">
                        <AppImage src={product.image_url ?? '/assets/images/no_image.png'} alt={product.name} fill
                          className="product-img object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white/95 text-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow">
                            Ver detalhes
                          </span>
                        </div>
                      </a>
                      <div className="p-4 flex flex-col flex-1 gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-primary truncate">{product.category}</span>
                          <span className="text-[10px] text-muted shrink-0 ml-1">/ {product.unit}</span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{product.name}</h3>
                        <div className="flex items-center justify-between pt-1.5 mt-auto">
                          {showPrices && product.price > 0
                            ? <span className="text-base font-bold text-foreground">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                            : <span className="text-xs font-semibold text-muted italic">Sob consulta</span>}
                          <button onClick={() => handleAdd(product)}
                            className="ml-auto px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary-dark transition-all shadow-sm">
                            + Orçamento
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted hover:border-primary/40 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <AppIcon name="ChevronLeftIcon" size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      Math.abs(p - page) <= 2 || p === 1 || p === totalPages ? (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border ${
                            p === page ? 'bg-primary text-white border-primary shadow-red-lg' : 'border-border text-muted hover:border-primary/40 hover:text-primary'
                          }`}>
                          {p}
                        </button>
                      ) : Math.abs(p - page) === 3 ? (
                        <span key={p} className="text-muted px-1">…</span>
                      ) : null
                    ))}

                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted hover:border-primary/40 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <AppIcon name="ChevronRightIcon" size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
