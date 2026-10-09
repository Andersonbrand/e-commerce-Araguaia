'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppLogo, { GrupoHCLogoFull } from '@/components/ui/AppLogo';
import AppIcon from '@/components/ui/AppIcon';
import ProductModal from './ProductModal';
import QuoteResponseModal from './QuoteResponseModal';
import RequestEditModal from './RequestEditModal';
import { friendlyError } from '@/lib/friendly-error';
import { supabase, Product, Order, Quote } from '@/lib/supabase';
import { usePrices } from '@/context/PriceContext';
import { COMPANIES, COMPANY_ORDER, CompanyId } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type Tab = 'products' | 'quotes';

const CATEGORY_COLORS: Record<string, string> = {
  Cimento:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  Vergalhões:  'bg-blue-50 text-blue-700 border-blue-200',
  Ferragens:   'bg-orange-50 text-orange-700 border-orange-200',
  Serralheria: 'bg-gray-50 text-gray-700 border-gray-200',
};

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-red-50 text-red-700 border-red-200', pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200', delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-50 text-gray-700 border-gray-200', read: 'bg-gray-50 text-gray-600 border-gray-200',
  replied: 'bg-green-50 text-green-700 border-green-200',
};
const STATUS_LABELS: Record<string, string> = {
  new: 'Novo', pending: 'Pendente', confirmed: 'Confirmado',
  delivered: 'Entregue', cancelled: 'Cancelado', read: 'Lido', replied: 'Respondido',
};

interface UnifiedRequest {
  id: string; source: 'cart' | 'form';
  customer_name: string; customer_email: string; customer_phone: string; company?: string | null;
  items?: any[]; total?: number;
  category?: string; message?: string;
  status: string; created_at: string;
}

export default function AdminPanel() {
  const { signOut }                         = useAuth();
  const { showPrices, toggle: togglePrices } = usePrices();
  const [tab, setTab]                       = useState<Tab>('products');
  const [products, setProducts]             = useState<Product[]>([]);
  const [requests, setRequests]             = useState<UnifiedRequest[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch]                 = useState('');
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);
  const [respondingTo, setRespondingTo]     = useState<any | null>(null);
  const [activeCompanyFilter, setActiveCompanyFilter] = useState<CompanyId | 'all'>('all');
  const [togglingPrices, setTogglingPrices] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  // Sidebar / gaveta de categorias
  const [sidebarOpen, setSidebarOpen]       = useState(false);   // gaveta do menu em telas compactas
  const [catDrawerOpen, setCatDrawerOpen]   = useState(false);   // painel lateral de filtro por categoria
  const [catSearch, setCatSearch]           = useState('');
  // Edição de categoria
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue]       = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  // Edição / exclusão de solicitações
  const [editingRequest, setEditingRequest] = useState<UnifiedRequest | null>(null);
  const [deleteRequestTarget, setDeleteRequestTarget] = useState<UnifiedRequest | null>(null);
  const [deletingRequest, setDeletingRequest] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: p }, { data: orders }, { data: quotes }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
    ]);
    setProducts(p ?? []);
    const fromCart: UnifiedRequest[] = (orders ?? []).map((o: Order) => ({
      id: o.id, source: 'cart' as const,
      customer_name: o.customer_name, customer_email: o.customer_email, customer_phone: o.customer_phone,
      items: o.items as any[], total: o.total, status: o.status, created_at: o.created_at,
    }));
    const fromForm: UnifiedRequest[] = (quotes ?? []).map((q: Quote) => ({
      id: q.id, source: 'form' as const,
      customer_name: q.name, customer_email: q.email, customer_phone: q.phone,
      company: q.company, category: q.category, message: q.message,
      status: q.status, created_at: q.created_at,
    }));
    setRequests([...fromCart, ...fromForm].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const filteredProducts = useMemo(() =>
    products.filter((p) => {
      const matchCat     = activeCategory === 'Todos' || p.category === activeCategory;
      const matchSearch  = p.name.toLowerCase().includes(search.toLowerCase());
      const pCompanies = (p as any).companies as string[] | undefined;
      const matchCompany = activeCompanyFilter === 'all' ||
        (pCompanies ? pCompanies.includes(activeCompanyFilter) : (p as any).company === activeCompanyFilter);
      return matchCat && matchSearch && matchCompany;
    }), [products, activeCategory, search, activeCompanyFilter]);

  const pendingCount = requests.filter((r) => r.status === 'new' || r.status === 'pending').length;
  const filteredRequests = useMemo(() =>
    activeCompanyFilter === 'all'
      ? requests
      : requests.filter((r) => (r as any).company === activeCompanyFilter || !((r as any).company)),
    [requests, activeCompanyFilter]);

  const handleTogglePrices = async () => {
    setTogglingPrices(true);
    await togglePrices();
    setTogglingPrices(false);
    toast.success(!showPrices ? 'Preços visíveis ao público.' : 'Preços ocultados — exibindo "Sob consulta".');
  };

  const handleUpdateStatus = async (req: UnifiedRequest, status: string) => {
    const table = req.source === 'cart' ? 'orders' : 'quotes';
    const { data, error } = await supabase.from(table).update({ status }).eq('id', req.id).select('id');
    if (error || !data || data.length === 0) {
      if (error) console.error('[AdminPanel] status:', error);
      toast.error(error ? friendlyError(error, 'atualizar o status') : 'O status não foi alterado. A solicitação pode ter sido removida ou você não tem permissão.');
      return;
    }
    setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status } : r));
    toast.success('Status atualizado!');
  };

  const handleDelete = async (id: string) => {
    const { data, error } = await supabase.from('products').delete().eq('id', id).select('id');
    if (error || !data || data.length === 0) {
      if (error) console.error('[AdminPanel] excluir produto:', error);
      toast.error(error ? friendlyError(error, 'excluir o produto') : 'O produto não foi excluído. Ele pode já ter sido removido ou você não tem permissão.');
      setDeleteConfirm(null);
      return;
    }
    toast.success('Produto removido.');
    setDeleteConfirm(null);
    fetchAll();
  };

  const handleDeleteCategory = async (cat: string) => {
    // Move todos os produtos dessa categoria para 'Outros' e remove a categoria
    const { error } = await supabase.from('products').update({ category: 'Outros' }).eq('category', cat);
    if (error) {
      console.error('[AdminPanel] excluir categoria:', error);
      toast.error(friendlyError(error, 'excluir a categoria'));
      return;
    }
    toast.success(`Categoria "${cat}" removida. Produtos movidos para "Outros".`);
    setDeletingCategory(null);
    if (activeCategory === cat) setActiveCategory('Todos');
    fetchAll();
  };

  // Renomear categoria: atualiza a categoria de todos os produtos que a usam
  const startRenameCategory = (cat: string) => {
    setDeletingCategory(null);
    setRenamingCategory(cat);
    setRenameValue(cat);
  };

  const handleRenameCategory = async (oldName: string) => {
    const newName = renameValue.trim().replace(/\s+/g, ' ');
    if (!newName) { toast.error('Informe o novo nome da categoria.'); return; }
    if (newName.length > 50) { toast.error('O nome da categoria pode ter no máximo 50 caracteres.'); return; }
    if (newName.toLowerCase() === 'todos') { toast.error('"Todos" é um nome reservado para o filtro. Escolha outro nome.'); return; }
    if (newName === oldName) { setRenamingCategory(null); return; }
    const existing = categories.find((c) => c !== 'Todos' && c !== oldName && c.toLowerCase() === newName.toLowerCase());
    if (existing) {
      toast.error(`Já existe a categoria "${existing}". Para juntar as duas, exclua uma delas: os produtos vão para "Outros" e podem ser reclassificados.`);
      return;
    }
    setSavingCategory(true);
    const { error } = await supabase.from('products').update({ category: newName }).eq('category', oldName);
    setSavingCategory(false);
    if (error) {
      console.error('[AdminPanel] renomear categoria:', error);
      toast.error(friendlyError(error, 'renomear a categoria'));
      return;
    }
    toast.success(`Categoria renomeada para "${newName}".`);
    if (activeCategory === oldName) setActiveCategory(newName);
    setRenamingCategory(null);
    fetchAll();
  };

  // Excluir solicitação (e as respostas já enviadas para ela)
  const handleDeleteRequest = async () => {
    if (!deleteRequestTarget) return;
    const req = deleteRequestTarget;
    setDeletingRequest(true);
    try {
      const table = req.source === 'cart' ? 'orders' : 'quotes';
      const { data, error } = await supabase.from(table).delete().eq('id', req.id).select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('A solicitação não foi excluída. Ela pode já ter sido removida, ou falta liberar a exclusão no banco (execute src/lib/admin-request-delete.sql no Supabase).', { duration: 8000 });
        return;
      }
      // Remove respostas vinculadas (não bloqueia caso a policy ainda não exista)
      await supabase.from('quote_responses').delete().eq('request_id', req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success('Solicitação excluída.');
      setDeleteRequestTarget(null);
    } catch (err: any) {
      console.error('[AdminPanel] excluir solicitação:', err);
      toast.error(friendlyError(err, 'excluir a solicitação'));
    } finally {
      setDeletingRequest(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    fetchAll();
  };

  const navItems: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'products', label: 'Produtos',     icon: 'Squares2X2Icon' },
    { id: 'quotes',   label: 'Solicitações', icon: 'DocumentTextIcon', badge: pendingCount || undefined },

  ];

  const openNewProduct = () => { setEditingProduct(null); setModalOpen(true); };

  // Conteúdo do sidebar (usado no desktop e na gaveta das telas compactas)
  const renderSidebar = (afterAction?: () => void) => {
    const done = () => afterAction?.();
    const realCategories = categories.filter((c) => c !== 'Todos');
    return (
      <>
        <div className="p-5 border-b border-border flex-shrink-0">
          <GrupoHCLogoFull width={160} />
          <p className="text-[9px] uppercase tracking-[0.25em] text-muted font-bold mt-2">Painel Administrativo</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setTab(item.id); done(); }}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors text-left ${
                tab === item.id ? 'bg-primary/8 border border-primary/15 text-primary' : 'text-muted hover:bg-surface hover:text-foreground'
              }`}>
              <AppIcon name={item.icon} size={18} />
              <span className="text-sm font-bold">{item.label}</span>
              {item.badge ? <span className="ml-auto text-[10px] bg-primary text-white rounded-full px-2 py-0.5 font-bold">{item.badge}</span> : null}
            </button>
          ))}

          {/* Ferramentas de produtos: novo produto, categorias e filtro */}
          {tab === 'products' && (
            <div className="pt-4 mt-4 border-t border-border/40 space-y-2">
              <p className="px-1 text-[9px] uppercase tracking-[0.25em] font-bold text-muted">Catálogo</p>

              <button onClick={() => { openNewProduct(); done(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all shadow-red-lg">
                <AppIcon name="PlusIcon" size={16} />
                Novo Produto
              </button>

              <button onClick={() => { setShowCatManager(true); done(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border text-[13px] font-bold text-muted hover:bg-surface hover:text-foreground transition-all">
                <AppIcon name="TagIcon" size={16} className="shrink-0" />
                <span className="whitespace-nowrap">Gerenciar categorias</span>
                <span className="ml-auto text-[10px] bg-surface-2 text-muted rounded-full px-2 py-0.5 font-bold">{realCategories.length}</span>
              </button>

              {/* Abre o painel lateral de categorias */}
              <button onClick={() => { setCatSearch(''); setCatDrawerOpen(true); }} aria-expanded={catDrawerOpen}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  activeCategory !== 'Todos' ? 'border-primary/30 bg-primary/5' : catDrawerOpen ? 'border-primary/30 bg-surface' : 'border-border hover:bg-surface'
                }`}>
                <AppIcon name="FunnelIcon" size={16} className={activeCategory !== 'Todos' ? 'text-primary' : 'text-muted'} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-foreground leading-tight whitespace-nowrap">Filtrar por categoria</p>
                  <p className="text-[10px] text-muted truncate">{activeCategory === 'Todos' ? 'Todas as categorias' : activeCategory}</p>
                </div>
                <AppIcon name="ChevronRightIcon" size={14} className="text-muted shrink-0" />
              </button>
            </div>
          )}

          <div className="pt-4 mt-4 border-t border-border/40">
            <Link href="/homepage"
              className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-muted hover:bg-surface hover:text-foreground transition-colors">
              <AppIcon name="HomeIcon" size={18} />
              <span className="text-sm font-bold">Voltar ao Site</span>
            </Link>
          </div>
        </nav>

        {/* Toggle preços + sair */}
        <div className="p-4 border-t border-border space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
            <div>
              <p className="text-[11px] font-bold text-foreground">Exibir preços</p>
              <p className="text-[10px] text-muted">{showPrices ? 'Visível ao público' : 'Oculto — Sob consulta'}</p>
            </div>
            <button onClick={handleTogglePrices} disabled={togglingPrices}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${showPrices ? 'bg-primary' : 'bg-border'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${showPrices ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <button onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:bg-red-50 hover:text-primary transition-colors">
            <AppIcon name="ArrowLeftEndOnRectangleIcon" size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar (desktop) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-border z-40 hidden desk:flex flex-col">
        {renderSidebar()}
      </aside>

      {/* Sidebar (telas compactas) — abre como gaveta lateral */}
      {sidebarOpen && (
        <div className="desk:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85vw] h-full bg-white border-r border-border flex flex-col shadow-2xl">
            {renderSidebar(() => setSidebarOpen(false))}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="desk:ml-64 min-h-screen">
        <header className="bg-white border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground">{navItems.find((n) => n.id === tab)?.label}</h1>
            <p className="text-[11px] text-muted uppercase tracking-widest hidden sm:block">Painel Administrativo</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile: back to site + tab switcher */}
            <div className="desk:hidden flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[11px] font-bold text-muted hover:bg-surface transition-all">
                <AppIcon name="Bars3Icon" size={16} />
                <span className="hidden sm:inline">Menu</span>
              </button>
              <Link href="/homepage"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-[11px] font-bold text-muted hover:bg-surface transition-all">
                <AppIcon name="HomeIcon" size={14} />
                <span className="hidden sm:inline">Voltar ao Site</span>
              </Link>
              {navItems.map((item) => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold relative ${tab === item.id ? 'bg-primary text-white' : 'bg-surface text-muted'}`}>
                  {item.label}
                  {item.badge ? <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center">{item.badge}</span> : null}
                </button>
              ))}
            </div>

          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 desk:grid-cols-3 gap-4">
            {[
              { label: 'Total Produtos',       value: products.length,                       icon: 'CubeIcon',        color: 'text-primary',   bg: 'bg-primary/8' },
              { label: 'Produtos Ativos',      value: products.filter(p => p.is_active).length, icon: 'CheckCircleIcon', color: 'text-green-600', bg: 'bg-green-50'  },
              { label: 'Solicitações Abertas', value: pendingCount,                           icon: 'DocumentTextIcon',color: 'text-primary',   bg: 'bg-primary/8' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <AppIcon name={stat.icon} size={22} className={stat.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{loading ? '—' : stat.value}</p>
                  <p className="text-[11px] text-muted font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* PRODUTOS */}
          {tab === 'products' && (
            <>
              {/* Seletor de empresa */}
              <div className="bg-white border border-border rounded-2xl p-4 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted mr-1">Empresa:</span>
                <button onClick={() => setActiveCompanyFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${activeCompanyFilter === 'all' ? 'bg-foreground text-white border-foreground' : 'border-border text-muted hover:border-foreground/30 bg-white'}`}>
                  Todas
                </button>
                {COMPANY_ORDER.map((id) => {
                  const co = COMPANIES[id];
                  const isSelected = activeCompanyFilter === id;
                  return (
                    <button key={id} onClick={() => setActiveCompanyFilter(id)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5"
                      style={{
                        backgroundColor: isSelected ? co.primaryColor : 'white',
                        color: isSelected ? 'white' : co.primaryColor,
                        borderColor: isSelected ? co.primaryColor : `${co.primaryColor}40`,
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? 'white' : co.primaryColor }} />
                      {co.shortName}
                    </button>
                  );
                })}
              </div>

              <div className="bg-white border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted">Categoria:</span>
                  {activeCategory === 'Todos' ? (
                    <button onClick={() => { setCatSearch(''); setCatDrawerOpen(true); }}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-border text-muted hover:border-primary/40 transition-all">
                      Todas · escolher categoria
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-xl bg-primary text-white text-[11px] font-bold uppercase tracking-widest">
                      {activeCategory}
                      <button onClick={() => setActiveCategory('Todos')} aria-label="Limpar filtro de categoria"
                        className="w-5 h-5 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center">
                        <AppIcon name="XMarkIcon" size={12} />
                      </button>
                    </span>
                  )}
                  <span className="text-[11px] text-muted">{filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="relative w-full sm:w-60 shrink-0">
                  <AppIcon name="MagnifyingGlassIcon" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="text" placeholder="Buscar produto..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>

              <div className="bg-white border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                <div className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-3 bg-surface border-b border-border text-[10px] uppercase tracking-[0.2em] font-bold text-muted min-w-[520px]">
                  <div className="col-span-4">Produto</div>
                  <div className="col-span-2 hidden md:block">Categoria</div>
                  <div className="col-span-2 hidden desk:block">Preço</div>
                  <div className="col-span-1 hidden desk:block">Estoque</div>
                  <div className="col-span-2 hidden md:block">Status</div>
                  <div className="col-span-4 md:col-span-2 desk:col-span-1 text-right">Ações</div>
                </div>
                {loading ? <div className="p-8 text-center text-muted">Carregando...</div>
                  : filteredProducts.length === 0 ? (
                    <div className="text-center py-16"><p className="font-bold text-foreground">Nenhum produto encontrado</p></div>
                  ) : filteredProducts.map((product) => (
                    <div key={product.id} className="admin-row grid grid-cols-12 gap-4 px-6 py-4 border-b border-border/60 last:border-b-0 items-center transition-colors">
                      <div className="col-span-8 md:col-span-4 flex items-center gap-3 min-w-0">
                        {/* Imagem clicável → página do produto */}
                        <a href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer"
                          className="w-10 h-10 rounded-xl overflow-hidden bg-surface shrink-0 hover:ring-2 hover:ring-primary transition-all">
                          <img src={product.image_url ?? '/assets/images/no_image.png'} alt={product.name} className="w-full h-full object-contain p-1" />
                        </a>
                        <div className="min-w-0">
                          <a href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-bold text-foreground truncate hover:text-primary transition-colors block">
                            {(product as any).is_featured && <span className="text-amber-500 mr-1">⭐</span>}
                            {product.name}
                          </a>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[11px] text-muted">{product.unit}</p>
                            {(() => {
                              const pCos = (product as any).companies as string[] | undefined;
                              const coIds = pCos?.length ? pCos : [(product as any).company].filter(Boolean);
                              return coIds.length ? (
                                <div className="flex gap-1">
                                  {coIds.map((cid: string) => {
                                    const co = COMPANIES[cid as CompanyId];
                                    return co ? (
                                      <span key={cid} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: `${co.primaryColor}15`, color: co.primaryColor }}>
                                        {co.shortName}
                                      </span>
                                    ) : null;
                                  })}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 hidden md:block">
                        <span className={`badge border text-[10px] ${CATEGORY_COLORS[product.category] ?? 'bg-surface text-muted border-border'}`}>{product.category}</span>
                      </div>
                      <div className="col-span-2 hidden desk:block">
                        <p className="text-sm font-bold text-foreground">{product.price > 0 ? `R$ ${product.price.toFixed(2).replace('.', ',')}` : 'Sob consulta'}</p>
                      </div>
                      <div className="col-span-1 hidden desk:block">
                        <p className={`text-sm font-bold ${product.stock < 50 ? 'text-primary' : 'text-foreground'}`}>{product.stock}</p>
                      </div>
                      <div className="col-span-2 hidden md:flex items-center gap-2">
                        <button onClick={() => handleToggleActive(product)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${product.is_active ? 'bg-primary' : 'bg-border'}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${product.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                        <span className="text-[11px] text-muted">{product.is_active ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      <div className="col-span-4 md:col-span-2 desk:col-span-1 flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingProduct(product); setModalOpen(true); }}
                          className="w-8 h-8 rounded-xl bg-primary/8 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                          <AppIcon name="PencilSquareIcon" size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(product.id)}
                          className="w-8 h-8 rounded-xl bg-red-50 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                          <AppIcon name="TrashIcon" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>{/* fim overflow-x-auto */}
              </div>
            </>
          )}

          {/* SOLICITAÇÕES */}
          {tab === 'quotes' && (
            <div className="space-y-4">
              {/* Seletor de empresa nas solicitações */}
              <div className="bg-white border border-border rounded-2xl p-4 flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted mr-1">Filtrar por empresa:</span>
                <button onClick={() => setActiveCompanyFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${activeCompanyFilter === 'all' ? 'bg-foreground text-white border-foreground' : 'border-border text-muted bg-white'}`}>
                  Todas
                </button>
                {COMPANY_ORDER.map((id) => {
                  const co = COMPANIES[id];
                  const isSelected = activeCompanyFilter === id;
                  return (
                    <button key={id} onClick={() => setActiveCompanyFilter(id)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5"
                      style={{
                        backgroundColor: isSelected ? co.primaryColor : 'white',
                        color: isSelected ? 'white' : co.primaryColor,
                        borderColor: isSelected ? co.primaryColor : `${co.primaryColor}40`,
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? 'white' : co.primaryColor }} />
                      {co.shortName}
                    </button>
                  );
                })}
              </div>
              {loading ? <div className="bg-white border border-border rounded-2xl p-8 text-center text-muted">Carregando...</div>
                : requests.length === 0 ? (
                  <div className="bg-white border border-border rounded-2xl p-16 text-center">
                    <AppIcon name="DocumentTextIcon" size={48} className="text-muted mx-auto mb-4" />
                    <p className="font-bold text-foreground text-lg">Nenhuma solicitação ainda</p>
                  </div>
                ) : filteredRequests.map((req) => (
                  <div key={req.id} className={`bg-white border rounded-2xl p-4 sm:p-6 transition-all ${req.status === 'new' || req.status === 'pending' ? 'border-primary/20 shadow-red-lg' : 'border-border'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-foreground text-base">{req.customer_name}</p>
                          <span className={`badge text-[9px] border ${req.source === 'cart' ? 'bg-accent/8 text-accent border-accent/20' : 'bg-primary/8 text-primary border-primary/20'}`}>
                            {req.source === 'cart' ? '🛒 Carrinho' : '📝 Formulário'}
                          </span>
                          <span className={`badge text-[9px] border ${STATUS_STYLES[req.status] ?? 'bg-surface text-muted border-border'}`}>{STATUS_LABELS[req.status] ?? req.status}</span>
                        </div>
                        <p className="text-sm text-muted">{req.customer_email} · {req.customer_phone}</p>
                        {req.company && <p className="text-sm text-muted">Empresa: {req.company}</p>}
                        <p className="text-[11px] text-muted">{new Date(req.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {req.total != null && req.total > 0 && <span className="text-lg font-bold text-primary">R$ {req.total.toFixed(2).replace('.', ',')}</span>}
                        <select value={req.status} onChange={(e) => handleUpdateStatus(req, e.target.value)}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${STATUS_STYLES[req.status] ?? 'bg-surface border-border text-muted'}`}>
                          {req.source === 'cart'
                            ? <><option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="delivered">Entregue</option><option value="cancelled">Cancelado</option></>
                            : <><option value="new">Novo</option><option value="read">Lido</option><option value="replied">Respondido</option></>}
                        </select>
                      </div>
                      {/* Ações: responder, editar, excluir */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setRespondingTo(req)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/8 text-primary text-[11px] font-bold hover:bg-primary hover:text-white transition-all border border-primary/20"
                        >
                          <AppIcon name="PaperAirplaneIcon" size={13} />
                          Responder
                        </button>
                        <button onClick={() => setEditingRequest(req)} title="Editar solicitação" aria-label="Editar solicitação"
                          className="w-8 h-8 rounded-xl bg-primary/8 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                          <AppIcon name="PencilSquareIcon" size={14} />
                        </button>
                        <button onClick={() => setDeleteRequestTarget(req)} title="Excluir solicitação" aria-label="Excluir solicitação"
                          className="w-8 h-8 rounded-xl bg-red-50 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center">
                          <AppIcon name="TrashIcon" size={14} />
                        </button>
                      </div>
                    </div>
                    {req.source === 'cart' && req.items && (
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Itens solicitados</p>
                        <div className="flex flex-wrap gap-2">
                          {req.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 text-sm">
                              <span className="font-bold text-foreground">{item.quantity}×</span>
                              <span className="text-foreground">{item.name}</span>
                              <span className="text-muted text-[11px]">/ {item.unit}</span>
                              {item.price > 0 && <span className="text-primary font-bold text-[11px] ml-1">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {req.source === 'form' && (
                      <div className="space-y-2">
                        {req.category && <div className="flex items-center gap-2"><span className="text-[10px] uppercase tracking-widest font-bold text-muted">Categoria:</span><span className="text-sm font-medium text-foreground">{req.category}</span></div>}
                        {req.message && <div className="bg-surface rounded-xl p-4 text-sm text-foreground leading-relaxed">{req.message}</div>}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-red-xl border border-border">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <AppIcon name="TrashIcon" size={28} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-center text-foreground mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-muted text-center mb-8">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-surface transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {respondingTo && (
        <QuoteResponseModal
          request={respondingTo}
          onClose={() => setRespondingTo(null)}
          onSent={() => { setRespondingTo(null); fetchAll(); }}
        />
      )}

      {/* Painel lateral de categorias (abre ao lado do sidebar; em telas compactas cobre o menu) */}
      {catDrawerOpen && tab === 'products' && (
        <>
          <div className="fixed inset-0 z-[55] bg-black/10 desk:bg-black/5" onClick={() => setCatDrawerOpen(false)} />
          <aside role="dialog" aria-label="Filtrar por categoria"
            className="cat-panel fixed top-0 bottom-0 left-0 desk:left-64 z-[60] w-72 max-w-[85vw] bg-white border-r border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10">
                  <AppIcon name="FunnelIcon" size={16} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground leading-tight">Categorias</h2>
                  <p className="text-[10px] text-muted">{categories.length - 1} cadastradas</p>
                </div>
              </div>
              <button onClick={() => setCatDrawerOpen(false)} aria-label="Fechar painel de categorias"
                className="p-1.5 rounded-lg hover:bg-surface">
                <AppIcon name="XMarkIcon" size={18} className="text-muted" />
              </button>
            </div>

            <div className="p-3 border-b border-border flex-shrink-0">
              <div className="relative">
                <AppIcon name="MagnifyingGlassIcon" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input autoFocus type="text" value={catSearch} onChange={(e) => setCatSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setCatDrawerOpen(false)}
                  placeholder="Buscar categoria..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-sm placeholder:text-muted focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>

            {/* Única área com rolagem do painel */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {(() => {
                const q = catSearch.trim().toLowerCase();
                const visible = categories.filter((c) => c === 'Todos' || !q || c.toLowerCase().includes(q));
                if (visible.length === 1 && q) {
                  return <p className="px-3 py-6 text-center text-xs text-muted">Nenhuma categoria encontrada para "{catSearch}".</p>;
                }
                return visible.map((cat) => {
                  const count = cat === 'Todos' ? products.length : products.filter((p) => p.category === cat).length;
                  const active = activeCategory === cat;
                  return (
                    <button key={cat}
                      onClick={() => { setActiveCategory(cat); setCatDrawerOpen(false); setSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-[13px] font-bold transition-colors ${
                        active ? 'bg-primary text-white' : 'text-foreground hover:bg-surface'
                      }`}>
                      <span className="truncate">{cat === 'Todos' ? 'Todas as categorias' : cat}</span>
                      <span className={`text-[11px] shrink-0 ${active ? 'text-white/80' : 'text-muted'}`}>{count}</span>
                    </button>
                  );
                });
              })()}
            </div>

            <div className="p-3 border-t border-border flex-shrink-0">
              <button onClick={() => { setCatDrawerOpen(false); setSidebarOpen(false); setShowCatManager(true); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-[12px] font-bold text-muted hover:bg-surface hover:text-foreground transition-colors">
                <AppIcon name="PencilSquareIcon" size={14} />
                Editar categorias
              </button>
            </div>
          </aside>
        </>
      )}

      {editingRequest && (
        <RequestEditModal
          request={editingRequest}
          onClose={() => setEditingRequest(null)}
          onSaved={() => { setEditingRequest(null); fetchAll(); }}
        />
      )}

      {deleteRequestTarget && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-red-xl border border-border">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <AppIcon name="TrashIcon" size={28} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-center text-foreground mb-2">Excluir solicitação?</h3>
            <p className="text-sm text-muted text-center mb-1">
              Solicitação de <span className="font-bold text-foreground">{deleteRequestTarget.customer_name}</span>.
            </p>
            <p className="text-sm text-muted text-center mb-8">As respostas já enviadas para ela também serão removidas. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteRequestTarget(null)} disabled={deletingRequest}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-surface transition-colors">Cancelar</button>
              <button onClick={handleDeleteRequest} disabled={deletingRequest}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-60">
                {deletingRequest ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Categorias */}
      {showCatManager && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: '68px' }}
          onClick={(e) => e.target === e.currentTarget && setShowCatManager(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: 'calc(100dvh - 76px)' }}>
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
                  <AppIcon name="TagIcon" size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-foreground">Gerenciar Categorias</h2>
                  <p className="text-[11px] text-muted">{categories.filter(c => c !== 'Todos').length} categorias cadastradas</p>
                </div>
              </div>
              <button onClick={() => { setShowCatManager(false); setRenamingCategory(null); setDeletingCategory(null); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <AppIcon name="XMarkIcon" size={18} className="text-muted" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              <p className="text-xs text-muted mb-3">
                Renomear uma categoria atualiza todos os produtos dela. Ao excluir, os produtos são movidos para "Outros".
              </p>
              {categories.filter(cat => cat !== 'Todos').map((cat) => {
                const count = products.filter(p => p.category === cat).length;
                const isDeleting = deletingCategory === cat;
                const isRenaming = renamingCategory === cat;
                const isDefault  = cat === 'Outros';
                return (
                  <div key={cat} className="p-3 rounded-xl border border-border bg-white hover:bg-surface transition-colors">
                    {isRenaming ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} maxLength={50}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCategory(cat); if (e.key === 'Escape') setRenamingCategory(null); }}
                          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-primary bg-white text-sm focus:outline-none" />
                        <button onClick={() => handleRenameCategory(cat)} disabled={savingCategory}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark transition-colors disabled:opacity-60">
                          {savingCategory ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button onClick={() => setRenamingCategory(null)}
                          className="px-3 py-1.5 rounded-lg border border-border text-muted text-[11px] font-bold hover:bg-surface transition-colors">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          <span className="text-sm font-bold text-foreground truncate">{cat}</span>
                          <span className="text-[11px] text-muted shrink-0">{count} produto{count !== 1 ? 's' : ''}</span>
                        </div>
                        {!isDeleting ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => startRenameCategory(cat)} disabled={isDefault}
                              title={isDefault ? 'Categoria padrão não pode ser renomeada' : 'Renomear categoria'}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted text-[11px] font-bold hover:bg-white hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                              <AppIcon name="PencilSquareIcon" size={12} />
                              Editar
                            </button>
                            <button onClick={() => { setRenamingCategory(null); setDeletingCategory(cat); }} disabled={isDefault}
                              title={isDefault ? 'Categoria padrão não pode ser excluída' : 'Excluir categoria'}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                              <AppIcon name="TrashIcon" size={12} />
                              {isDefault ? 'Padrão' : 'Excluir'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-red-600 font-bold">Confirmar?</span>
                            <button onClick={() => handleDeleteCategory(cat)}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition-colors">
                              Sim
                            </button>
                            <button onClick={() => setDeletingCategory(null)}
                              className="px-2.5 py-1 rounded-lg border border-border text-muted text-[11px] font-bold hover:bg-surface transition-colors">
                              Não
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-border flex-shrink-0">
              <button onClick={() => setShowCatManager(false)}
                className="w-full py-2.5 rounded-xl border border-border text-sm font-bold text-muted hover:bg-surface transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <ProductModal
          product={editingProduct}
          categories={Array.from(new Set(products.map((p) => p.category)))}
          onSave={() => { setModalOpen(false); fetchAll(); }}
          onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}
