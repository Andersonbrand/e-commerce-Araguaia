'use client';

import Button from '@/components/ui/Button';
import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductImage from '@/components/ui/ProductImage';
import AppIcon from '@/components/ui/AppIcon';
import { useCart } from '@/context/CartContext';
import QuantityInput from '@/components/ui/QuantityInput';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useCompany, COMPANIES, CompanyId } from '@/context/CompanyContext';
import { usePrices } from '@/context/PriceContext';
import toast from 'react-hot-toast';
import { toUpperText } from '@/lib/format';
import { OrderMessageData, whatsappLink } from '@/lib/order-message';

function pluralUnit(unit: string, qty: number): string {
  if (qty <= 1) return unit;
  // Unidades que não mudam no plural
  const noChange = ['kg', 'litro', 'litros', 'metro', 'metros', 'm²', 'm³'];
  if (noChange.includes(unit.toLowerCase())) return unit;
  // Unidades compostas com dimensão numérica (ex: "barra 12m", "chapa 3x1,2m", "painel 6x2,4m")
  // Ficam iguais — não se pluraliza "barra 12m" para "barra 12ms"
  if (/\dm$/.test(unit)) return unit;
  if (unit.endsWith('ão')) return unit.replace(/ão$/, 'ões');
  if (unit.endsWith('al')) return unit.replace(/al$/, 'ais');
  if (unit.endsWith('r') || unit.endsWith('z')) return unit + 'es';
  return unit + 's';
}

interface CheckoutForm { name: string; email: string; phone: string; observation: string; }

type ContactMethod = 'whatsapp' | 'email' | 'site';

const CONTACT_METHODS: { id: ContactMethod; label: string; reply: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp',        reply: 'pelo WhatsApp' },
  { id: 'email',    label: 'E-mail',          reply: 'por e-mail' },
  { id: 'site',     label: 'Pelo nosso site', reply: 'pelo nosso site' },
];

function joinReplies(list: string[]): string {
  if (list.length <= 1) return list[0] ?? '';
  return list.slice(0, -1).join(', ') + ' e ' + list[list.length - 1];
}

export default function CartPage() {
  const { items, totalItems, subtotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const { showPrices } = usePrices();
  const [done, setDone]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>(['whatsapp']);
  const [waUrl, setWaUrl] = useState<string | null>(null);   // link do WhatsApp com a mensagem pronta
  const [form, setForm]           = useState<CheckoutForm>({
    name: user?.user_metadata?.full_name ?? '',
    email: user?.email ?? '',
    phone: '', observation: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // WhatsApp e E-mail podem ser combinados; "Pelo nosso site" é escolha única
  const toggleContactMethod = (id: ContactMethod) =>
    setContactMethods((prev) => {
      if (id === 'site') return prev.includes('site') ? [] : ['site'];
      const base = prev.filter((m) => m !== 'site');
      return base.includes(id) ? base.filter((m) => m !== id) : [...base, id];
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    if (contactMethods.length === 0) {
      toast.error('Escolha como prefere receber o retorno.');
      return;
    }
    const wantsWhatsapp = contactMethods.includes('whatsapp');
    const wantsEmail    = contactMethods.includes('email');
    if (wantsWhatsapp && form.phone.replace(/\D/g, '').length < 10) {
      toast.error('Informe um número de WhatsApp válido, com DDD.');
      return;
    }
    if (wantsEmail && !form.email.trim()) {
      toast.error('Informe o e-mail para o retorno.');
      return;
    }
    if (loading) return; // evita envio duplicado
    setLoading(true);

    // Abre a aba do WhatsApp já no clique (antes de qualquer espera) para o navegador não bloquear;
    // o endereço com a mensagem é colocado nela depois que o pedido for salvo.
    const waWindow = wantsWhatsapp ? window.open('', '_blank') : null;

    try {
      const orderItems = items.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        price: i.product.price + (i.selectedVariant?.priceDelta ?? 0),
        quantity: i.quantity,
        unit: i.product.unit,
        variant_label: i.selectedVariant?.label ?? null,
        companies: (i.product as any).companies ?? [],
      }));
      const observation = form.observation.trim() || null;

      const { data: saved, error } = await supabase.from('orders').insert([{
        user_id: user?.id ?? null,
        items: orderItems,
        total: subtotal,
        customer_name: form.name,
        // e-mail da conta: é por ele que o cliente vê a resposta no perfil
        customer_email: user?.email ?? form.email.trim(),
        customer_phone: wantsWhatsapp ? form.phone.trim() : '',
        contact_email: wantsEmail ? form.email.trim() : null,
        contact_methods: contactMethods,
        observation,
        status: 'pending',
      }]).select('id').single();
      if (error) throw error;

      // Mensagem padrão: informações pessoais (cadastro) + informações solicitadas (carrinho)
      const message: OrderMessageData = {
        accountName: (user?.user_metadata?.full_name as string) || form.name.trim(),
        accountEmail: user?.email ?? form.email.trim(),
        registeredAt: user?.created_at ?? null,
        requestName: form.name.trim(),
        phone: wantsWhatsapp ? form.phone.trim() : null,
        returnEmail: wantsEmail ? form.email.trim() : null,
        methods: contactMethods,
        items: orderItems.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, variant_label: i.variant_label })),
        observation,
      };

      // WhatsApp → abre a conversa com o (77) 3451-2175 com a mensagem pronta
      if (wantsWhatsapp) {
        const url = whatsappLink(message);
        setWaUrl(url);
        if (waWindow) waWindow.location.href = url;
      }

      // E-mail → o servidor envia o resumo para robertaaraguaia10@gmail.com
      let emailFailed = false;
      if (wantsEmail) {
        try {
          const { data: sess } = await supabase.auth.getSession();
          const res = await fetch('/api/enviar-orcamento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sess.session?.access_token ?? ''}` },
            body: JSON.stringify({ orderId: saved?.id }),
          });
          if (!res.ok) throw new Error(`e-mail: HTTP ${res.status}`);
        } catch (err) {
          console.error('Erro ao enviar o e-mail do orçamento:', err);
          emailFailed = true;
        }
      }

      clearCart();
      setDone(true);
      if (emailFailed) {
        toast('Orçamento registrado, mas não conseguimos enviar o e-mail. Nossa equipe verá sua solicitação no painel.', { icon: '⚠️', duration: 6000 });
      } else {
        toast.success('Solicitação de orçamento enviada!');
      }
    } catch (err) {
      // detalhes completos no Console (code/message/details/hint vêm do PostgREST/Postgres)
      const e = err as { code?: string; message?: string; details?: string; hint?: string };
      console.error('Erro ao salvar o orçamento:', { code: e?.code, message: e?.message, details: e?.details, hint: e?.hint });
      waWindow?.close();
      toast.error(`Erro ao enviar. Tente novamente.${e?.code ? ` (código ${e.code})` : ''}`);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <section className="min-h-screen flex items-center justify-center pt-28 pb-16">
          <div className="text-center space-y-6 max-w-md mx-auto px-6">
            <div className="w-24 h-24 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto">
              <AppIcon name="CheckCircleIcon" size={48} className="text-green-500" variant="solid" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Orçamento Solicitado!</h2>
            <p className="text-muted leading-relaxed">
              Nossa equipe retornará em breve {joinReplies(CONTACT_METHODS.filter((m) => contactMethods.includes(m.id)).map((m) => m.reply))} com os valores.
            </p>
            <a href={waUrl ?? 'https://wa.me/557734512175'} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white text-[12px] font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-red-lg">
              <AppIcon name="ChatBubbleLeftRightIcon" size={16} />Falar no WhatsApp
            </a>
            <div><Link href="/products" className="text-sm text-muted hover:text-primary transition-colors font-medium">Continuar visualizando os nossos produtos</Link></div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-white to-white -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Meu Orçamento</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mt-2">Produtos selecionados</h1>
              <p className="text-muted mt-2 text-base">
                {totalItems > 0
                  ? `${totalItems} produto${totalItems > 1 ? 's' : ''} — envie para receber os preços`
                  : 'Sua lista de orçamento está vazia'}
              </p>
            </div>
            {items.length > 0 && (
              <div>
                {!showClearConfirm ? (
                  <button onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all">
                    <AppIcon name="TrashIcon" size={14} />
                    Limpar carrinho
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50">
                    <span className="text-xs font-bold text-red-700">Confirmar?</span>
                    <button onClick={() => { clearCart(); setShowClearConfirm(false); toast.success('Carrinho limpo!'); }}
                      className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                      Sim, limpar
                    </button>
                    <button onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-bold">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {!items.length ? (
            <div className="glass rounded-3xl p-16 text-center border border-primary/8">
              <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto mb-6">
                <AppIcon name="ShoppingCartIcon" size={36} className="text-muted" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Lista vazia</h3>
              <p className="text-muted mb-8">Adicione produtos para solicitar um orçamento.</p>
              <Link href="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white text-[12px] font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-red-lg">
                <AppIcon name="ArrowLeftIcon" size={14} />Ver produtos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lista flat de itens */}
              <div className="lg:col-span-2 space-y-3">
                {items.map((item) => {
                  const { product, quantity, selectedVariant, cartKey } = item;
                  const productCompanies = (product as any).companies as string[] | undefined;
                  const effectivePrice = selectedVariant?.priceDelta || product.price;

                  return (
                    <div key={cartKey} className="rounded-2xl p-4 border border-border flex gap-4 items-start hover-lift bg-white">
                      {/* Imagem */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-[#f0f0f0]">
                        <ProductImage src={product.image_url} alt={product.name} variant="thumb" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {/* Badges de empresa */}
                            {productCompanies && productCompanies.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-1">
                                {productCompanies.map((compId) => {
                                  const co = COMPANIES[compId as CompanyId];
                                  if (!co) return null;
                                  return (
                                    <span
                                      key={compId}
                                      className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                                      style={{ backgroundColor: `${co.primaryColor}15`, color: co.primaryColor }}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: co.primaryColor }} />
                                      {co.shortName}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <h3 className="font-bold text-foreground text-base leading-tight">{toUpperText(product.name)}</h3>

                            {/* Todas as variantes selecionadas, uma por linha */}
                            {item.selectedVariants && Object.keys(item.selectedVariants).length > 0
                              ? Object.entries(item.selectedVariants).map(([group, v]) => (
                                  <p key={group} className="text-[11px] text-primary font-semibold mt-0.5">
                                    {group}: {v.label}
                                  </p>
                                ))
                              : selectedVariant && (
                                  <p className="text-[11px] text-primary font-semibold mt-0.5">
                                    {selectedVariant.label}
                                  </p>
                                )
                            }

                            {/* Marca, se houver */}
                            {item.selectedBrandName && (
                              <p className="text-[11px] text-muted font-semibold mt-0.5">
                                🏷️ {item.selectedBrandName}
                              </p>
                            )}

                            <p className="text-[12px] text-muted mt-0.5">
                              {toUpperText(product.category)} · {product.unit}
                            </p>
                          </div>

                          <button onClick={() => removeFromCart(cartKey)}
                            className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                            <AppIcon name="TrashIcon" size={15} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <QuantityInput
                            value={quantity}
                            onChange={(val) => updateQuantity(cartKey, val)}
                            min={1}
                            size="sm"
                          />
                          <span className="text-sm font-bold text-muted">
                            {(() => {
                              // Se há variante de "Peso", usa o label dela como unidade (ex: "50kg")
                              const pesoVariant = item.selectedVariants?.['Peso'] ?? item.selectedVariants?.['peso'];
                              const displayUnit = pesoVariant ? pesoVariant.label : pluralUnit(product.unit, quantity);
                              return `${quantity} ${displayUnit}`;
                            })()}
                            {showPrices && effectivePrice > 0 && (
                              <span className="ml-2 text-foreground">
                                · R$ {(effectivePrice * quantity).toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Link href="/products" className="inline-flex items-center gap-2 text-[12px] text-muted hover:text-primary font-semibold transition-colors mt-2">
                  <AppIcon name="ArrowLeftIcon" size={14} />Adicionar mais produtos
                </Link>
              </div>

              {/* Formulário de solicitação */}
              <div className="lg:col-span-1">
                <div className="glass rounded-2xl p-6 border border-primary/8 shadow-red-xl sticky top-28">
                  <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted mb-1">Solicitar orçamento</h2>
                  <p className="text-xs text-muted mb-5">{totalItems} produto{totalItems > 1 ? 's' : ''} · retorno em até 4h úteis</p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="text-[10px] text-muted font-medium block mb-1">Nome completo</label>
                      <input type="text" name="name" required value={form.name} onChange={handleChange}
                        placeholder="João da Silva"
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-white/80 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted font-medium block mb-1">Como prefere receber o retorno?</span>
                      <div className="flex flex-wrap gap-2">
                        {CONTACT_METHODS.map((m) => {
                          const active = contactMethods.includes(m.id);
                          return (
                            <button key={m.id} type="button" onClick={() => toggleContactMethod(m.id)}
                              aria-pressed={active}
                              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${active ? 'bg-primary text-white border-primary' : 'bg-white/80 text-muted border-border hover:border-primary/40'}`}>
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {contactMethods.includes('whatsapp') && (
                      <div>
                        <label className="text-[10px] text-muted font-medium block mb-1">Seu WhatsApp (com DDD)</label>
                        <input type="tel" name="phone" required value={form.phone} onChange={handleChange}
                          maxLength={20} placeholder="(77) 9 9999-9999"
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-white/80 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                      </div>
                    )}
                    {contactMethods.includes('email') && (
                      <div>
                        <label className="text-[10px] text-muted font-medium block mb-1">Seu e-mail para o retorno</label>
                        <input type="email" name="email" required value={form.email} onChange={handleChange}
                          maxLength={254} placeholder="joao@email.com"
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-white/80 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                      </div>
                    )}
                    {contactMethods.includes('site') && (
                      <p className="text-[11px] text-muted bg-surface border border-border rounded-xl px-3 py-2.5 leading-relaxed">
                        A resposta com os valores ficará disponível no seu perfil aqui no site, na conta com a qual você está logado.
                      </p>
                    )}
                    <div>
                      <label className="text-[10px] text-muted font-medium block mb-1">Observação (opcional)</label>
                      <textarea name="observation" rows={2} value={form.observation} onChange={handleChange}
                        placeholder="Prazo, endereço de entrega..."
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-white/80 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none" />
                    </div>
                    <Button type="submit" loading={loading}
                      className="w-full mt-1 py-4 rounded-xl bg-primary text-white text-[12px] font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-red-lg disabled:opacity-60 flex items-center justify-center gap-2">
                      <AppIcon name="PaperAirplaneIcon" size={16} />Solicitar Orçamento
                    </Button>
                    <p className="text-[11px] text-muted text-center flex items-center justify-center gap-1 mt-1">
                      <AppIcon name="LockClosedIcon" size={11} />Sem compromisso · retorno em até 4h úteis
                    </p>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
