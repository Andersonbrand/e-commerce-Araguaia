'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductImage from '@/components/ui/ProductImage';
import AppIcon from '@/components/ui/AppIcon';
import Drawer from '@/components/ui/Drawer';
import { createClient } from '@/lib/supabase/client';
import { Product, ProductVariant, ProductBrand } from '@/lib/supabase';
import { usePrices } from '@/context/PriceContext';
import { useCompany } from '@/context/CompanyContext';
import { useCart, SelectedVariant } from '@/context/CartContext';
import QuantityInput from '@/components/ui/QuantityInput';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id }                = useParams<{ id: string }>();
  const router                = useRouter();
  const supabase              = createClient();
  // Volta para a listagem exatamente como estava (página, categoria e busca)
  const backToProducts = () => {
    let url = '/products';
    try { url = sessionStorage.getItem('catalogReturnUrl') || url; } catch { /* ignore */ }
    router.push(url);
  };
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  // Seleção múltipla: cada grupo aceita uma ou mais opções, e as marcas também
  const [selectedBrands, setSelectedBrands] = useState<ProductBrand[]>([]);
  // selectedVariants: groupName -> opções marcadas
  const [selectedVariants, setSelectedVariants] = useState<Record<string, SelectedVariant[]>>({});

  // Derivado: grupos únicos de variantes
  const variantGroups = React.useMemo(() => {
    const map = new Map<string, ProductVariant[]>();
    variants.forEach((v) => {
      if (!map.has(v.variant_group)) map.set(v.variant_group, []);
      map.get(v.variant_group)!.push(v);
    });
    return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
  }, [variants]);

  // Regras de dependência vindas do produto
  const variantRules: Array<{ when: { group: string; label: string }; allows: { group: string; labels: string[] } }> =
    React.useMemo(() => (product as any)?.variant_rules ?? [], [product]);

  // Para um grupo+item, verifica se está permitido pelas regras com base nas seleções atuais
  const isVariantAllowed = React.useCallback((group: string, label: string): boolean => {
    const rulesForGroup = variantRules.filter((r) => r.allows.group === group);
    if (rulesForGroup.length === 0) return true; // sem regra → sempre permitido

    // Regra ativa = alguma das opções marcadas no grupo-gatilho bate com ela
    const active = rulesForGroup.filter((rule) =>
      (selectedVariants[rule.when.group] ?? []).some((v) => v.label === rule.when.label)
    );
    if (active.length === 0) return true;
    // Com várias opções marcadas, vale a união do que cada regra ativa permite
    return active.some((rule) => rule.allows.labels.includes(label));
  }, [variantRules, selectedVariants]);

  // Gavetas: chave = nome do grupo de variantes, ou BRAND_KEY para as marcas
  const BRAND_KEY = '__brand__';
  const [openDrawers, setOpenDrawers] = useState<Record<string, boolean>>({});
  const [optionSearch, setOptionSearch] = useState<Record<string, string>>({});
  const drawerKeys = React.useMemo(
    () => [...variantGroups.map((g) => g.group), ...(brands.length > 0 ? [BRAND_KEY] : [])],
    [variantGroups, brands.length]
  );

  // Ao carregar o produto, abre apenas a primeira gaveta
  useEffect(() => {
    setOpenDrawers(drawerKeys.length > 0 ? { [drawerKeys[0]]: true } : {});
  }, [drawerKeys.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remove seleções que deixaram de ser permitidas pelas regras de combinação
  useEffect(() => {
    let changed = false;
    const next: Record<string, SelectedVariant[]> = {};
    Object.entries(selectedVariants).forEach(([g, list]) => {
      const kept = list.filter((v) => isVariantAllowed(g, v.label));
      if (kept.length !== list.length) changed = true;
      if (kept.length > 0) next[g] = kept;
    });
    if (changed) setSelectedVariants(next);
  }, [selectedVariants, isVariantAllowed]);

  const toggleDrawer = (key: string) => setOpenDrawers((prev) => ({ ...prev, [key]: !prev[key] }));

  // Marca/desmarca uma opção (várias podem ficar marcadas no mesmo grupo)
  const toggleVariant = (group: string, v: ProductVariant) => {
    setSelectedVariants((prev) => {
      const list = prev[group] ?? [];
      const exists = list.some((x) => x.id === v.id);
      const nextList = exists
        ? list.filter((x) => x.id !== v.id)
        : [...list, { id: v.id, label: v.label, priceDelta: v.price_delta }];
      const next = { ...prev };
      if (nextList.length > 0) next[group] = nextList; else delete next[group];
      return next;
    });
  };
  const clearGroup = (group: string) =>
    setSelectedVariants((prev) => { const { [group]: _removed, ...rest } = prev; return rest; });
  const toggleBrand = (b: ProductBrand) =>
    setSelectedBrands((prev) => (prev.some((x) => x.id === b.id) ? prev.filter((x) => x.id !== b.id) : [...prev, b]));

  // Texto do selo no cabeçalho da gaveta
  const selectionSummary = (labels: string[]) =>
    labels.length === 0 ? null : labels.length === 1 ? labels[0] : `${labels.length} selecionadas`;

  const [loading, setLoading] = useState(true);
  const [qty, setQty]         = useState(1);
  const { showPrices }        = usePrices();
  const { activeCompany }     = useCompany();
  const { addToCart }         = useCart();

  useEffect(() => {
    if (!id) return;
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => {
        setProduct(data);
        if (data) {
          Promise.all([
            supabase
              .from('product_variants')
              .select('*')
              .eq('product_id', id)
              .eq('is_active', true)
              .order('sort_order'),
            supabase
              .from('product_brands')
              .select('*')
              .eq('product_id', id)
              .eq('is_active', true)
              .order('sort_order'),
            supabase
              .from('products')
              .select('*')
              .eq('category', data.category)
              .neq('id', id)
              .eq('is_active', true)
              .limit(4),
          ]).then(([{ data: vars }, { data: brnds }, { data: rel }]) => {
            setVariants(vars ?? []);
            setBrands(brnds ?? []);
            setRelated(rel ?? []);
          });
        }
        setLoading(false);
      });
  }, [id]);

  const MAX_LINES = 40;
  const missingGroup = variantGroups.find((g) => !(selectedVariants[g.group]?.length));
  const missingBrand = brands.length > 0 && selectedBrands.length === 0;

  // Cada combinação (uma opção de cada grupo × uma marca) vira uma linha do orçamento.
  // As listas seguem a ordem cadastrada no admin, não a ordem dos cliques.
  const lines = React.useMemo(() => {
    if (!product || missingGroup || missingBrand) return [];
    const groupLists = variantGroups.map((g) => {
      const chosen = selectedVariants[g.group] ?? [];
      return g.items
        .filter((it) => chosen.some((c) => c.id === it.id))
        .map((it) => ({ group: g.group, v: { id: it.id, label: it.label, priceDelta: it.price_delta } as SelectedVariant }));
    });
    let combos: Array<Array<{ group: string; v: SelectedVariant }>> = [[]];
    groupLists.forEach((list) => { combos = combos.flatMap((c) => list.map((item) => [...c, item])); });
    const brandOptions: Array<ProductBrand | null> =
      brands.length > 0 ? brands.filter((b) => selectedBrands.some((s) => s.id === b.id)) : [null];
    return combos.flatMap((c) => brandOptions.map((b) => {
      const variantsMap: Record<string, SelectedVariant> = {};
      c.forEach(({ group, v }) => { variantsMap[group] = v; });
      const variantPrice = c.find(({ v }) => v.priceDelta > 0)?.v.priceDelta ?? 0;
      const unit = b?.price && b.price > 0 ? b.price : variantPrice || product.price || 0;
      return { variantsMap, first: c[0]?.v ?? null, brand: b, unit };
    }));
  }, [product, variantGroups, selectedVariants, brands, selectedBrands, missingGroup, missingBrand]);

  const lineLabel = (ln: { variantsMap: Record<string, SelectedVariant>; brand: ProductBrand | null }) =>
    [Object.values(ln.variantsMap).map((v) => v.label).join(' · '), ln.brand ? ln.brand.name : ''].filter(Boolean).join(' — ');

  const handleAdd = () => {
    if (!product) return;
    if (missingGroup) {
      toast.error(`Selecione ao menos uma opção em "${missingGroup.group}".`);
      return;
    }
    if (missingBrand) {
      toast.error('Selecione ao menos uma marca antes de adicionar.');
      return;
    }
    if (lines.length > MAX_LINES) {
      toast.error(`Você marcou ${lines.length} combinações. Reduza para até ${MAX_LINES} por vez.`);
      return;
    }
    lines.forEach((ln) =>
      addToCart(product, activeCompany, ln.first, ln.variantsMap, ln.brand?.name ?? null, qty)
    );
    if (lines.length > 1) {
      toast.success(`${lines.length} itens de ${product.name} (${qty}x cada) adicionados ao orçamento!`);
    } else {
      const suffix = lines[0] ? ` (${lineLabel(lines[0])})` : '';
      toast.success(`${qty}x ${product.name}${suffix} adicionado ao orçamento!`);
    }
  };

  // Preço: com uma só combinação mostra o unitário; com várias, soma todas as linhas
  const unitPrice  = lines.length === 1 ? lines[0].unit : (product?.price ?? 0);
  const totalPrice = lines.length > 1 ? lines.reduce((sum, l) => sum + l.unit * qty, 0) : unitPrice * qty;
  const allPriced  = lines.length > 1 && lines.every((l) => l.unit > 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="pt-32 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-surface rounded-4xl animate-pulse" />
            <div className="space-y-4 pt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-6 bg-surface rounded-xl animate-pulse" style={{ width: `${80 - i * 10}%` }} />
              ))}
            </div>
          </div>
        </div>
        <Footer compact />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="pt-40 text-center px-6">
          <p className="text-2xl font-bold text-foreground mb-4">Produto não encontrado</p>
          <button onClick={backToProducts}
            className="px-6 py-3 text-white rounded-xl font-bold transition-all" style={{ backgroundColor: '#151826' }}>
            Voltar
          </button>
        </div>
        <Footer compact />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-3 mb-8 text-sm text-muted">
            <button onClick={backToProducts}
              className="flex items-center gap-2 font-semibold hover:text-primary transition-colors group">
              <span className="w-8 h-8 rounded-xl border border-border flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                <AppIcon name="ArrowLeftIcon" size={14} />
              </span>
              Voltar aos produtos
            </button>
            <span className="text-border">›</span>
            <span className="font-medium" style={{ color: '#151826' }}>{product.category}</span>
            <span className="text-border">›</span>
            <span className="text-foreground font-medium truncate max-w-xs">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Imagem com moldura */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-accent/5 rounded-5xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute -top-3 -right-3 w-full h-full border-2 border-primary/15 rounded-4xl z-0" />
              <ProductImage
                src={product.image_url} alt={product.name} variant="detail" priority
                className="rounded-4xl border-2 border-white shadow-red-lg group-hover:shadow-red-xl transition-shadow duration-500 z-10"
                imgClassName="transition-transform duration-700 group-hover:scale-105"
              >
                <div className="absolute top-4 left-4">
                  <span className="badge text-white text-[10px]" style={{ backgroundColor: '#151826' }}>{product.category}</span>
                </div>
              </ProductImage>
            </div>

            {/* Info */}
            <div className="space-y-6 lg:pt-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: '#151826' }}>{product.category}</span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2 leading-tight">{product.name}</h1>
                <p className="text-muted text-sm mt-1">Unidade: <strong>{product.unit}</strong></p>
              </div>

              {product.description && product.description.length <= 160 && (
                <p className="text-base text-muted leading-relaxed border-l-2 border-primary/30 pl-4">
                  {product.description}
                </p>
              )}
              {product.description && product.description.length > 160 && (
                <Drawer
                  title="Especificações"
                  icon="DocumentTextIcon"
                  open={!!openDrawers['__specs__']}
                  onToggle={() => toggleDrawer('__specs__')}
                >
                  <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{product.description}</p>
                </Drawer>
              )}

              {/* Gavetas de opções: uma por grupo (bitola, espessura…) + marcas */}
              {drawerKeys.length > 0 && (
                <div className="space-y-3">
                  {variantGroups.map(({ group, items }) => {
                    const selected = selectedVariants[group] ?? [];
                    const q = (optionSearch[group] ?? '').trim().toLowerCase();
                    const visible = q ? items.filter((v) => v.label.toLowerCase().includes(q)) : items;
                    return (
                      <Drawer
                        key={group}
                        title={group}
                        count={items.length}
                        icon="AdjustmentsHorizontalIcon"
                        required
                        selectedLabel={selectionSummary(selected.map((s) => s.label))}
                        open={!!openDrawers[group]}
                        onToggle={() => toggleDrawer(group)}
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <p className="text-[11px] text-muted">Marque uma ou mais opções</p>
                          {selected.length > 0 && (
                            <button type="button" onClick={() => clearGroup(group)}
                              className="text-[11px] font-bold text-primary hover:underline">
                              Limpar ({selected.length})
                            </button>
                          )}
                        </div>
                        {items.length > 8 && (
                          <input
                            type="text"
                            value={optionSearch[group] ?? ''}
                            onChange={(e) => setOptionSearch((prev) => ({ ...prev, [group]: e.target.value }))}
                            placeholder={`Buscar em ${group.toLowerCase()}...`}
                            className="w-full mb-3"
                          />
                        )}
                        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto scroll-soft p-1 -m-1">
                          {visible.map((v) => {
                            const isSelected = selected.some((s) => s.id === v.id);
                            const allowed = isVariantAllowed(group, v.label);
                            return (
                              <button
                                key={v.id}
                                type="button"
                                disabled={!allowed}
                                aria-pressed={isSelected}
                                onClick={() => { if (allowed) toggleVariant(group, v); }}
                                className="px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-1.5"
                                style={{
                                  borderColor: !allowed ? '#f0f0f0' : isSelected ? '#af1518' : '#dde3ed',
                                  backgroundColor: !allowed ? '#fafafa' : isSelected ? '#af151810' : 'white',
                                  color: !allowed ? '#d1d5db' : isSelected ? '#af1518' : '#6b7280',
                                  cursor: allowed ? 'pointer' : 'not-allowed',
                                  opacity: allowed ? 1 : 0.45,
                                }}
                              >
                                {isSelected && <AppIcon name="CheckIcon" size={14} />}
                                <span className="text-sm font-bold">{v.label}</span>
                                {showPrices && v.price_delta > 0 && (
                                  <span className="text-[10px] font-normal opacity-70">
                                    R$ {v.price_delta.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                          {visible.length === 0 && (
                            <p className="text-xs text-muted italic py-2">Nenhuma opção encontrada para "{optionSearch[group]}".</p>
                          )}
                        </div>
                      </Drawer>
                    );
                  })}

                  {brands.length > 0 && (
                    <Drawer
                      title="Marca"
                      subtitle="· fabricante"
                      count={brands.length}
                      icon="TagIcon"
                      required
                      selectedLabel={selectionSummary(selectedBrands.map((b) => b.name))}
                      open={!!openDrawers[BRAND_KEY]}
                      onToggle={() => toggleDrawer(BRAND_KEY)}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-[11px] text-muted">Marque uma ou mais marcas</p>
                        {selectedBrands.length > 0 && (
                          <button type="button" onClick={() => setSelectedBrands([])}
                            className="text-[11px] font-bold text-primary hover:underline">
                            Limpar ({selectedBrands.length})
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto scroll-soft p-1 -m-1">
                        {brands.map((b) => {
                          const isSelected = selectedBrands.some((s) => s.id === b.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => toggleBrand(b)}
                              className="px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-1.5"
                              style={{
                                borderColor: isSelected ? '#af1518' : '#dde3ed',
                                backgroundColor: isSelected ? '#af151810' : 'white',
                                color: isSelected ? '#af1518' : '#6b7280',
                              }}
                            >
                              {isSelected && <AppIcon name="CheckIcon" size={14} />}
                              <span className="text-sm font-bold">{b.name}</span>
                              {showPrices && b.price > 0 && (
                                <span className="text-[10px] font-normal opacity-70">
                                  R$ {b.price.toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </Drawer>
                  )}
                </div>
              )}

              {/* Preço */}
              <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-muted font-bold">
                    Preço unitário / {product.unit}
                    {lines.length === 1 && lineLabel(lines[0]) && (
                      <span className="ml-2 normal-case text-primary font-bold">— {lineLabel(lines[0])}</span>
                    )}
                    {lines.length > 1 && (
                      <span className="ml-2 normal-case text-primary font-bold">— {lines.length} combinações selecionadas</span>
                    )}
                  </p>
                  {qty > 1 && showPrices && lines.length <= 1 && unitPrice > 0 && (
                    <span className="text-[11px] text-muted">
                      {qty}x R$ {unitPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                {showPrices && (lines.length > 1 ? allPriced : unitPrice > 0) ? (
                  <div className="flex items-end gap-3">
                    <p className="text-4xl font-display font-bold" style={{ color: '#151826' }}>
                      R$ {totalPrice.toFixed(2).replace('.', ',')}
                    </p>
                    {(qty > 1 || lines.length > 1) && (
                      <p className="text-sm text-muted mb-1">total</p>
                    )}
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-muted italic">Sob consulta</p>
                )}

                {lines.length > 1 && (
                  <ul className="mt-3 pt-3 border-t border-border max-h-40 overflow-y-auto scroll-soft space-y-1.5">
                    {lines.map((ln, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-[12px]">
                        <span className="min-w-0 truncate text-foreground">{lineLabel(ln)}</span>
                        {showPrices && (
                          <span className="shrink-0 font-bold text-muted">
                            {ln.unit > 0 ? `R$ ${ln.unit.toFixed(2).replace('.', ',')}` : 'Sob consulta'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Seletor de quantidade + botão */}
              <div className="flex items-center gap-4">
                <QuantityInput value={qty} onChange={setQty} min={1} max={9999} size="md" />

                <button
                  onClick={handleAdd}
                  disabled={!!missingGroup || missingBrand}
                  className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{ backgroundColor: '#151826', boxShadow: '0 4px 20px #15182640' }}
                >
                  <AppIcon name="ShoppingCartIcon" size={18} />
                  {missingGroup
                    ? `Selecione ${missingGroup.group}`
                    : missingBrand ? 'Selecione uma marca'
                    : lines.length > 1 ? `Adicionar ${lines.length} itens ao Orçamento`
                    : 'Adicionar ao Orçamento'}
                </button>
              </div>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/5577981046133?text=Olá! Tenho interesse no produto: ${encodeURIComponent(product.name)}${Object.entries(selectedVariants).map(([g, list]) => `, ${g}: ${list.map((v) => v.label).join(' / ')}`).join('')}${selectedBrands.length > 0 ? `, marca: ${selectedBrands.map((b) => b.name).join(' / ')}` : ''}${qty > 1 ? `, quantidade: ${qty}` : ''}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-sm font-bold text-muted hover:text-primary"
              >
                <AppIcon name="ChatBubbleLeftRightIcon" size={18} />
                Consultar via WhatsApp
              </a>

              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { icon: 'TruckIcon',       label: 'Entrega em Guanambi' },
                  { icon: 'ShieldCheckIcon', label: 'Qualidade garantida' },
                  { icon: 'CheckBadgeIcon',  label: 'Estoque disponível' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 text-[12px] text-muted font-medium">
                    <AppIcon name={item.icon} size={14} className="text-primary" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Produtos relacionados */}
          {related.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Mais em <span style={{ color: '#151826' }}>{product.category}</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {related.map((rel) => (
                  <a key={rel.id} href={`/products/${rel.id}`}
                    className="group bg-white border border-border rounded-3xl overflow-hidden hover-lift shadow-sm block">
                    <ProductImage src={rel.image_url} alt={rel.name} variant="card"
                      imgClassName="transition-transform duration-500 group-hover:scale-105" />
                    <div className="p-4">
                      <p className="text-sm font-bold text-foreground leading-snug">{rel.name}</p>
                      {showPrices && rel.price > 0
                        ? <p className="font-bold text-sm mt-1" style={{ color: '#151826' }}>R$ {rel.price.toFixed(2).replace('.', ',')}</p>
                        : <p className="text-muted text-xs mt-1 italic">Sob consulta</p>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer compact />
    </main>
  );
}
