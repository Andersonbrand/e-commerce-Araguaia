'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import AppIcon from '@/components/ui/AppIcon';
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
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<ProductBrand | null>(null);
  // selectedVariant: map de groupName -> opção selecionada
  const [selectedVariants, setSelectedVariants] = useState<Record<string, SelectedVariant>>({});

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
    // Filtrar regras que afetam este grupo
    const rulesForGroup = variantRules.filter((r) => r.allows.group === group);
    if (rulesForGroup.length === 0) return true; // sem regra → sempre permitido

    // Verificar se alguma seleção atual dispara uma regra para este grupo
    for (const rule of rulesForGroup) {
      const selectedInWhenGroup = selectedVariants[rule.when.group];
      if (selectedInWhenGroup && selectedInWhenGroup.label === rule.when.label) {
        // Regra ativa: só permite os labels listados
        return rule.allows.labels.includes(label);
      }
    }
    // Nenhuma regra ativa → permitido
    return true;
  }, [variantRules, selectedVariants]);

  // Para compatibilidade com CartContext (usa o primeiro grupo selecionado)
  const selectedVariant: SelectedVariant | null = Object.values(selectedVariants)[0] ?? null;
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

  const handleAdd = () => {
    if (!product) return;
    // Verificar se todos os grupos têm uma opção selecionada
    const missingGroup = variantGroups.find((g) => !selectedVariants[g.group]);
    if (missingGroup) {
      toast.error(`Selecione uma opção em "${missingGroup.group}".`);
      return;
    }
    if (brands.length > 0 && !selectedBrand) {
      toast.error('Selecione uma marca antes de adicionar.');
      return;
    }
    for (let i = 0; i < qty; i++) addToCart(
      product,
      activeCompany,
      selectedVariant,
      selectedVariants,
      selectedBrand?.name ?? null,
    );
    const variantSuffix = Object.values(selectedVariants).map((v) => v.label).join(', ');
    const brandSuffix   = selectedBrand ? ` — ${selectedBrand.name}` : '';
    const suffix = [variantSuffix ? ` (${variantSuffix})` : '', brandSuffix].join('');
    toast.success(`${qty}x ${product.name}${suffix} adicionado ao orçamento!`);
  };

  // Preço efetivo: marca > variante com maior preço > preço base
  const variantPrice = Object.values(selectedVariants).find((v) => v.priceDelta > 0)?.priceDelta ?? 0;
  const unitPrice  = (selectedBrand?.price && selectedBrand.price > 0)
    ? selectedBrand.price
    : variantPrice || (product?.price ?? 0);
  const totalPrice = unitPrice * qty;

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
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="pt-40 text-center px-6">
          <p className="text-2xl font-bold text-foreground mb-4">Produto não encontrado</p>
          <button onClick={() => router.push('/products')}
            className="px-6 py-3 text-white rounded-xl font-bold transition-all" style={{ backgroundColor: '#151826' }}>
            Voltar
          </button>
        </div>
        <Footer />
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
            <button onClick={() => router.push('/products')}
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
              <div className="relative aspect-square rounded-4xl overflow-hidden border-2 border-white shadow-red-lg group-hover:shadow-red-xl transition-shadow duration-500 z-10 bg-white">
                <AppImage
                  src={product.image_url ?? '/assets/images/no_image.png'}
                  alt={product.name} fill
                  className="transition-transform duration-700 group-hover:scale-105"
                  style={{ objectFit: 'contain', padding: '32px', backgroundColor: 'white' }}
                  priority
                />
                <div className="absolute top-4 left-4">
                  <span className="badge text-white text-[10px]" style={{ backgroundColor: '#151826' }}>{product.category}</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6 lg:pt-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: '#151826' }}>{product.category}</span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-2 leading-tight">{product.name}</h1>
                <p className="text-muted text-sm mt-1">Unidade: <strong>{product.unit}</strong></p>
              </div>

              {product.description && (
                <p className="text-base text-muted leading-relaxed border-l-2 border-primary/30 pl-4">
                  {product.description}
                </p>
              )}

              {/* Seletores por grupo de variantes */}
              {variantGroups.map(({ group, items }) => {
                const selected = selectedVariants[group] ?? null;
                return (
                  <div key={group} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted">{group}</span>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                      {!selected && (
                        <span className="text-[10px] text-primary font-bold animate-pulse">Selecione uma opção</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {items.map((v) => {
                        const isSelected = selected?.id === v.id;
                        const allowed = isVariantAllowed(group, v.label);
                        // Auto-deselect if currently selected but no longer allowed
                        if (isSelected && !allowed) {
                          setSelectedVariants((prev) => {
                            const { [group]: _, ...rest } = prev;
                            return rest as any;
                          });
                        }
                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={!allowed}
                            onClick={() => {
                              if (!allowed) return;
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [group]: isSelected
                                  ? (({ [group]: _, ...rest }) => rest)(prev) as any
                                  : { id: v.id, label: v.label, priceDelta: v.price_delta },
                              }));
                            }}
                            className="px-4 py-2 rounded-xl border-2 transition-all flex items-baseline gap-1.5"
                            style={{
                              borderColor: !allowed ? '#f0f0f0' : isSelected ? '#af1518' : '#dde3ed',
                              backgroundColor: !allowed ? '#fafafa' : isSelected ? '#af151810' : 'white',
                              color: !allowed ? '#d1d5db' : isSelected ? '#af1518' : '#6b7280',
                              cursor: allowed ? 'pointer' : 'not-allowed',
                              opacity: allowed ? 1 : 0.45,
                            }}
                          >
                            <span className="text-sm font-bold">{v.label}</span>
                            {showPrices && v.price_delta > 0 && (
                              <span className="text-[10px] font-normal opacity-70">
                                R$ {v.price_delta.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

                            {/* Seletor de marca */}
              {brands.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted">Marca</span>
                      <span className="text-[10px] text-muted ml-1.5">· fabricante</span>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    {!selectedBrand && (
                      <span className="text-[10px] text-primary font-bold animate-pulse">Selecione uma opção</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((b) => {
                      const isSelected = selectedBrand?.id === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBrand(isSelected ? null : b)}
                          className="px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2"
                          style={{
                            borderColor: isSelected ? '#af1518' : '#dde3ed',
                            backgroundColor: isSelected ? '#af151810' : 'white',
                            color: isSelected ? '#af1518' : '#6b7280',
                          }}
                        >
                          <span className="text-[11px]">🏷️</span>
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
                </div>
              )}

              {/* Preço */}
              <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-muted font-bold">
                    Preço unitário / {product.unit}
                    {Object.values(selectedVariants).length > 0 && (
                      <span className="ml-2 normal-case text-primary font-bold">
                        — {Object.values(selectedVariants).map((v) => v.label).join(' · ')}
                      </span>
                    )}
                    {selectedBrand && (
                      <span className="ml-2 normal-case text-primary font-bold">🏷️ {selectedBrand.name}</span>
                    )}
                  </p>
                  {qty > 1 && showPrices && unitPrice > 0 && (
                    <span className="text-[11px] text-muted">
                      {qty}x R$ {unitPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                {showPrices && unitPrice > 0 ? (
                  <div className="flex items-end gap-3">
                    <p className="text-4xl font-display font-bold" style={{ color: '#151826' }}>
                      R$ {totalPrice.toFixed(2).replace('.', ',')}
                    </p>
                    {qty > 1 && (
                      <p className="text-sm text-muted mb-1">total</p>
                    )}
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-muted italic">Sob consulta</p>
                )}
              </div>

              {/* Seletor de quantidade + botão */}
              <div className="flex items-center gap-4">
                <QuantityInput value={qty} onChange={setQty} min={1} max={9999} size="md" />

                <button
                  onClick={handleAdd}
                  disabled={
                    variantGroups.some((g) => !selectedVariants[g.group]) ||
                    (brands.length > 0 && !selectedBrand)
                  }
                  className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{ backgroundColor: '#151826', boxShadow: '0 4px 20px #15182640' }}
                >
                  <AppIcon name="ShoppingCartIcon" size={18} />
                  {variantGroups.find((g) => !selectedVariants[g.group])
                    ? `Selecione ${variantGroups.find((g) => !selectedVariants[g.group])!.group}`
                    : brands.length > 0 && !selectedBrand ? 'Selecione uma marca'
                    : 'Adicionar ao Orçamento'}
                </button>
              </div>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/5577981046133?text=Olá! Tenho interesse no produto: ${encodeURIComponent(product.name)}${Object.entries(selectedVariants).map(([g, v]) => `, ${g}: ${v.label}`).join('')}${selectedBrand ? `, marca: ${selectedBrand.name}` : ''}${qty > 1 ? `, quantidade: ${qty}` : ''}`}
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
                    <div className="relative overflow-hidden bg-white" style={{ height: '144px' }}>
                      <AppImage
                        src={rel.image_url ?? '/assets/images/no_image.png'}
                        alt={rel.name} fill
                        className="transition-transform duration-500 group-hover:scale-105"
                        style={{ objectFit: 'contain', padding: '12px' }}
                      />
                    </div>
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
      <Footer />
    </main>
  );
}
