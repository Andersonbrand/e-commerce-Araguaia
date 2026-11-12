'use client';

import Button from '@/components/ui/Button';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo, { GrupoHCLogoFull, CompanyWordmark, hasWordmark } from '@/components/ui/AppLogo';
import AppIcon from '@/components/ui/AppIcon';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { firstTwoNames } from '@/lib/format';
import { usePathname } from 'next/navigation';
import { useCompany, COMPANIES, CompanyId, Company } from '@/context/CompanyContext';

const NAV_LINKS = [
  { label: 'Início',    href: '/homepage' },
  { label: 'Produtos',  href: '/products' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Orçamento', href: '/homepage#orcamento' },
];

const COMPANY_ORDER: CompanyId[] = ['araguaia', 'confiance-industria', 'acos-confiance'];

function CompanyPill({ company, isActive, onClick, locked }: {
  company: Company; isActive: boolean; onClick: () => void; locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      data-ripple-color={isActive ? 'rgba(255,255,255,0.4)' : company.primaryColor}
      title={locked ? 'Navegue para outra página para trocar de empresa' : undefined}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border whitespace-nowrap ${locked && !isActive ? 'opacity-40 cursor-not-allowed' : ''}`}
      style={{
        backgroundColor: isActive ? company.primaryColor : 'transparent',
        color: isActive ? '#fff' : company.primaryColor,
        borderColor: isActive ? company.primaryColor : `${company.primaryColor}40`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: isActive ? '#fff' : company.primaryColor }} />
      {company.shortName}
    </button>
  );
}

export default function Header() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const pathname                  = usePathname();
  // Bloqueia troca de empresa na página individual de produto
  // Rotas que limpam a empresa (sem seleção ativa)
  const isProductPage    = pathname?.startsWith('/products/') && pathname !== '/products';
  const isCompanyCleared = pathname === '/sobre' || pathname === '/cart' || 
                            pathname?.startsWith('/admin-dashboard') || pathname === '/perfil';
  const isLockedPage     = isProductPage || isCompanyCleared;

  // Link de navegação da página atual (letras vermelhas). Início/Orçamento dividem /homepage, então usam o #hash
  const [hash, setHash] = useState('');
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [pathname]);
  const isNavActive = (href: string) => {
    const [path, h] = href.split('#');
    if (path === '/homepage') {
      if (pathname !== '/homepage' && pathname !== '/') return false;
      return h ? hash === `#${h}` : hash !== '#orcamento';
    }
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const { totalItems }            = useCart();
  const { user, isAdmin, signOut }= useAuth();
  const router                    = useRouter();
  const { activeCompany, company, setActiveCompany, isGrupoView } = useCompany();

  // Limpa empresa ativa ao entrar em /sobre ou /cart
  useEffect(() => {
    if (isCompanyCleared) {
      setActiveCompany(null);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nome informado no cadastro, limitado aos dois primeiros nomes; sem nome, usa a parte inicial do e-mail.
  const displayName = firstTwoNames(user?.user_metadata?.full_name as string | undefined)
    || user?.email?.split('@')[0] || '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Entrar: depois do login a pessoa volta para a página (e o filtro) em que estava
  const goToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  };
  const handleSignOut = async () => { await signOut(); router.push('/homepage'); }; // usado em <Button>: trava e mostra "Carregando..." até concluir
  const headerAccent = company?.primaryColor ?? '#af1518';
  // Comercial Araguaia: nome em azul, como no logotipo oficial (símbolo vermelho + nome azul)
  const nameColor = company?.id === 'araguaia' ? '#024a91' : headerAccent;

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-0' : 'py-2'}`}>
      {/* Stripe tricolor do Grupo / cor da empresa */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-700"
        style={{ background: isGrupoView
          ? 'linear-gradient(90deg, #af1518 0%, #af1518 33%, #183159 33%, #183159 66%, #204289 66%, #204289 100%)'
          : company?.gradient ?? '#af1518'
        }}
      />

      <div className={`mx-4 md:mx-8 desk:mx-12 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border border-border/60 shadow-lg rounded-2xl mt-3 px-6 py-3'
          : 'bg-white/85 backdrop-blur-md border border-white/40 rounded-2xl mt-4 px-6 py-4'
      }`}>
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/homepage" data-no-ripple onClick={() => setActiveCompany(null)} className="flex items-center gap-3 group flex-shrink-0">
            {isGrupoView ? (
              /* Visão do Grupo: logotipo completo (HC colorido + GRUPO / HUGO COSTA / CONFIANÇA & RESPONSABILIDADE) */
              <GrupoHCLogoFull width={124} tight />
            ) : hasWordmark(company?.id) ? (
              /* Aços / Indústria Confiance: o logotipo oficial já traz o nome — ocupa o lugar do ícone + texto */
              <CompanyWordmark companyId={company!.id} height={46} />
            ) : (<>
            <AppLogo size={38} />
            <div className="flex flex-col leading-none">
              {/* Todas as marcas usam o padrão da Comercial Araguaia: nome em maiúsculas, negrito, em duas linhas,
                  com o complemento em cinza logo abaixo. */}
              {
                <>
                  <span className="font-brand-hc font-extrabold uppercase text-[14px] leading-[1.02] tracking-tight transition-colors duration-300"
                    style={{ color: nameColor }}>
                    {(company?.name ?? '').split(' ')[0]}<br />{(company?.name ?? '').split(' ').slice(1).join(' ')}
                  </span>
                  <span className="font-brand-hc text-[9px] font-semibold tracking-[0.04em] mt-1 hidden sm:block" style={{ color: '#7b808a' }}>
                    {company?.brandTagline ?? company?.segment}
                  </span>
                </>
              }
            </div>
            </>)}
          </Link>

          {/* Seletor de empresa — desktop */}
          <div className="hidden desk:flex items-center gap-1.5 bg-[#f5f7fa] rounded-2xl px-3 py-2 border border-[#dde3ed]">
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-muted/60 mr-0.5">Grupo HC</span>
            <div className="w-px h-3.5 bg-[#dde3ed] mx-0.5" />
            {COMPANY_ORDER.map((id) => (
              <CompanyPill
                key={id}
                company={COMPANIES[id]}
                isActive={activeCompany === id}
                onClick={() => {
                  if (isLockedPage) return; // bloqueado nesta página
                  setActiveCompany(activeCompany === id ? null : id);
                }}
                locked={isLockedPage}
              />
            ))}
            {!isGrupoView && (
              <button
                onClick={() => setActiveCompany(null)}
                className="ml-1 w-6 h-6 flex items-center justify-center rounded-lg bg-[#dde3ed] hover:bg-[#c8cdd8] transition-colors text-muted"
                title="Ver grupo completo"
              >
                <AppIcon name="XMarkIcon" size={12} />
              </button>
            )}
          </div>

          {/* Nav desktop */}
          <nav className="hidden desk:flex items-center gap-3">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} data-ripple-color="rgba(175,21,24,0.16)"
                aria-current={isNavActive(link.href) ? 'page' : undefined}
                onClick={() => setHash(link.href.includes('#') ? '#' + link.href.split('#')[1] : '')}
                className="nav-fill text-[11px] uppercase tracking-[0.08em] font-bold whitespace-nowrap">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Direita */}
          <div className="hidden desk:flex items-center gap-3 flex-shrink-0">
            {isAdmin && (
              <Link href="/admin-dashboard" className="text-[11px] uppercase tracking-widest font-bold transition-colors"
                style={{ color: headerAccent }}>Admin</Link>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/perfil" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border hover:border-primary/30 transition-all">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${headerAccent}15`, border: `1px solid ${headerAccent}30` }}>
                    <AppIcon name="UserIcon" size={14} style={{ color: headerAccent }} />
                  </div>
                  <span className="text-[12px] font-bold text-foreground max-w-[150px] truncate">{displayName}</span>
                </Link>
                <Button onClick={handleSignOut} className="text-[11px] uppercase tracking-widest font-bold text-muted hover:text-foreground transition-colors flex items-center gap-1">
                  <AppIcon name="ArrowLeftEndOnRectangleIcon" size={13} />Sair
                </Button>
              </div>
            ) : (
              <Link href="/login" onClick={goToLogin} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-surface transition-all text-[11px] font-bold text-muted uppercase tracking-widest">
                <AppIcon name="UserIcon" size={14} />Entrar
              </Link>
            )}
            <Link href="/cart" className="relative p-2.5 rounded-xl border transition-all"
              style={{ borderColor: `${headerAccent}30` }} aria-label="Orçamento">
              <AppIcon name="ShoppingCartIcon" size={18} className="text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: headerAccent }}>
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile */}
          <div className="desk:hidden flex items-center gap-2">
            <Link href="/cart" className="relative p-2 rounded-xl border border-border">
              <AppIcon name="ShoppingCartIcon" size={18} className="text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ backgroundColor: headerAccent }}>{totalItems}</span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex flex-col gap-1.5 p-2">
              <span className={`block h-[2px] transition-all duration-300 ${menuOpen ? 'w-6 rotate-45 translate-y-[7px]' : 'w-6'}`} style={{ backgroundColor: menuOpen ? headerAccent : '#0d1117' }} />
              <span className={`block h-[2px] transition-all duration-300 ${menuOpen ? 'opacity-0 w-0' : 'w-4'}`} style={{ backgroundColor: '#0d1117' }} />
              <span className={`block h-[2px] transition-all duration-300 ${menuOpen ? 'w-6 -rotate-45 -translate-y-[7px]' : 'w-6'}`} style={{ backgroundColor: menuOpen ? headerAccent : '#0d1117' }} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="desk:hidden mt-4 pt-4 border-t border-border/40 pb-3">
            {/* Empresa selecionada */}
            {!isLockedPage && (
              <div className="mb-4">
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-muted mb-2">Empresa</p>
                <div className="grid grid-cols-3 gap-2">
                  {COMPANY_ORDER.map((id) => {
                    const co = COMPANIES[id];
                    const isActive = activeCompany === id;
                    return (
                      <button key={id}
                        data-ripple-color={co.primaryColor}
                        onClick={() => { setActiveCompany(isActive ? null : id); setMenuOpen(false); }}
                        className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all text-center"
                        style={{
                          borderColor: isActive ? co.primaryColor : `${co.primaryColor}30`,
                          backgroundColor: isActive ? `${co.primaryColor}10` : 'transparent',
                        }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: co.primaryColor }} />
                        <span className="text-[10px] font-bold leading-tight" style={{ color: co.primaryColor }}>{co.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="h-px bg-border/40 mb-3" />
            {/* Nav links */}
            <div className="space-y-0.5">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}
                  aria-current={isNavActive(link.href) ? 'page' : undefined}
                  onClick={() => { setMenuOpen(false); setHash(link.href.includes('#') ? '#' + link.href.split('#')[1] : ''); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-bold hover:bg-primary/5 transition-all ${isNavActive(link.href) ? 'text-primary' : 'text-muted hover:text-foreground'}`}>
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link href="/admin-dashboard" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-bold transition-all hover:bg-surface"
                  style={{ color: headerAccent }}>
                  Painel Admin
                </Link>
              )}
            </div>
            <div className="h-px bg-border/40 my-3" />
            {/* User */}
            {user ? (
              <div className="flex items-center justify-between px-3 py-2">
                <Link href="/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${headerAccent}15` }}>
                    <AppIcon name="UserIcon" size={14} style={{ color: headerAccent }} />
                  </div>
                  <span className="text-[13px] font-bold text-foreground">{displayName}</span>
                </Link>
                <Button onClick={async () => { await handleSignOut(); setMenuOpen(false); }}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface">
                  <AppIcon name="ArrowLeftEndOnRectangleIcon" size={14} />Sair
                </Button>
              </div>
            ) : (
              <Link href="/login" onClick={(e) => { setMenuOpen(false); goToLogin(e); }}
                className="flex items-center gap-2 mx-3 px-4 py-3 rounded-xl border border-border text-[13px] font-bold text-muted hover:bg-surface transition-all">
                <AppIcon name="UserIcon" size={15} />Entrar
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
