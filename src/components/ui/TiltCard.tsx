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
 * Inclina o card suavemente na direção do mouse e acompanha com um brilho leve.
 * Só ativa em dispositivos com mouse (hover) e respeita prefers-reduced-motion.
 */
export default function TiltCard({ children, className, max = 6 }: TiltCardProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, [reduce]);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 22 });
  const sy = useSpring(py, { stiffness: 220, damping: 22 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const glare = useTransform(
    [sx, sy] as any,
    ([x, y]: number[]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.35), transparent 55%)`
  );
  const glareOpacity = useMotionValue(0);

  if (!enabled) return <div className={className}>{children}</div>;

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  };

  return (
    <div className={className} style={{ perspective: 900 }}>
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => glareOpacity.set(1)}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative h-full will-change-transform"
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-4xl transition-opacity duration-300"
          style={{ background: glare, opacity: glareOpacity }}
        />
      </motion.div>
    </div>
  );
}
