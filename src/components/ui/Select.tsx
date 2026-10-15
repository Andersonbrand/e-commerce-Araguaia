'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AppIcon from '@/components/ui/AppIcon';

/**
 * Select — dropdown próprio da aplicação (substitui o <select> nativo).
 * A lista de opções do <select> nativo segue o visual do navegador e não pode ser estilizada;
 * este componente desenha a lista no padrão do site e funciona com mouse, toque e teclado.
 *
 * Tamanhos:
 *  - md   → campo de formulário (padrão)
 *  - sm   → campo compacto (ex.: regras dentro do cadastro de produto)
 *  - pill → selo clicável (ex.: status da solicitação), use `fit` e `toneClassName`
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Destaca a opção em vermelho (ex.: "+ Nova categoria") */
  accent?: boolean;
  /** Classe de cor de uma bolinha ao lado do texto (ex.: 'bg-green-500') */
  dot?: string;
}

type SelectSize = 'md' | 'sm' | 'pill';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<string | SelectOption>;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  size?: SelectSize;
  /** Largura do conteúdo em vez de 100% */
  fit?: boolean;
  /** Cores do botão (borda/fundo/texto). Quando informado, substitui o visual padrão */
  toneClassName?: string;
  /** Largura mínima da lista, em px (útil quando o botão é estreito) */
  menuMinWidth?: number;
  /** Classes extras do botão */
  className?: string;
  'aria-label'?: string;
}

const SIZE: Record<SelectSize, string> = {
  md:   'px-4 py-3 rounded-xl text-sm',
  sm:   'px-3 py-1.5 rounded-lg text-xs',
  pill: 'px-3 py-1.5 rounded-xl text-[11px] font-bold',
};
const ITEM_SIZE: Record<SelectSize, string> = {
  md:   'px-3 py-2.5 text-sm',
  sm:   'px-3 py-2 text-xs',
  pill: 'px-3 py-2 text-xs',
};

const normalize = (o: string | SelectOption): SelectOption => (typeof o === 'string' ? { value: o, label: o } : o);

export default function Select({
  value, onChange, options, placeholder = 'Selecione...', name, required, disabled,
  size = 'md', fit, toneClassName, menuMinWidth, className = '', ...rest
}: SelectProps) {
  const items = useMemo(() => options.map(normalize), [options]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = items.find((o) => o.value === value);
  const isEmpty = !selected || selected.value === '';
  const label = selected ? selected.label : placeholder;

  const openList = useCallback(() => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const flip = below < 200 && above > below;
    const width = Math.max(rect.width, menuMinWidth ?? 0);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setPos({
      left,
      width,
      maxHeight: Math.max(140, Math.min(288, flip ? above : below)),
      ...(flip ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
    });
    setActive(Math.max(0, items.findIndex((o) => o.value === value)));
    setOpen(true);
  }, [disabled, items, value, menuMinWidth]);

  const close = useCallback(() => setOpen(false), []);

  const choose = (opt: SelectOption) => {
    if (opt.disabled) return;
    if (opt.value !== value) onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Fecha ao clicar fora, rolar a página ou redimensionar a janela
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (listRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open, close]);

  // Mantém a opção ativa visível dentro da lista (ajusta só a rolagem da própria lista)
  useEffect(() => {
    if (!open || active < 0) return;
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    if (!list || !el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = Math.max(0, top - 6);
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 6;
  }, [open, active]);

  const move = (dir: 1 | -1) => {
    if (items.length === 0) return;
    let i = active;
    for (let n = 0; n < items.length; n++) {
      i = (i + dir + items.length) % items.length;
      if (!items[i].disabled) break;
    }
    setActive(i);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); open ? move(1) : openList(); break;
      case 'ArrowUp':   e.preventDefault(); open ? move(-1) : openList(); break;
      case 'Home':      if (open) { e.preventDefault(); setActive(0); } break;
      case 'End':       if (open) { e.preventDefault(); setActive(items.length - 1); } break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) openList();
        else if (active >= 0 && items[active]) choose(items[active]);
        break;
      case 'Escape':    if (open) { e.preventDefault(); e.stopPropagation(); close(); } break;
      case 'Tab':       if (open) close(); break;
      default:
        // digitar a inicial salta para a próxima opção que começa com a letra
        if (e.key.length === 1 && /\S/.test(e.key) && items.length > 0) {
          const k = e.key.toLowerCase();
          const start = open ? active + 1 : 0;
          const order = items.map((_, n) => (start + n) % items.length);
          const hit = order.find((i) => !items[i].disabled && items[i].label.toLowerCase().startsWith(k));
          if (hit !== undefined) { if (!open) openList(); setActive(hit); }
        }
    }
  };

  const tone = toneClassName
    ?? (open ? 'border-primary ring-2 ring-primary/10 bg-white' : 'border-border bg-white hover:border-primary/40');

  return (
    <div className={fit ? 'relative inline-block' : 'relative'}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest['aria-label']}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`${fit ? 'inline-flex' : 'flex w-full'} items-center justify-between gap-2 border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-60 disabled:cursor-not-allowed ${SIZE[size]} ${tone} ${className}`}
      >
        <span className={`truncate ${toneClassName ? '' : isEmpty ? 'text-muted/60' : 'text-foreground'}`}>{label}</span>
        <AppIcon
          name="ChevronDownIcon"
          size={size === 'md' ? 16 : 14}
          className={`shrink-0 transition-transform duration-200 ${toneClassName ? 'opacity-60' : 'text-muted'} ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Campo invisível: faz a validação "required" do formulário funcionar e envia o valor pelo name */}
      {(required || name) && (
        <input
          tabIndex={-1}
          aria-hidden
          name={name}
          required={required}
          value={value}
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />
      )}

      {open && pos && createPortal(
        <div
          ref={listRef}
          role="listbox"
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight, zIndex: 1000 }}
          className="select-menu scroll-soft overflow-y-auto bg-white border border-border rounded-xl shadow-2xl p-1.5"
        >
          {items.length === 0 && <p className="px-3 py-3 text-xs text-muted text-center">Nenhuma opção disponível</p>}
          {items.map((opt, i) => {
            const isSel = opt.value === value;
            return (
              <button
                key={`${opt.value}-${i}`}
                type="button"
                role="option"
                aria-selected={isSel}
                data-idx={i}
                disabled={opt.disabled}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(opt)}
                className={`w-full flex items-center gap-2.5 rounded-lg text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${ITEM_SIZE[size]} ${
                  isSel ? 'bg-primary/8 text-primary font-bold'
                    : opt.accent ? 'text-primary font-bold'
                    : 'text-foreground'
                } ${i === active && !isSel ? 'bg-surface' : ''}`}
              >
                {opt.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />}
                <span className="flex-1 truncate">{opt.label}</span>
                {isSel && <AppIcon name="CheckIcon" size={15} className="shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
