'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductImage from '@/components/ui/ProductImage';
import AppIcon from '@/components/ui/AppIcon';
import TiltCard from '@/components/ui/TiltCard';
import { toUpperText } from '@/lib/format';
import { supabase, Product } from '@/lib/supabase';
import { usePrices } from '@/context/PriceContext';
import { useCart } from '@/context/CartContext';
import { useCompany, COMPANIES, COMPANY_ORDER, COMPANY_CATEGORIES, CompanyId } from '@/context/CompanyContext';
import toast from 'react-hot-toast';

const PAGE_SIZE = 16;

/** Empresas que vendem um produto: companies[] do cadastro → company → mapa de categorias (fallback). */
function companiesOf(p: Product): CompanyId[] {
  const list = ((p as any).companies as string[] | undefined) ?? [];
  if (list.length > 0) return list.filter((id): id is CompanyId => COMPANY_ORDER.includes(id as CompanyId));
  const single = (p as any).company as string | undefined;
  if (single && COMPANY_ORDER.includes(single as CompanyId)) return [single as CompanyId];
  return COMPANY_ORDER.filter((id) => COMPANY_CATEGORIES[id].some((c) => c.toLowerCase() === p.category.toLowerCase()));
}

/**
 * Qual empresa abrir ao entrar por uma categoria: a que mais tem produtos nela (empate: ordem do grupo).
 * Se a empresa já selecionada (`prefer`) também vende a categoria, ela é mantida.
 */
function companyForCategory(products: Product[], category: string, prefer: CompanyId | null): CompanyId | null {
  const counts: Record<string, number> = {};
  products.filter((p) => p.category === category).forEach((p) => {
    companiesOf(p).forEach((id) => { counts[id] = (counts[id] ?? 0) + 1; });
  });
  if (prefer && counts[prefer] > 0) return prefer;
  const ranked = COMPANY_ORDER.filter((id) => counts[id] > 0)
    .sort((a, b) => counts[b] - counts[a] || COMPANY_ORDER.indexOf(a) - COMPANY_ORDER.indexOf(b));
  return ranked[0] ?? null;
}

// Gateway: obriga usuário a selecionar empresa antes de ver produtos
function CompanyGateway() {
  const { setActiveCompany } = useCompany();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 sm:px-6">
      <div className="text-center mb-10 max-w-xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border mb-6">
          <span className="w-2 h-2 rounded-full bg-[#af1518] animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted">Grupo HC</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
          De qual empresa você deseja ver os produtos?
        </h2>
        <p className="text-muted text-base leading-relaxed">
          Cada empresa do Grupo HC possui seu próprio portfólio especializado. Selecione uma para explorar o catálogo.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
        {COMPANY_ORDER.map((id) => {
          const co = COMPANIES[id];
          return (
            <button key={id} onClick={() => setActiveCompany(id)} data-ripple-color={co.primaryColor}
              className="text-left p-5 sm:p-8 rounded-4xl border-2 hover:-translate-y-1 transition-all duration-300 group bg-white"
              style={{ borderColor: `${co.primaryColor}30` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = co.primaryColor; e.currentTarget.style.boxShadow = `0 20px 60px ${co.primaryColor}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${co.primaryColor}30`; e.currentTarget.style.boxShadow = ''; }}>
              <div className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center text-white font-black text-lg"
                style={{ background: co.gradient }}>
                {co.shortName[0]}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{co.name}</h3>
              <p className="text-[11px] uppercase tracking-widest font-bold mb-3" style={{ color: co.primaryColor }}>{co.segment} · Desde {co.founded}</p>
              <p className="text-sm text-muted leading-relaxed mb-4">
                {co.categories.slice(0, 4).join(', ')}{co.categories.length > 4 ? '...' : ''}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors"
                style={{ color: co.primaryColor }}>
                Ver produtos <AppIcon name="ArrowRightIcon" size={12} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductCatalog() {
  const searchParams                        = useSearchParams();
  const router                              = useRouter();
  const [products, setProducts]             = useState<Product[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState(searchParams.get('categoria') ?? 'Todos');
  const [search, setSearch]                 = useState(searchParams.get('busca') ?? '');
  // A página atual fica na URL (?pagina=N): ao abrir um produto e voltar, o usuário retorna à mesma página
  const [page, setPage]                     = useState(() => Math.max(1, parseInt(searchParams.get('pagina') ?? '1', 10) || 1));
  // Transição entre páginas: o grid some, a tela rola até o topo da lista e o grid reaparece
  const [changing, setChanging]             = useState(false);
  const [lockedHeight, setLockedHeight]     = useState<number | null>(null);
  const gridRef                             = useRef<HTMLDivElement>(null);
  const scrollRafRef                        = useRef<number | null>(null);
  const swapTimerRef                        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseTimerRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showPrices }                      = usePrices();
  const { addToCart }                       = useCart();
  const { activeCompany, company, setActiveCompany, isGrupoView } = useCompany();

  useEffect(() => {
    setLoading(true);
    supabase.from('products').select('*').eq('is_active', true).order('category')
      .then(({ data }) => { setProducts(data ?? []); setLoading(false); });
  }, []);

  useEffect(() => {
    const cat   = searchParams.get('categoria');
    const busca = searchParams.get('busca');
    if (cat)   setActiveCategory(cat);
    if (busca) setSearch(busca);
    setPage(Math.max(1, parseInt(searchParams.get('pagina') ?? '1', 10) || 1));
  }, [searchParams]);

  // Guarda a URL da listagem (com página, categoria e busca) para o "Voltar aos produtos" do produto individual
  useEffect(() => {
    try {
      const qs = searchParams.toString();
      sessionStorage.setItem('catalogReturnUrl', `/products${qs ? '?' + qs : ''}`);
    } catch { /* sessionStorage indisponível */ }
  }, [searchParams]);

  // Entrada por categoria (carrossel, cards, link direto): seleciona sozinho a empresa dessa categoria,
  // sem passar pela tela "De qual empresa você deseja ver os produtos?". Roda uma vez por categoria,
  // então "Trocar empresa" continua funcionando normalmente depois.
  const catParam = searchParams.get('categoria');
  const [handledCat, setHandledCat] = useState<string | null>(null);
  useEffect(() => {
    if (loading || !catParam || catParam === 'Todos' || handledCat === catParam) return;
    const target = companyForCategory(products, catParam, activeCompany);
    if (target && target !== activeCompany) setActiveCompany(target);
    setHandledCat(catParam);
  }, [loading, catParam, handledCat, products, activeCompany, setActiveCompany]);

  // Sem categoria na URL, a entrada por categoria volta a "não tratada" (permite entrar de novo pela mesma)
  useEffect(() => {
    if (!catParam && handledCat) setHandledCat(null);
  }, [catParam, handledCat]);

  // Produtos filtrados por empresa: usa companies[] do produto se disponível,
  // caso contrário usa o mapeamento de categorias como fallback
  const companyFilteredProducts = useMemo(() => {
    if (!activeCompany) return products;
    return products.filter((p) => {
      // 1. Prioridade: campo companies[] do banco (após migration)
      const companies = (p as any).companies as string[] | undefined;
      if (companies && companies.length > 0) {
        return companies.includes(activeCompany);
      }
      // 2. Prioridade: campo company singular do banco
      const company = (p as any).company as string | undefined;
      if (company) return company === activeCompany;
      // 3. Fallback: comparação EXATA por categoria (sem substring)
      const allowedCats = COMPANY_CATEGORIES[activeCompany as CompanyId] ?? [];
      return allowedCats.some(cat => cat.toLowerCase() === p.category.toLowerCase());
    });
  }, [products, activeCompany]);

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(companyFilteredProducts.map((p) => p.category))).sort()],
    [companyFilteredProducts]
  );

  // Ao trocar de empresa (botão da empresa no header, "Trocar empresa"...), uma categoria que a nova
  // empresa não vende não pode continuar filtrando — senão a lista fica vazia ("nenhum produto").
  // Nesse caso volta para "Todos" e tira a categoria da URL, mostrando todos os produtos da empresa.
  // Se a nova empresa vende a categoria, o filtro é mantido. Espera a entrada por categoria ser tratada
  // (escolha automática da empresa) para não competir com ela.
  useEffect(() => {
    if (loading || !activeCompany || activeCategory === 'Todos') return;
    if (catParam && catParam !== 'Todos' && handledCat !== catParam) return;
    if (categories.includes(activeCategory)) return;
    setActiveCategory('Todos');
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categoria');
    params.delete('pagina');
    router.replace(`/products${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
  }, [loading, activeCompany, activeCategory, categories, catParam, handledCat, searchParams, router]);

  const filtered = useMemo(() =>
    companyFilteredProducts.filter((p) => {
      const matchCat    = activeCategory === 'Todos' || p.category === activeCategory;
      const q           = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) ||
                          (p.description ?? '').toLowerCase().includes(q) ||
                          p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    }), [companyFilteredProducts, activeCategory, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = (product: Product) => {
    if (!addToCart(product, activeCompany)) return; // sem login: leva ao login e adiciona depois
    toast.success(`${toUpperText(product.name)} adicionado ao orçamento!`);
  };

  const handleCategoryChange = (cat: string) => {
    if (page !== 1) scrollToGrid();
    setActiveCategory(cat); setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'Todos') params.delete('categoria'); else params.set('categoria', cat);
    params.delete('pagina');
    router.replace(`/products${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
  };

  const handleSearch = (value: string) => {
    setSearch(value); setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('busca', value); else params.delete('busca');
    params.delete('pagina');
    router.replace(`/products${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
  };

  const accentColor = company?.primaryColor ?? '#af1518';

  // Rola até o topo da lista de produtos (não até o topo da página) com easing próprio.
  // Usa behavior:'instant' em cada frame porque o html tem scroll-behavior:smooth —
  // sem isso cada scrollTo vira uma animação do browser brigando com a nossa (daí o "atraso").
  const scrollToGrid = useCallback((instant = false) => {
    const el = gridRef.current;
    if (!el) return;
    const startY  = window.scrollY;
    const targetY = Math.max(0, el.getBoundingClientRect().top + startY - 120); // 120 = altura do header fixo + respiro
    if (startY <= targetY + 4) return; // já está na lista (ou acima dela)

    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    if (instant) {
      window.scrollTo({ top: targetY, behavior: 'instant' as ScrollBehavior });
      return;
    }

    const dist     = startY - targetY;
    const duration = Math.min(550, Math.max(280, dist * 0.35));
    const t0       = performance.now();
    const ease     = (t: number) => 1 - Math.pow(1 - t, 3);

    // Se o usuário mexer na roda/tela durante a animação, ele assume o controle
    const stop = () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    };
    window.addEventListener('wheel', stop, { passive: true, once: true });
    window.addEventListener('touchstart', stop, { passive: true, once: true });

    const step = (now: number) => {
      const progress = Math.min((now - t0) / duration, 1);
      window.scrollTo({ top: startY - dist * ease(progress), behavior: 'instant' as ScrollBehavior });
      scrollRafRef.current = progress < 1 ? requestAnimationFrame(step) : null;
    };
    scrollRafRef.current = requestAnimationFrame(step);
  }, []);

  // Muda de página: fade-out do grid + scroll suave ao mesmo tempo, troca os itens com o grid
  // invisível e faz o fade-in. A altura do grid fica travada durante a troca para o rodapé não "pular".
  const goToPage = (n: number) => {
    if (n === page) return;

    const commit = () => {
      setPage(n);
      const params = new URLSearchParams(searchParams.toString());
      if (n <= 1) params.delete('pagina'); else params.set('pagina', String(n));
      router.replace(`/products${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
    };

    // Quem prefere menos movimento: troca direto, sem animação
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit();
      scrollToGrid(true);
      return;
    }

    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);

    setLockedHeight(gridRef.current?.offsetHeight ?? null);
    setChanging(true);
    scrollToGrid();

    swapTimerRef.current = setTimeout(() => {
      commit();
      // dois frames: garante que os novos cards já foram desenhados (ainda invisíveis) antes do fade-in
      requestAnimationFrame(() => requestAnimationFrame(() => setChanging(false)));
      releaseTimerRef.current = setTimeout(() => setLockedHeight(null), 320);
    }, 170);
  };

  // Limpa timers e animação ao sair da tela
  useEffect(() => () => {
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
  }, []);

  // Página da URL maior que o total (ex.: filtro mudou) volta para a última existente
  useEffect(() => {
    if (!loading && totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [loading, totalPages, page]);

  // Vindo de uma categoria: enquanto a empresa é escolhida automaticamente, mostra só o carregamento
  // (evita piscar a tela de escolha de empresa)
  if (isGrupoView && catParam && catParam !== 'Todos' && handledCat !== catParam) {
    return (
      <div className="pt-40 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Exibe gateway se nenhuma empresa selecionada
  if (isGrupoView) {
    return (
      <div className="pt-24">
        <CompanyGateway />
      </div>
    );
  }

  return (
    <>
      {/* Cabeçalho com identidade da empresa */}
      <div className="pt-28 pb-8 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accentColor}08, white)` }}>
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: company?.gradient }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold" style={{ color: accentColor }}>
              {company?.name}
            </span>
            {/* Trocar empresa — desktop (texto) */}
            <button onClick={() => setActiveCompany(null)}
              className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-muted hover:text-foreground transition-colors border border-border rounded-lg px-2.5 py-1">
              <AppIcon name="ArrowLeftIcon" size={11} />
              Trocar empresa
            </button>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground mb-4">
            Nossos{' '}
            <span className="font-display italic" style={{ color: accentColor }}>Produtos</span>
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base text-muted">
              Qualidade certificada · Entrega em Guanambi e região ·{' '}
              <span className="font-semibold text-foreground">{companyFilteredProducts.length} produtos</span>
            </p>
            {/* Trocar empresa — mobile (botão grande visível) */}
            <button onClick={() => setActiveCompany(null)}
              className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all"
              style={{ borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}08` }}>
              <AppIcon name="ArrowsRightLeftIcon" size={15} />
              Trocar empresa
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            {/* Fixa durante toda a rolagem da seção de produtos: ocupa a altura visível (abaixo do header e acima
                da faixa "Visualizando") e só a lista de categorias rola por dentro. */}
            <div className="sticky top-24 pt-6 flex flex-col gap-2 max-h-[calc(100vh-6rem-6.5rem)]">
            <div className="relative mb-2">
              <AppIcon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Buscar produto..." value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors" />
              {search && (
                <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                  <AppIcon name="XMarkIcon" size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted">Categorias</p>
              <span className="text-[10px] text-muted">{categories.length - 1}</span>
            </div>
            <div className="space-y-1 flex-1 min-h-0 overflow-y-auto scroll-soft pr-1 pb-2">
              {categories.map((cat) => (
                <button key={cat} onClick={() => handleCategoryChange(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    activeCategory === cat ? 'text-white border-transparent shadow-lg' : 'bg-white text-muted border-border hover:border-primary/30 hover:text-primary'
                  }`}
                  style={activeCategory === cat ? { background: company?.gradient, borderColor: 'transparent' } : {}}>
                  <span className="truncate block">{toUpperText(cat)}</span>
                  {cat !== 'Todos' && (
                    <span className={`text-[11px] font-normal ${activeCategory === cat ? 'text-white/70' : 'text-muted/60'}`}>
                      {companyFilteredProducts.filter((p) => p.category === cat).length} produtos
                    </span>
                  )}
                </button>
              ))}
            </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0 pt-6">
            <div className="md:hidden space-y-3 mb-5">
              <div className="relative">
                <AppIcon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" placeholder="Buscar produto..." value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-primary transition-colors" />
              </div>
              {/* Company switcher sticky strip on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => handleCategoryChange(cat)}
                    className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all ${
                      activeCategory === cat ? 'text-white border-transparent' : 'border-border text-muted bg-white'
                    }`}
                    style={activeCategory === cat ? { background: company?.gradient } : {}}>
                    {toUpperText(cat)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <p className="text-[12px] uppercase tracking-widest text-muted font-bold">
                {loading ? 'Carregando...' : `${filtered.length} produto${filtered.length !== 1 ? 's' : ''}`}
                {activeCategory !== 'Todos' && <span style={{ color: accentColor }}> em {toUpperText(activeCategory)}</span>}
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
                <p className="text-muted mt-2">Tente outra busca ou categoria.</p>
                <button onClick={() => { handleCategoryChange('Todos'); handleSearch(''); }}
                  className="mt-6 px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all"
                  style={{ backgroundColor: accentColor }}>
                  Ver todos os produtos
                </button>
              </div>
            ) : (
              <>
                <div
                  ref={gridRef}
                  className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 content-start transition-[opacity,transform] ${
                    changing ? 'opacity-0 translate-y-2 duration-150 ease-in' : 'opacity-100 translate-y-0 duration-300 ease-out'
                  }`}
                  style={lockedHeight ? { minHeight: lockedHeight } : undefined}
                >
                  {paginated.map((product) => (
                    <TiltCard key={product.id} className="h-full">
                    <div className="bg-white border border-border rounded-4xl overflow-hidden shadow-sm group-hover:shadow-[0_20px_60px_rgba(175,21,24,0.12)] transition-shadow duration-300 h-full flex flex-col">
                      <a href={`/products/${product.id}`} className="block flex-shrink-0">
                        <ProductImage src={product.image_url} alt={product.name} variant="card"
                          imgClassName="product-img transition-transform duration-700 group-hover:scale-105">
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="bg-white/90 text-foreground text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow">Ver detalhes</span>
                          </div>
                        </ProductImage>
                      </a>
                      <div className="p-4 space-y-2 flex flex-col flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: accentColor }}>
                            {toUpperText(product.category)}
                          </span>
                          {(() => {
                            const cos = (product as any).companies as string[] | undefined;
                            if (cos && cos.length > 1) {
                              return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">2 empresas</span>;
                            }
                            return null;
                          })()}
                        </div>
                        <h4 className="text-sm font-bold text-foreground leading-snug flex-1">{toUpperText(product.name)}</h4>
                        <p className="text-[11px] text-muted">{product.unit}</p>
                        <div className="flex items-center justify-between pt-1">
                          {showPrices && product.price > 0
                            ? <span className="text-base font-bold text-foreground">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                            : <span className="text-sm text-muted italic">Sob consulta</span>}
                          <button onClick={() => handleAdd(product)}
                            className="px-3 py-1.5 rounded-xl text-white text-[11px] font-bold hover:opacity-90 transition-all"
                            style={{ backgroundColor: accentColor }}>
                            + Orçamento
                          </button>
                        </div>
                      </div>
                    </div>
                    </TiltCard>
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    <button onClick={() => goToPage(Math.max(1, page - 1))} disabled={page === 1}
                      className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all disabled:opacity-40">
                      ← Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .map((n, idx, arr) => (
                        <React.Fragment key={n}>
                          {idx > 0 && arr[idx - 1] !== n - 1 && <span className="px-2 py-2.5 text-muted">…</span>}
                          <button onClick={() => goToPage(n)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${page === n ? 'text-white shadow-lg' : 'border border-border text-muted hover:border-primary hover:text-primary'}`}
                            style={page === n ? { background: company?.gradient } : {}}>
                            {n}
                          </button>
                        </React.Fragment>
                      ))}
                    <button onClick={() => goToPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                      className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all disabled:opacity-40">
                      Próxima →
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
