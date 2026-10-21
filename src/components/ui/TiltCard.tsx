'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** inclinação máxima em graus (padrão 6 — sutil e profissional) */
  max?: number;
}

/**
 * Inclina o card suavemente na direção do mouse, levanta 4px e acompanha com um brilho leve.
 * Só ativa em dispositivos com mouse (hover) e respeita prefers-reduced-motion.
 *
 * IMPORTANTE (evita o "tremor" em telas grandes): os eventos do mouse e o cálculo da posição ficam na
 * caixa EXTERNA, que nunca se move. Antes o cálculo usava a caixa do próprio elemento que gira — e, como
 * a inclinação muda essa caixa, a posição do mouse mudava junto, realimentando o movimento (quanto maior
 * o card, maior o efeito, principalmente perto da parte de baixo). O levantamento de 4px também passou a
 * ser feito aqui, e não por :hover no card que se move, pelo mesmo motivo.
 * A caixa externa também é o `group`: efeitos group-hover dos filhos (zoom da imagem, "Ver detalhes")
 * dependem dela, não do card em movimento.
 */
export default function TiltCard({ children, className = '', max = 6 }: TiltCardProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, [reduce]);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const hover = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 220, damping: 22 });
  const sy = useSpring(py, { stiffness: 220, damping: 22 });
  const lift = useSpring(hover, { stiffness: 260, damping: 26 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const y = useTransform(lift, [0, 1], [0, -4]);
  const glare = useTransform(
    [sx, sy] as any,
    ([x, yy]: number[]) => `radial-gradient(circle at ${x * 100}% ${yy * 100}%, rgba(255,255,255,0.35), transparent 55%)`
  );
  const glareOpacity = useTransform(lift, [0, 1], [0, 1]);

  if (!enabled) return <div className={`group ${className}`}>{children}</div>;

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect(); // caixa externa: estável, não gira
    if (!r) return;
    px.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    py.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };
  const onEnter = () => hover.set(1);
  const onLeave = () => { px.set(0.5); py.set(0.5); hover.set(0); };

  return (
    <div
      ref={ref}
      className={`group ${className}`}
      style={{ perspective: 900 }}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, y, transformStyle: 'preserve-3d' }}
        className="relative h-full will-change-transform"
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-4xl"
          style={{ background: glare, opacity: glareOpacity }}
        />
      </motion.div>
    </div>
  );
}
