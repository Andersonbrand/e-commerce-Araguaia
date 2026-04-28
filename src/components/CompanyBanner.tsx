'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompany } from '@/context/CompanyContext';
import AppIcon from '@/components/ui/AppIcon';

// Rotas onde o banner nunca deve aparecer
const HIDDEN_ON_ROUTES = ['/login', '/register'];

export default function CompanyBanner() {
  const { company, setActiveCompany, isGrupoView } = useCompany();
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!isGrupoView) {
      // Small delay for smooth entrance
      setTimeout(() => setVisible(true), 50);
    } else {
      setVisible(false);
    }
  }, [isGrupoView]);

  // Não renderiza em páginas de autenticação
  if (HIDDEN_ON_ROUTES.some((route) => pathname?.startsWith(route))) return null;

  if (isGrupoView || !company) return null;

  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div
        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${company.primaryColor}f0, ${company.primaryDark}f0)`,
          boxShadow: `0 20px 60px ${company.primaryColor}50`,
        }}
      >
        {/* Identidade */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <AppIcon name="BuildingStorefrontIcon" size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/60 whitespace-nowrap">Visualizando</p>
            <p className="text-sm font-bold text-white leading-none whitespace-nowrap">{company.name}</p>
          </div>
        </div>

        <div className="w-px h-8 bg-white/20" />

        {/* Tags de categoria */}
        <div className="hidden sm:flex items-center gap-1.5">
          {company.categories.slice(0, 3).map((cat) => (
            <span key={cat} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/15 text-white whitespace-nowrap">
              {cat}
            </span>
          ))}
        </div>

        <div className="w-px h-8 bg-white/20 hidden sm:block" />

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Link
            href={`/products?empresa=${company.id}`}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white bg-white/20 hover:bg-white/30 transition-colors px-3 py-2 rounded-xl whitespace-nowrap"
          >
            <AppIcon name="Squares2X2Icon" size={13} />
            Ver Produtos
          </Link>
          <button
            onClick={() => setActiveCompany(null)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Voltar ao Grupo"
          >
            <AppIcon name="XMarkIcon" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
