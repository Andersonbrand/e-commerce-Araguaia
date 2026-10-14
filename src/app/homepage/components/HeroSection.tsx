'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import AppImage from '@/components/ui/AppImage';
import AppIcon from '@/components/ui/AppIcon';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Posição do mouse normalizada (-0.5 a 0.5), suavizada por mola
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 20 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 20 });

  // Cada foto se move com uma profundidade diferente (efeito 3D sutil)
  const aX = useTransform(mx, (v) => v * -26);
  const aY = useTransform(my, (v) => v * -26);
  const bX = useTransform(mx, (v) => v * 40);
  const bY = useTransform(my, (v) => v * 40);
  const cX = useTransform(mx, (v) => v * -56);
  const cY = useTransform(my, (v) => v * -56);
  const dX = useTransform(mx, (v) => v * 72);
  const dY = useTransform(my, (v) => v * 72);

  useEffect(() => {
    if (reduce) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      mx.set(nx);
      my.set(ny);
      heroRef.current.querySelectorAll<HTMLElement>('.parallax-blob').forEach((blob, i) => {
        const f = (i + 1) * 0.4;
        blob.style.transform = `translate(${nx * 20 * f}px, ${ny * 20 * f}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reduce, mx, my]);

  // Entrada escalonada (desligada com prefers-reduced-motion)
  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: EASE },
        };

  const pop = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, scale: 0.9, y: 30 },
          animate: { opacity: 1, scale: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden bg-white noise-overlay">
      <div className="parallax-blob absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] transition-transform duration-700 ease-out pointer-events-none" />
      <div className="parallax-blob absolute bottom-[10%] left-[0%] w-[400px] h-[400px] bg-accent/4 rounded-full blur-[120px] transition-transform duration-700 ease-out pointer-events-none" />
      <div className="parallax-blob absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-primary/3 rounded-full blur-[80px] transition-transform duration-700 ease-out pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Esquerda */}
        <div className="lg:col-span-6 space-y-8">
          <motion.div {...enter(0.05)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Guanambi e Região · Bahia</span>
          </motion.div>

          <motion.h1 {...enter(0.15)} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-foreground">
            Tudo que sua{' '}
            <span className="font-display italic text-gradient-red">obra precisa,</span>
            <br />
            com os melhores{' '}
            <span className="font-display italic text-gradient-blue">preços.</span>
          </motion.h1>

          <motion.p {...enter(0.3)} className="text-lg text-muted max-w-lg leading-relaxed">
            Cimento, vergalhões, ferragens e materiais de serralheiro com qualidade garantida.
            A <strong className="text-foreground">Comercial Araguaia</strong> é sua parceira em
            Guanambi para todas as etapas da construção.
          </motion.p>

          <motion.div {...enter(0.45)} className="flex flex-wrap gap-4">
            <a href="https://wa.me/557734512175" target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-red-lg hover:shadow-red-xl hover:-translate-y-0.5 flex items-center gap-2">
              <AppIcon name="ChatBubbleLeftRightIcon" size={18} />
              Falar no WhatsApp
            </a>
            <Link href="/products"
              className="px-8 py-4 rounded-xl border border-border bg-white text-foreground font-bold text-sm hover:bg-surface transition-all hover:border-primary/30">
              Ver Catálogo
            </Link>
            <button
              disabled
              title="Catálogo online do Grupo HC — em breve"
              className="relative px-8 py-4 rounded-xl border border-border bg-surface text-muted font-bold text-sm flex items-center gap-2 cursor-not-allowed opacity-75"
            >
              <AppIcon name="BookOpenIcon" size={18} />
              Catálogo Grupo HC
              <span className="absolute -top-2 -right-2 text-[9px] uppercase tracking-widest font-bold bg-primary text-white px-2 py-0.5 rounded-full leading-none">
                Em breve
              </span>
            </button>
          </motion.div>

          <motion.div {...enter(0.6)} className="flex flex-wrap gap-6 pt-2">
            {[
              { icon: 'CheckBadgeIcon',  label: 'Desde 1990 no mercado' },
              { icon: 'TruckIcon',       label: 'Entrega em Guanambi e região' },
              { icon: 'ShieldCheckIcon', label: 'Qualidade garantida' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-[12px] font-medium text-muted">
                <AppIcon name={item.icon} size={16} className="text-primary" />
                {item.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Direita — colagem com profundidade: cada camada reage ao mouse em intensidade diferente.
            O wrapper externo (motion) cuida da entrada + parallax; o interno mantém o flutuar em CSS. */}
        <div className="lg:col-span-6 relative h-[580px] hidden lg:block">
          <motion.div {...pop(0.2)} style={reduce ? undefined : { x: aX, y: aY }}
            className="absolute top-0 right-0 w-[58%] aspect-[4/5] z-10">
            <div className="relative w-full h-full rounded-4xl overflow-hidden shadow-2xl border border-border/40 animate-float">
              <AppImage src="/assets/images/hero-3.jpg" alt="Metalons" className="product-img w-full h-full object-cover" fill />
            </div>
          </motion.div>

          <motion.div {...pop(0.35)} style={reduce ? undefined : { x: bX, y: bY }}
            className="absolute top-[22%] left-0 w-[48%] aspect-square z-20">
            <div className="relative w-full h-full rounded-4xl overflow-hidden shadow-2xl border border-border/40 animate-float-delay">
              <AppImage src="/assets/images/hero-1.jpg" alt="Materiais de construção" className="product-img w-full h-full object-cover" fill />
            </div>
          </motion.div>

          <motion.div {...pop(0.5)} style={reduce ? undefined : { x: cX, y: cY }}
            className="absolute bottom-[-2%] left-[22%] w-[42%] aspect-[3/4] z-30">
            <div className="relative w-full h-full rounded-4xl overflow-hidden shadow-2xl border border-border/40 animate-float-slow">
              <AppImage src="/assets/images/hero-2.jpg" alt="Sacos de cimento" className="product-img w-full h-full object-cover" fill />
            </div>
          </motion.div>

          {/* Floating card — Desde 1990 (camada mais próxima: move mais) */}
          <motion.div {...pop(0.65)} style={reduce ? undefined : { x: dX, y: dY }}
            className="absolute top-[8%] left-[8%] z-40">
            <div className="glass rounded-2xl px-5 py-4 shadow-red-lg animate-float-delay">
              <p className="text-2xl font-display font-bold text-primary">Desde 1990</p>
              <p className="text-[10px] uppercase tracking-widest text-muted font-bold">Servindo Guanambi</p>
            </div>
          </motion.div>
        </div>

        {/* Mobile hero */}
        <div className="lg:hidden w-full aspect-video rounded-4xl overflow-hidden shadow-2xl">
          <AppImage src="/assets/images/hero-mobile.jpg" alt="Comercial Araguaia" className="w-full h-full object-cover" fill priority />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-[9px] uppercase tracking-[0.3em] text-muted font-bold">Rolar</span>
        <AppIcon name="ChevronDownIcon" size={16} className="text-muted" />
      </div>
    </section>
  );
}
