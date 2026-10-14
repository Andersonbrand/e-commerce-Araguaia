'use client';

import React from 'react';
import AppIcon from '@/components/ui/AppIcon';

/**
 * Drawer — "gaveta" recolhível global.
 * Cabeçalho sempre visível (título, quantidade de opções e o valor já escolhido);
 * o conteúdo abre/fecha com animação suave. Usado nas opções do produto
 * (bitola, espessura, marcas…) para não despejar dezenas de botões soltos na tela.
 */
interface DrawerProps {
  title: string;
  /** Texto auxiliar pequeno ao lado do título (ex.: "· fabricante"). */
  subtitle?: string;
  /** Quantidade de itens dentro da gaveta. */
  count?: number;
  /** Valor atual escolhido; aparece como selo no cabeçalho. */
  selectedLabel?: string | null;
  /** Mostra "Selecione" quando nada foi escolhido. */
  required?: boolean;
  open: boolean;
  onToggle: () => void;
  icon?: string;
  children: React.ReactNode;
}

export default function Drawer({
  title, subtitle, count, selectedLabel, required, open, onToggle, icon, children,
}: DrawerProps) {
  const needsChoice = required && !selectedLabel;
  return (
    <div className={`rounded-2xl border transition-colors bg-white ${open ? 'border-primary/30 shadow-sm' : 'border-border hover:border-primary/20'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-2xl"
      >
        {icon && (
          <span className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center shrink-0">
            <AppIcon name={icon} size={16} className="text-muted" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-foreground">{title}</span>
            {subtitle && <span className="text-[10px] text-muted">{subtitle}</span>}
            {typeof count === 'number' && <span className="text-[10px] text-muted">· {count} {count === 1 ? 'opção' : 'opções'}</span>}
          </span>
        </span>
        {selectedLabel ? (
          <span className="max-w-[45%] truncate px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold">
            {selectedLabel}
          </span>
        ) : needsChoice ? (
          <span className="text-[10px] text-primary font-bold">Selecione</span>
        ) : null}
        <AppIcon name="ChevronDownIcon" size={16} className={`text-muted shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
