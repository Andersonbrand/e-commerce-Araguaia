'use client';

import React, { memo } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { AcosSymbol, ConfianceSymbol } from '@/components/ui/brand-symbols';
import { HCMarkPaths, HC_MARK_W, HC_MARK_H } from '@/components/ui/hc-mark';

interface AppLogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
  forceCompany?: string | null;
}

// ── Grupo HC — logotipo oficial: HC colorido (azul / vermelho / cinza), "GRUPO" em cima, "HUGO COSTA" ao lado
// e "CONFIANÇA & RESPONSABILIDADE" embaixo, em cinza. Fonte padrão das marcas (mesma da Comercial Araguaia).
const BRAND_FONT = 'Montserrat, Arial, sans-serif';
const HC_GRAY = '#1a2a5c'; // azul-escuro (letras e monograma do Grupo HC)
// A altura sempre acompanha a largura (proporção do logotipo); `height` é aceito só por compatibilidade.
// `tight`: recorta as margens do desenho (usado no header, onde o espaço é pequeno).
export function GrupoHCLogoFull({ width = 340, className = '', tight = false }: { width?: number; height?: number; className?: string; tight?: boolean }) {
  const vb = tight ? { x: 40, y: 34, w: 570, h: 236 } : { x: 0, y: 0, w: 680, h: 280 };
  const h = Math.round(width * vb.h / vb.w);
  const markH = 150, k = markH / HC_MARK_H;
  return (
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} xmlns="http://www.w3.org/2000/svg" width={width} height={h}
      style={{ display: 'block' }} className={className} role="img" aria-label="Grupo HC — Hugo Costa">
      <text fontFamily={BRAND_FONT} fontWeight="600" fontSize="16" letterSpacing="13" x="54" y="50" fill={HC_GRAY}>GRUPO</text>
      <g transform={`translate(52 66) scale(${k})`}><HCMarkPaths color={HC_GRAY} /></g>
      <text fontFamily={BRAND_FONT} fontWeight="400" fontSize="68" letterSpacing="0" x="318" y="130" fill={HC_GRAY}>HUGO</text>
      <text fontFamily={BRAND_FONT} fontWeight="400" fontSize="68" letterSpacing="0" x="318" y="198" fill={HC_GRAY}>COSTA</text>
      <text fontFamily={BRAND_FONT} fontWeight="600" fontSize="12.5" letterSpacing="6" x="340" y="258" textAnchor="middle" fill={HC_GRAY}>CONFIANÇA &amp; RESPONSABILIDADE</text>
    </svg>
  );
}

// Versão compacta removida — usar GrupoHCLogo diretamente

// Comercial Araguaia — monograma "a" (vetorizado a partir do logotipo oficial)
// Versão completa com o nome: /assets/images/logo-comercial-araguaia.svg
function AraguaiaLogo({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="91.0 136.0 605.0 579.0" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Comercial Araguaia">
      <path fill="#de0212" fillRule="evenodd" d="M369.8 715.0C357.8 714.4 348.5 713.4 337.2 711.5C333.9 710.9 330.1 710.3 328.8 710.0C290.6 703.4 239.8 681.7 210.5 659.5C209.5 658.8 205.9 656.1 202.5 653.5C147.5 612.3 107.3 546.5 95.2 477.8C66.6 314.3 197.9 152.6 371.5 137.5C389.7 135.9 391.2 135.9 405.5 136.5C426.8 137.3 436.4 138.4 455.8 142.0C488.8 148.3 532.9 166.9 554.0 183.4C555.0 184.2 556.9 185.6 558.2 186.5C564.1 190.5 581.5 205.1 587.0 210.7C593.4 217.2 593.0 219.1 593.2 178.9C593.2 146.1 593.2 146.1 594.5 144.8C596.3 142.8 693.3 142.7 695.3 144.7C697.2 146.6 697.2 706.1 695.3 707.9C693.3 709.8 592.7 709.6 591.0 707.7C589.8 706.4 589.8 706.4 589.8 669.7C589.8 624.8 591.0 628.5 579.2 638.8C568.0 648.4 559.7 655.1 551.8 660.6C549.5 662.1 546.3 664.4 544.5 665.6C533.0 673.7 512.3 685.1 497.2 691.8C477.8 700.3 452.5 708.0 433.0 711.2C430.4 711.7 427.1 712.2 425.8 712.5C423.2 712.9 417.9 713.6 409.0 714.5C402.2 715.2 380.3 715.5 369.8 715.0ZM402.0 623.5C414.1 622.5 417.1 622.0 428.8 619.7C480.0 609.6 525.2 579.8 557.8 534.5C571.1 516.0 587.9 479.6 584.0 477.5C582.3 476.6 484.3 476.8 482.5 477.7C481.7 478.1 479.4 480.9 477.3 483.8C454.0 516.6 411.2 536.2 375.6 530.5C327.3 522.6 295.0 492.2 285.0 445.0C283.6 438.6 283.3 418.9 284.4 412.8C294.1 361.5 327.7 327.9 378.8 318.5C415.8 311.6 460.7 332.9 481.0 367.0C484.0 372.0 484.5 372.7 485.8 373.4C486.6 373.8 499.8 374.0 536.2 374.0C595.4 374.0 588.9 375.3 585.4 364.3C568.4 310.3 526.8 265.2 474.2 243.8C456.1 236.5 439.3 232.3 415.5 229.4C408.7 228.6 381.9 228.6 375.8 229.4C363.8 231.1 361.5 231.4 353.5 233.1C235.0 257.3 161.5 376.7 197.3 486.6C202.8 503.5 214.1 526.2 222.9 538.1C224.1 539.8 226.4 542.9 228.0 545.0C256.3 583.3 301.8 611.5 349.2 620.2C351.7 620.7 354.8 621.3 356.0 621.5C358.4 622.0 365.5 622.8 372.8 623.5C379.3 624.1 395.3 624.1 402.0 623.5Z" />
    </svg>
  );
}

// Indústria / Aços Confiance: no ícone (card da empresa, etc.) aparece só o símbolo da marca.
function ConfianceIndustriaLogo({ size }: { size: number }) {
  return <ConfianceSymbol size={size} />;
}

function AcosConfianceLogo({ size }: { size: number }) {
  return <AcosSymbol size={size} />;
}

// Logotipo completo (símbolo + nome com os detalhes originais), usado no header no lugar de ícone + texto.
const WORDMARKS: Record<string, { src: string; alt: string }> = {
  'confiance-industria': { src: '/assets/images/logo-confiance-industria.svg', alt: 'Indústria Confiance' },
  'acos-confiance':      { src: '/assets/images/logo-acos-confiance.svg',      alt: 'Aços Confiance' },
};
export function hasWordmark(companyId?: string | null) { return !!companyId && companyId in WORDMARKS; }
export function CompanyWordmark({ companyId, height = 46 }: { companyId: string; height?: number }) {
  const w = WORDMARKS[companyId];
  if (!w) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={w.src} alt={w.alt} style={{ height, width: 'auto', maxWidth: 200, objectFit: 'contain', display: 'block' }} />;
}

// Logo do Grupo HC para tamanhos pequenos (header, perfil): o monograma colorido
function GrupoHCLogo({ size }: { size: number }) {
  return (
    <svg viewBox={`0 0 ${HC_MARK_W} ${HC_MARK_H}`} xmlns="http://www.w3.org/2000/svg" width={size} height={size} role="img" aria-label="Grupo HC">
      <HCMarkPaths color={HC_GRAY} />
    </svg>
  );
}

const AppLogo = memo(function AppLogo({ size = 40, className = '', onClick, forceCompany }: AppLogoProps) {
  const { activeCompany } = useCompany();
  const effectiveCompany = forceCompany !== undefined ? forceCompany : activeCompany;

  const renderLogo = () => {
    if (effectiveCompany === 'confiance-industria') return <ConfianceIndustriaLogo size={size} />;
    if (effectiveCompany === 'acos-confiance')      return <AcosConfianceLogo size={size} />;
    if (effectiveCompany === 'araguaia')            return <AraguaiaLogo size={size} />;
    return <GrupoHCLogo size={size} />;
  };

  return (
    <div
      className={`flex items-center flex-shrink-0 transition-all duration-500 ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      {renderLogo()}
    </div>
  );
});

AppLogo.displayName = 'AppLogo';
export default AppLogo;
