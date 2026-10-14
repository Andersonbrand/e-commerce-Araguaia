'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import AppIcon from '@/components/ui/AppIcon';

const STEPS = [
  { icon: 'MagnifyingGlassIcon',       title: 'Escolha seus produtos',  text: 'Navegue pelo catálogo e adicione ao orçamento tudo o que a sua obra precisa.' },
  { icon: 'ClipboardDocumentListIcon', title: 'Peça seu orçamento',     text: 'Envie pelo site ou pelo WhatsApp. Nossa equipe responde com valores e condições.' },
  { icon: 'TruckIcon',                 title: 'Receba em Guanambi',     text: 'Combine a entrega e receba os materiais em Guanambi e região.' },
];

const INTERVAL = 2800;

export default function HowItWorks() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Destaca um passo de cada vez, em sequência (pausa ao passar o mouse)
  useEffect(() => {
    if (reduce || !inView || paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), INTERVAL);
    return () => clearInterval(t);
  }, [reduce, inView, paused]);

  return (
    <section className="py-28 bg-surface relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-3">
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary block">Simples e rápido</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05] text-foreground">
            Como comprar em{' '}
            <span className="font-display italic text-gradient-red">3 passos.</span>
          </h2>
        </div>

        <div ref={ref} className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {/* Linha de progresso (desktop): enche conforme o passo ativo avança */}
          <div className="hidden md:block absolute top-[34px] left-[16.66%] right-[16.66%] h-[3px] rounded-full bg-border" aria-hidden>
            <motion.div
              className="h-full rounded-full bg-primary origin-left"
              initial={false}
              animate={{ width: `${(active / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <ol className="grid md:grid-cols-3 gap-10 md:gap-6">
            {STEPS.map((s, i) => {
              const isActive = i === active;
              const done = i < active;
              return (
                <motion.li
                  key={s.title}
                  initial={reduce ? false : { opacity: 0, y: 28 }}
                  animate={inView || reduce ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.7, delay: reduce ? 0 : i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="relative text-center"
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="group w-full flex flex-col items-center focus:outline-none"
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <span className="relative inline-flex">
                      {isActive && !reduce && (
                        <span className="absolute inset-0 rounded-full bg-primary/25 animate-ping" aria-hidden />
                      )}
                      <span
                        className={`relative z-10 w-[68px] h-[68px] rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                          isActive
                            ? 'bg-primary border-primary text-white scale-110 shadow-red-lg'
                            : done
                            ? 'bg-white border-primary text-primary'
                            : 'bg-white border-border text-muted group-hover:border-primary/40'
                        }`}
                      >
                        <AppIcon name={done ? 'CheckIcon' : s.icon} size={28} />
                      </span>
                    </span>

                    <span className={`mt-5 text-[10px] uppercase tracking-[0.3em] font-bold transition-colors ${isActive ? 'text-primary' : 'text-muted'}`}>
                      Passo {i + 1}
                    </span>
                    <span className={`mt-1 text-xl font-bold transition-colors ${isActive ? 'text-foreground' : 'text-foreground/70'}`}>
                      {s.title}
                    </span>
                    <span className={`mt-2 max-w-xs text-sm leading-relaxed transition-opacity duration-500 ${isActive ? 'opacity-100 text-muted' : 'opacity-60 text-muted'}`}>
                      {s.text}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ol>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-4">
          <Link href="/products" className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-red-lg hover:-translate-y-0.5 flex items-center gap-2">
            Começar pelo catálogo
            <AppIcon name="ArrowRightIcon" size={16} />
          </Link>
          <a href="https://wa.me/557734512175" target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 rounded-xl border border-border bg-white text-foreground font-bold text-sm hover:bg-white hover:border-primary/30 transition-all flex items-center gap-2">
            <AppIcon name="ChatBubbleLeftRightIcon" size={18} />
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
