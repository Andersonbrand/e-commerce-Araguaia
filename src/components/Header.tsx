'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import AppIcon from '@/components/ui/AppIcon';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { label: 'Início',    href: '/homepage' },
  { label: 'Produtos',  href: '/products' },
  { label: 'Sobre Nós', href: '/sobre' },
  { label: 'Orçamento', href: '/homepage#orcamento' },
];

export default function Header() {
  const [scrolled, setScrolled]    = useState(false);
  const [menuOpen, setMenuOpen]    = useState(false);
  const { totalItems }             = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const router                     = useRouter();

  // Nome curto do usuário (primeiro nome)
  const displayName = user?.user_metadata?.full_name
    ? (user.user_metadata.full_name as string).split(' ')[0]
    : user?.email?.split('@')[0] ?? '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => { await signOut(); router.push('/homepage'); };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-0' : 'py-2'}`}>
      <div className={`mx-4 md:mx-8 lg:mx-12 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border border-border/60 shadow-red-lg rounded-2xl mt-3 px-6 py-3'
          : 'bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl mt-4 px-6 py-4'
      }`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/homepage" className="flex items-center gap-3 group">
            <AppLogo size={38} />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-lg tracking-tight text-foreground">
                Comercial <span className="text-primary">Araguaia</span>
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-muted font-medium hidden sm:block">
                Materiais de Construção
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted hover:text-primary transition-colors duration-300">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Direita */}
          <div className="hidden lg:flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin-dashboard"
                className="text-[11px] uppercase tracking-widest font-bold text-primary hover:text-primary-dark transition-colors">
                Admin
              </Link>
            )}

            {user ? (
              /* Usuário logado: avatar + nome + sair */
              <div className="flex items-center gap-3">
                <Link href="/perfil" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <AppIcon name="UserIcon" size={14} className="text-primary" />
                  </div>
                  <span className="text-[12px] font-bold text-foreground max-w-[100px] truncate">{displayName}</span>
                </Link>
                <button onClick={handleSignOut}
                  className="text-[11px] uppercase tracking-widest font-bold text-muted hover:text-primary transition-colors flex items-center gap-1.5">
                  <AppIcon name="ArrowLeftEndOnRectangleIcon" size={14} />
                  Sair
                </button>
              </div>
            ) : (
              <Link href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-[11px] font-bold text-muted hover:text-primary uppercase tracking-widest">
                <AppIcon name="UserIcon" size={14} />
                Entrar
              </Link>
            )}

            {/* Carrinho */}
            <Link href="/cart"
              className="relative p-2.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              aria-label="Meu orçamento">
              <AppIcon name="ShoppingCartIcon" size={18} className="text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-3">
            <Link href="/cart" className="relative p-2 rounded-xl border border-border" aria-label="Orçamento">
              <AppIcon name="ShoppingCartIcon" size={18} className="text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex flex-col gap-1.5 p-2" aria-label="Menu">
              <span className={`block h-[2px] bg-foreground transition-all duration-300 ${menuOpen ? 'w-6 rotate-45 translate-y-[7px]' : 'w-6'}`} />
              <span className={`block h-[2px] bg-foreground transition-all duration-300 ${menuOpen ? 'opacity-0 w-0' : 'w-4'}`} />
              <span className={`block h-[2px] bg-foreground transition-all duration-300 ${menuOpen ? 'w-6 -rotate-45 -translate-y-[7px]' : 'w-6'}`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-border/40 space-y-3 pb-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                className="block text-[12px] uppercase tracking-[0.18em] font-bold text-muted hover:text-primary transition-colors py-2">
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin-dashboard" onClick={() => setMenuOpen(false)}
                className="block text-[12px] uppercase tracking-[0.18em] font-bold text-primary py-2">
                Painel Admin
              </Link>
            )}
            {user ? (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <AppIcon name="UserIcon" size={14} className="text-primary" />
                  <span className="text-[12px] font-bold text-foreground">{displayName}</span>
                </div>
                <button onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  className="text-[12px] font-bold text-muted hover:text-primary transition-colors">
                  Sair
                </button>
              </div>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="block text-[12px] uppercase tracking-[0.18em] font-bold text-muted hover:text-primary transition-colors py-2">
                Entrar
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
