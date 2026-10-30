'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/lib/supabase';

export interface SelectedVariant {
  id: string;
  label: string;
  priceDelta: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedFromCompany?: string | null;
  selectedVariant?: SelectedVariant | null;       // legado (primeiro grupo)
  selectedVariants?: Record<string, SelectedVariant>; // todos os grupos: { "Espessura": {...}, "Peso": {...} }
  selectedBrandName?: string | null;              // nome da marca selecionada
  cartKey: string; // `${product.id}:${ids das opções}` (+ `:${marca}` quando houver)
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD'; product: Product; company?: string | null; variant?: SelectedVariant | null; allVariants?: Record<string, SelectedVariant>; brandName?: string | null; quantity?: number }
  | { type: 'REMOVE'; cartKey: string }
  | { type: 'UPDATE_QTY'; cartKey: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] };

// A chave considera TODAS as opções escolhidas e a marca: combinações diferentes
// (ex.: mesma espessura com marcas distintas) viram linhas separadas no carrinho.
// Para um produto com uma única variante e sem marca, a chave continua `${produto}:${variante}`.
function makeCartKey(
  productId: string,
  allVariants?: Record<string, SelectedVariant> | null,
  fallbackVariantId?: string | null,
  brandName?: string | null,
): string {
  const ids = allVariants ? Object.keys(allVariants).sort().map((g) => allVariants[g].id) : [];
  const variantPart = ids.length > 0 ? ids.join('+') : (fallbackVariantId ?? 'base');
  return brandName ? `${productId}:${variantPart}:${brandName}` : `${productId}:${variantPart}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const key = makeCartKey(action.product.id, action.allVariants, action.variant?.id, action.brandName);
      const addQty = Math.max(1, Math.floor(action.quantity ?? 1));
      const existing = state.items.find((i) => i.cartKey === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.cartKey === key ? { ...i, quantity: i.quantity + addQty } : i
          ),
        };
      }
      return {
        items: [...state.items, {
          product: action.product,
          quantity: addQty,
          addedFromCompany: action.company ?? null,
          selectedVariant: action.variant ?? null,
          selectedVariants: action.allVariants ?? undefined,
          selectedBrandName: action.brandName ?? null,
          cartKey: key,
        }],
      };
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.cartKey !== action.cartKey) };
    case 'UPDATE_QTY':
      return {
        items: state.items.map((i) =>
          i.cartKey === action.cartKey
            ? { ...i, quantity: Math.max(1, action.quantity) }
            : i
        ),
      };
    case 'CLEAR':
      return { items: [] };
    case 'LOAD':
      // Garante que itens carregados do localStorage tenham cartKey
      return {
        items: action.items.map((i) => ({
          ...i,
          cartKey: i.cartKey ?? makeCartKey(i.product.id, i.selectedVariants, i.selectedVariant?.id, i.selectedBrandName),
        })),
      };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  /** Retorna false (e leva para o login) quando a pessoa não está logada; o item é adicionado depois do login. */
  addToCart: (product: Product, company?: string | null, variant?: SelectedVariant | null, allVariants?: Record<string, SelectedVariant>, brandName?: string | null, quantity?: number) => boolean;
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

// Item escolhido antes do login (guardado na aba, vale por 30 min)
const PENDING_KEY = 'pending-cart-add';
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;
type PendingAdd = { product: Product; company?: string | null; variant?: SelectedVariant | null; allVariants?: Record<string, SelectedVariant>; brandName?: string | null; quantity?: number };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const redirectingRef = useRef(false); // evita toast/redirect duplicados (ex.: várias combinações de uma vez)

  // Depois do login/cadastro: adiciona o que a pessoa tinha escolhido antes de ser levada ao login
  useEffect(() => {
    if (!user) return;
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PENDING_KEY);
      const pending = JSON.parse(raw) as { ts: number; items: PendingAdd[] };
      if (!pending?.items?.length || Date.now() - pending.ts > PENDING_MAX_AGE_MS) return;
      pending.items.forEach((it) => dispatch({ type: 'ADD', ...it }));
      toast.success(pending.items.length > 1 ? 'Itens adicionados ao orçamento!' : 'Item adicionado ao orçamento!');
    } catch {}
  }, [user]);

  // Persist cart in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) {
        dispatch({ type: 'LOAD', items: JSON.parse(saved) });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  // Preço efetivo: se a variante tem preço próprio, usa ele; senão usa o preço base do produto
  const subtotal = state.items.reduce(
    (sum, i) => sum + (i.selectedVariant?.priceDelta || i.product.price) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        subtotal,
        addToCart: (product, company, variant, allVariants, brandName, quantity) => {
          if (!user) {
            if (authLoading) return false; // sessão ainda sendo verificada: não manda quem já está logado para o login
            // Navegar é livre; escolher item para o orçamento exige login. Guarda a escolha e volta para esta página depois.
            try {
              const raw = sessionStorage.getItem(PENDING_KEY);
              const prev = raw ? (JSON.parse(raw) as { ts: number; items: PendingAdd[] }) : null;
              const items = prev && Date.now() - prev.ts < PENDING_MAX_AGE_MS ? prev.items : [];
              items.push({ product, company, variant, allVariants, brandName, quantity });
              sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ts: Date.now(), items }));
            } catch {}
            if (!redirectingRef.current) {
              redirectingRef.current = true;
              setTimeout(() => { redirectingRef.current = false; }, 2000);
              toast('Entre ou cadastre-se para adicionar itens ao orçamento.', { icon: '🔒' });
              const back = window.location.pathname + window.location.search;
              router.push(`/login?redirect=${encodeURIComponent(back)}`);
            }
            return false;
          }
          dispatch({ type: 'ADD', product, company, variant, allVariants, brandName, quantity });
          return true;
        },
        removeFromCart: (cartKey) => dispatch({ type: 'REMOVE', cartKey }),
        updateQuantity: (cartKey, quantity) =>
          dispatch({ type: 'UPDATE_QTY', cartKey, quantity }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
