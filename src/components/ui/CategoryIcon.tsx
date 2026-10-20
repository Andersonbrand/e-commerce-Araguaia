'use client';

import React from 'react';
import AppIcon from '@/components/ui/AppIcon';

/**
 * Ícones de materiais de construção (traço, 24×24, herdam a cor do texto).
 * A escolha do ícone de cada categoria fica em lib/category-icons.ts.
 */
const SVG: Record<string, React.ReactNode> = {
  // saco de cimento
  sack: (<><path d="M8 3.5h8l3 3.5v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V7z" /><path d="M5 7h14" /><path d="M9 12.5h6M9 15.5h4" /></>),
  // balde de argamassa
  bucket: (<><path d="M5.5 9h13l-1.4 9.6a1.5 1.5 0 0 1-1.5 1.4H8.4a1.5 1.5 0 0 1-1.5-1.4z" /><path d="M7 9c0-3 2-5 5-5s5 2 5 5" /><path d="M7 13h10" /></>),
  // vergalhão (barras nervuradas)
  rebar: (<><rect x="2.5" y="5.5" width="19" height="4.5" rx="2.25" /><path d="M7 5.5l2 4.5M12 5.5l2 4.5M17 5.5l2 4.5" /><rect x="2.5" y="14" width="19" height="4.5" rx="2.25" /><path d="M7 14l2 4.5M12 14l2 4.5M17 14l2 4.5" /></>),
  // tubo
  pipe: (<><path d="M4.5 7.5h14M4.5 16.5h14" /><ellipse cx="4.5" cy="12" rx="2.2" ry="4.5" /><path d="M18.5 7.5c1.2 0 2.2 2 2.2 4.5s-1 4.5-2.2 4.5" /><path d="M12.5 7.5v9" /></>),
  // telha ondulada de zinco
  corrugated: (<><path d="M3 8c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" /><path d="M3 13c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" /><path d="M3 18c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" /></>),
  // telha translúcida (onda + luz)
  sunroof: (<><circle cx="17" cy="6" r="2.2" /><path d="M17 2v1M21 6h-1M13 6h1M19.8 3.2l-.7.7M14.2 3.2l.7.7" /><path d="M3 13c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" /><path d="M3 18c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" /></>),
  // telhado (fibrocimento / cerâmica)
  roof: (<><path d="M2.5 12L12 4l9.5 8" /><path d="M5.5 15.5L12 9.5l6.5 6" /><path d="M8.5 19L12 15.5l3.5 3.5" /></>),
  // prego
  nail: (<g transform="rotate(35 12 12)"><path d="M8 3.5h8" /><path d="M10.6 3.5v14.5l1.4 2.7 1.4-2.7V3.5" /></g>),
  // parafuso
  screw: (<><rect x="7.5" y="2.5" width="9" height="3.2" rx="1" /><path d="M10.5 5.7v13l1.5 3 1.5-3v-13" /><path d="M10.5 9l3 1.2M10.5 12l3 1.2M10.5 15l3 1.2" /></>),
  // rolo de arame
  wire: (<><ellipse cx="12" cy="8" rx="9" ry="4" /><ellipse cx="12" cy="8" rx="5.5" ry="2.2" /><path d="M3 8v7c0 2.2 4 4 9 4s9-1.8 9-4V8" /></>),
  // bobina de aço
  coil: (<><circle cx="10.5" cy="11" r="7.5" /><circle cx="10.5" cy="11" r="4.2" /><circle cx="10.5" cy="11" r="1.2" /><path d="M10.5 18.5H21" /></>),
  // corda trançada
  rope: (<><path d="M3.5 17.5L17.5 3.5" /><path d="M6.5 20.5L20.5 6.5" /><path d="M3.5 17.5l3 3M17.5 3.5l3 3" /><path d="M6 15l3 3M9 12l3 3M12 9l3 3M15 6l3 3" /></>),
  // cabo de aço (laço com presilha)
  cable: (<><circle cx="12" cy="8.5" r="5" /><path d="M9.4 12.8L8.5 21M14.6 12.8L15.5 21" /><rect x="8" y="15" width="8" height="3.2" rx="1" /></>),
  // chapas empilhadas
  sheets: (<><path d="M12 3.5l9 4-9 4-9-4z" /><path d="M3 12l9 4 9-4" /><path d="M3 16.5l9 4 9-4" /></>),
  // placa de drywall
  drywall: (<><rect x="3" y="4.5" width="18" height="15" rx="1.5" /><path d="M3 12h18" /><circle cx="6.5" cy="8.2" r=".7" /><circle cx="17.5" cy="8.2" r=".7" /><circle cx="6.5" cy="15.8" r=".7" /><circle cx="17.5" cy="15.8" r=".7" /></>),
  // cantoneira (perfil em L)
  angle: (<path d="M4.5 3.5h5v11h10v5h-15z" />),
  // viga / perfil em I
  beam: (<path d="M4 4h16v3.2h-6.4v9.6H20V20H4v-3.2h6.4V7.2H4z" />),
  // barras chatas (aços planos)
  flat: (<><rect x="3" y="4.5" width="16" height="3.4" rx=".8" /><rect x="5" y="10.3" width="16" height="3.4" rx=".8" /><rect x="3" y="16.1" width="16" height="3.4" rx=".8" /></>),
  // treliça
  truss: (<><path d="M3 7.5h18M3 17.5h18" /><path d="M3 17.5l4.5-10 4.5 10 4.5-10 4.5 10" /></>),
  // dobradiça (acessórios de serralheria)
  hinge: (<><rect x="3" y="4.5" width="7" height="15" rx="1" /><rect x="14" y="4.5" width="7" height="15" rx="1" /><path d="M10 6h4M10 12h4M10 18h4" /><circle cx="6.5" cy="8.5" r=".7" /><circle cx="6.5" cy="15.5" r=".7" /><circle cx="17.5" cy="8.5" r=".7" /><circle cx="17.5" cy="15.5" r=".7" /></>),
  // chave (serralheria)
  key: (<><circle cx="7.5" cy="14.5" r="3.8" /><path d="M10.4 12L20 2.5M16.5 6l3 3M13.5 9l2.5 2.5" /></>),
  // martelo (ferramentas)
  hammer: (<g transform="rotate(45 12 12)"><rect x="6" y="3" width="12" height="5" rx="1" /><rect x="10.8" y="8" width="2.4" height="13" rx="1" /></g>),
  // tela / malha
  mesh: (<><rect x="3.5" y="3.5" width="17" height="17" rx="1" /><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17" /></>),
  // tijolo / bloco
  brick: (<><rect x="3" y="5.5" width="18" height="13" rx="1" /><path d="M3 9.8h18M3 14.2h18M9 5.5v4.3M15 9.8v4.4M9 14.2v4.3" /></>),
};

// Ícones prontos do Heroicons (ferramentas, tinta, elétrica... e os genéricos de reserva)
const HERO: Record<string, string> = {
  tools: 'WrenchScrewdriverIcon', paint: 'PaintBrushIcon', electric: 'BoltIcon', weld: 'FireIcon',
  dots: 'EllipsisHorizontalCircleIcon',
  cube: 'CubeIcon', puzzle: 'PuzzlePieceIcon', swatch: 'SwatchIcon', archive: 'ArchiveBoxIcon',
  storefront: 'BuildingStorefrontIcon', sparkles: 'SparklesIcon', stack: 'RectangleStackIcon',
  cog: 'Cog6ToothIcon', beaker: 'BeakerIcon', truck: 'TruckIcon', tag: 'TagIcon', cubeT: 'CubeTransparentIcon',
};

export default function CategoryIcon({ iconKey, size = 20, className = '' }: { iconKey: string; size?: number; className?: string }) {
  const paths = SVG[iconKey];
  if (!paths) return <AppIcon name={HERO[iconKey] ?? 'TagIcon'} size={size} className={className} />;
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden
    >
      {paths}
    </svg>
  );
}
