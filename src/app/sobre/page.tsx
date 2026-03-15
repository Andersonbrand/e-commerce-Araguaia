'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import AppIcon from '@/components/ui/AppIcon';
import AppLogo from '@/components/ui/AppLogo';

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('opacity-100', 'translate-y-0'); el.classList.remove('opacity-0', 'translate-y-10'); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

export default function SobrePage() {
  const r1 = useReveal(); const r2 = useReveal(); const r3 = useReveal();
  const r4 = useReveal(); const r5 = useReveal(); const r6 = useReveal();

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-[60vh] flex items-end pb-20 pt-32 overflow-hidden">
        <div className="absolute inset-0">
          <AppImage src="/assets/images/about/estoque.jpg" alt="Estoque Comercial Araguaia" fill
            className="object-cover object-center scale-105 transition-transform duration-[10s] hover:scale-100" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/20" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/60 mb-3 block">Nossa História</span>
            <h1 className="text-6xl md:text-7xl font-bold text-white leading-[1.02] tracking-tight mb-6">
              Construindo{' '}
              <span className="font-display italic" style={{ color: '#af1518' }}>relações</span>
              <br />sólidas desde 1990.
            </h1>
            <p className="text-lg text-white/80 max-w-xl leading-relaxed">
              Mais de três décadas abastecendo obras em Guanambi e toda região com materiais de qualidade,
              preços justos e atendimento que faz diferença.
            </p>
          </div>
        </div>
      </section>

      {/* ── MISSÃO + IMAGEM LATERAL ── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div ref={r1} className="grid lg:grid-cols-2 gap-20 items-center opacity-0 translate-y-10 transition-all duration-1000">
            {/* Texto */}
            <div className="space-y-8">
              <div>
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Quem Somos</span>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-3 leading-tight">
                  Uma empresa construída{' '}
                  <span className="font-display italic text-gradient-red">com propósito.</span>
                </h2>
              </div>
              <p className="text-lg text-muted leading-relaxed">
                A <strong className="text-foreground">Comercial Araguaia</strong> nasceu em Guanambi, Bahia, com a missão de democratizar o acesso
                a materiais de construção de qualidade no interior da Bahia. Desde 1990, construímos nossa história
                ao lado de construtores, empreiteiros e famílias que confiam em nossos produtos.
              </p>
              <p className="text-base text-muted leading-relaxed">
                Com mais de 25 anos de mercado, somos referência regional em cimento, vergalhões,
                ferragens e materiais de serralheria — sempre com os melhores preços da região e
                atendimento técnico especializado.
              </p>
              <div className="grid grid-cols-2 gap-5 pt-4">
                {[
                  { value: '25+', label: 'Anos de mercado',    color: 'text-primary' },
                  { value: '5k+', label: 'Clientes ativos',    color: 'text-accent'  },
                  { value: '800+',label: 'Produtos no estoque',color: 'text-primary' },
                  { value: '90%', label: 'Clientes satisfeitos',color: 'text-accent' },
                ].map((stat) => (
                  <div key={stat.label} className="p-5 rounded-2xl bg-surface border border-border">
                    <p className={`text-3xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[11px] uppercase tracking-widest text-muted font-bold mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Imagem com moldura */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/10 to-accent/5 rounded-5xl blur-3xl" />
              {/* Moldura decorativa */}
              <div className="absolute -top-4 -right-4 w-full h-full border-2 border-primary/20 rounded-4xl z-0" />
              <div className="relative z-10 rounded-4xl overflow-hidden shadow-red-xl border-2 border-white aspect-[4/5] group">
                <AppImage src="/assets/images/about/sacos-cimento.jpg" alt="Produtos Comercial Araguaia — sacos de cimento" fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105" />
                {/* Badge flutuante */}
                <div className="absolute bottom-6 left-6 glass rounded-2xl px-5 py-3 shadow-red-lg">
                  <div className="flex items-center gap-3">
                    <AppLogo size={28} />
                    <div>
                      <p className="text-[11px] font-bold text-foreground">Melhor preço</p>
                      <p className="text-[10px] text-muted">da região</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IMAGEM FULL WIDTH ── */}
      <section ref={r2} className="relative h-[500px] overflow-hidden opacity-0 translate-y-10 transition-all duration-1000">
        <AppImage src="/assets/images/about/fachada.jpg" alt="Fachada da Comercial Araguaia em Guanambi" fill
          className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/30 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-xl">
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/60 mb-3">Nosso Espaço</p>
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                Estrutura completa para atender sua obra.
              </h2>
              <p className="text-white/80 text-base leading-relaxed">
                Mais de 800 produtos em estoque, prontos para entrega imediata em Guanambi e região.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALORES ── */}
      <section className="py-28 bg-surface/40">
        <div className="max-w-7xl mx-auto px-6">
          <div ref={r3} className="text-center mb-16 opacity-0 translate-y-10 transition-all duration-1000">
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Nossos Valores</span>
            <h2 className="text-4xl font-bold text-foreground mt-3">O que nos move</h2>
          </div>
          <div ref={r4} className="grid md:grid-cols-3 gap-8 opacity-0 translate-y-10 transition-all duration-1000 delay-200">
            {[
              { icon: 'TruckIcon',       title: 'Logística Ágil',       desc: 'Frota própria para entregas pontuais em obras de qualquer porte em Guanambi e região.' },
              { icon: 'CubeIcon',        title: 'Estoque Garantido',    desc: 'Mais de 800 SKUs sempre disponíveis. Você não para sua obra por falta de material.' },
              { icon: 'UserGroupIcon',   title: 'Atendimento Técnico',  desc: 'Equipe especializada para auxiliar na escolha dos materiais certos para cada projeto.' },
              { icon: 'ShieldCheckIcon', title: 'Qualidade Certificada',desc: 'Trabalhamos apenas com marcas líderes: Brasilit, Gerdau, CSN, Simec e ArcelorMittal.' },
              { icon: 'HandThumbUpIcon', title: 'Preço Justo',          desc: 'Negociação direta com fabricantes para garantir o melhor preço da região sempre.' },
              { icon: 'HeartIcon',       title: 'Compromisso',          desc: 'Nossa relação com o cliente vai além da venda — estamos presentes em cada etapa da obra.' },
            ].map((item) => (
              <div key={item.title} className="group p-7 rounded-3xl bg-white border border-border hover:border-primary/20 hover:shadow-red-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-2xl bg-primary/8 group-hover:bg-primary flex items-center justify-center mb-5 transition-colors">
                  <AppIcon name={item.icon} size={22} className="text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMAGEM VERGALHÕES FULL WIDTH ── */}
      <section ref={r5} className="relative h-[420px] overflow-hidden opacity-0 translate-y-10 transition-all duration-1000">
        <AppImage src="/assets/images/about/vergalhoes.jpg" alt="Vergalhões e perfis metálicos Comercial Araguaia" fill
          className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-l from-foreground/70 via-foreground/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-end">
          <div className="max-w-7xl mx-auto px-6 w-full flex justify-end">
            <div className="max-w-md text-right">
              <h2 className="text-4xl font-bold text-white leading-tight mb-3">
                Vergalhões e perfis metálicos com qualidade Gerdau e ArcelorMittal.
              </h2>
              <Link href="/products?categoria=Vergalhões"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-foreground text-sm font-bold hover:bg-surface transition-all mt-4">
                Ver produtos
                <AppIcon name="ArrowRightIcon" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CEO ── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div ref={r6} className="grid lg:grid-cols-12 gap-16 items-start opacity-0 translate-y-10 transition-all duration-1000">
            {/* Imagem CEO com moldura */}
            <div className="lg:col-span-4 relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-transparent rounded-5xl blur-2xl" />
              {/* Moldura dupla */}
              <div className="absolute -top-3 -left-3 w-full h-full border-2 border-primary/15 rounded-4xl" />
              <div className="absolute -bottom-3 -right-3 w-full h-full border border-accent/10 rounded-4xl" />
              <div className="relative rounded-4xl overflow-hidden border-2 border-white shadow-red-xl group aspect-[3/4]">
                <AppImage src="/assets/images/about/ceo.jpg" alt="Fundador e CEO da Comercial Araguaia" fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-103" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="glass rounded-2xl px-4 py-3">
                    <p className="text-sm font-bold text-foreground">Fundador & CEO</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted">Comercial Araguaia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Texto CEO */}
            <div className="lg:col-span-8 space-y-8 lg:pt-8">
              <div>
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Liderança</span>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mt-3 leading-tight">
                  Uma visão construída{' '}
                  <span className="font-display italic text-gradient-red">tijolo por tijolo.</span>
                </h2>
              </div>

              <blockquote className="relative pl-6 border-l-4 border-primary/30">
                <p className="text-xl text-muted leading-relaxed italic font-display">
                  "Quando fundei a Comercial Araguaia, meu objetivo era simples: oferecer o material certo,
                  na hora certa, com o preço justo. Três décadas depois, esse compromisso continua sendo
                  nossa maior entrega."
                </p>
              </blockquote>

              <div className="space-y-4 text-base text-muted leading-relaxed">
                <p>
                  Com mais de 25 anos à frente da Comercial Araguaia, o fundador construiu uma das empresas
                  mais respeitadas no setor de materiais de construção em Guanambi e região, transformando um
                  pequeno comércio em uma referência regional.
                </p>
                <p>
                  Sua visão estratégica permitiu estabelecer parcerias diretas com as maiores siderúrgicas e
                  fabricantes do Brasil — Gerdau, CSN, ArcelorMittal, Brasilit — garantindo aos clientes
                  sempre o melhor preço e disponibilidade de estoque.
                </p>
                <p>
                  Além dos negócios, é reconhecido pelo comprometimento com o desenvolvimento econômico de
                  Guanambi, gerando empregos e fomentando a construção civil na região.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { icon: 'CalendarIcon',    label: 'Fundador desde 1990' },
                  { icon: 'MapPinIcon',      label: 'Guanambi, Bahia' },
                  { icon: 'BuildingOfficeIcon', label: '25+ anos de liderança' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-sm font-medium text-muted">
                    <AppIcon name={item.icon} size={16} className="text-primary" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4">Pronto para começar sua obra?</h2>
          <p className="text-white/80 text-lg mb-10">Entre em contato conosco e solicite um orçamento sem compromisso.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="https://wa.me/5577981046133" target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl bg-white text-primary font-bold hover:bg-surface transition-all shadow-lg flex items-center gap-2">
              <AppIcon name="ChatBubbleLeftRightIcon" size={18} />
              Falar no WhatsApp
            </a>
            <Link href="/products"
              className="px-8 py-4 rounded-xl border-2 border-white/40 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2">
              <AppIcon name="Squares2X2Icon" size={18} />
              Ver Catálogo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
