'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** atraso em segundos (use para escalonar itens de uma lista) */
  delay?: number;
  /** deslocamento vertical inicial em px */
  y?: number;
  /** direção de entrada: 'up' (padrão), 'left' ou 'right' */
  from?: 'up' | 'left' | 'right';
}

/**
 * Faz o conteúdo aparecer suavemente (fade + deslocamento curto) ao entrar na tela.
 * Dispara uma única vez e respeita prefers-reduced-motion.
 */
export default function Reveal({ children, className, delay = 0, y = 28, from = 'up' }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const initial =
    from === 'left' ? { opacity: 0, x: -y } : from === 'right' ? { opacity: 0, x: y } : { opacity: 0, y };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
