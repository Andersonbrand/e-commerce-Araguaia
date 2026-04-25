'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
  cartKey: string; // `${product.id}:${variantId || 'base'}`
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD'; product: Product; company?: string | null; variant?: SelectedVariant | null; allVariants?: Record<string, SelectedVariant>; brandName?: string | null }
  | { type: 'REMOVE'; cartKey: string }
  | { type: 'UPDATE_QTY'; cartKey: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] };

function makeCartKey(productId: string, variantId?: string | null): string {
  return `${productId}:${variantId ?? 'base'}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const key = makeCartKey(action.product.id, action.variant?.id);
      const existing = state.items.find((i) => i.cartKey === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.cartKey === key ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        items: [...state.items, {
          product: action.product,
          quantity: 1,
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
          cartKey: i.cartKey ?? makeCartKey(i.product.id, i.selectedVariant?.id),
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
  addToCart: (product: Product, company?: string | null, variant?: SelectedVariant | null, allVariants?: Record<string, SelectedVariant>, brandName?: string | null) => void;
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

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
        addToCart: (product, company, variant, allVariants, brandName) =>
          dispatch({ type: 'ADD', product, company, variant, allVariants, brandName }),
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
