'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import AppIcon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { Product, ProductVariant } from '@/lib/supabase';
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
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant | null>(null);
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
              .from('products')
              .select('*')
              .eq('category', data.category)
              .neq('id', id)
              .eq('is_active', true)
              .limit(4),
          ]).then(([{ data: vars }, { data: rel }]) => {
            setVariants(vars ?? []);
            setRelated(rel ?? []);
          });
        }
        setLoading(false);
      });
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    if (variants.length > 0 && !selectedVariant) {
      toast.error('Selecione uma espessura antes de adicionar.');
      return;
    }
    for (let i = 0; i < qty; i++) addToCart(product, activeCompany, selectedVariant);
    const variantSuffix = selectedVariant ? ` (${selectedVariant.label})` : '';
    toast.success(`${qty}x ${product.name}${variantSuffix} adicionado ao orçamento!`);
  };

  // Preço efetivo: se a variante tem preço próprio, usa ele; senão usa o preço base do produto
  const unitPrice  = selectedVariant?.priceDelta || (product?.price ?? 0);
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

              {/* Seletor de espessura / variante */}
              {variants.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted">Espessura</span>
                      <span className="text-[10px] text-muted ml-1.5">· milímetros</span>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                    {!selectedVariant && (
                      <span className="text-[10px] text-primary font-bold animate-pulse">Selecione uma opção</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() =>
                            setSelectedVariant(
                              isSelected ? null : { id: v.id, label: v.label, priceDelta: v.price_delta }
                            )
                          }
                          className="px-4 py-2 rounded-xl border-2 transition-all flex items-baseline gap-1.5"
                          style={{
                            borderColor: isSelected ? '#af1518' : '#dde3ed',
                            backgroundColor: isSelected ? '#af151810' : 'white',
                            color: isSelected ? '#af1518' : '#6b7280',
                          }}
                        >
                          <span className="text-sm font-bold">{v.label}</span>
                          <span className="text-[10px] font-normal opacity-70">milímetros</span>
                          {showPrices && v.price_delta > 0 && (
                            <span className="text-[10px] font-normal">
                              (R$ {v.price_delta.toFixed(2).replace('.', ',')})
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
                    {selectedVariant && (
                      <span className="ml-2 normal-case text-primary font-bold">— {selectedVariant.label}</span>
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
                  disabled={variants.length > 0 && !selectedVariant}
                  title={variants.length > 0 && !selectedVariant ? 'Selecione uma espessura' : undefined}
                  className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{ backgroundColor: '#151826', boxShadow: '0 4px 20px #15182640' }}
                >
                  <AppIcon name="ShoppingCartIcon" size={18} />
                  {variants.length > 0 && !selectedVariant ? 'Selecione uma espessura' : 'Adicionar ao Orçamento'}
                </button>
              </div>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/5577981046133?text=Olá! Tenho interesse no produto: ${encodeURIComponent(product.name)}${selectedVariant ? `, espessura: ${selectedVariant.label}` : ''}${qty > 1 ? `, quantidade: ${qty}` : ''}`}
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
