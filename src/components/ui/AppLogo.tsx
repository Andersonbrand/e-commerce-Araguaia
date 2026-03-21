'use client';

import React, { memo } from 'react';
import { useCompany } from '@/context/CompanyContext';

interface AppLogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
  forceCompany?: string | null;
}

// ── Grupo HC — SVG tipográfico fiel ao arquivo oficial ──────────────────────
// Renderizado inline para garantir que as fontes sejam interpretadas pelo browser
export function GrupoHCLogoFull({ width = 340, height, className = '' }: { width?: number; height?: number; className?: string }) {
  const h = height ?? Math.round(width * 280 / 680);
  return (
    <svg
      viewBox="0 0 680 280"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={h}
      style={{ display: 'block' }}
      className={className}
    >
      {/* GRUPO label */}
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="400"
        fontSize="16"
        letterSpacing="10"
        x="60" y="50"
        fill="#0a1a3a"
      >GRUPO</text>

      {/* HC monogram grande */}
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="800"
        fontSize="155"
        x="48" y="218"
        fill="#0a1a3a"
      >HC</text>

      {/* HUGO COSTA */}
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="800"
        fontSize="70"
        letterSpacing="2"
        x="310" y="145"
        fill="#0a1a3a"
      >HUGO</text>
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="800"
        fontSize="70"
        letterSpacing="2"
        x="310" y="218"
        fill="#0a1a3a"
      >COSTA</text>

      {/* Divider */}
      <rect x="60" y="232" width="580" height="1.5" rx="1" fill="#0a1a3a" opacity="0.2"/>

      {/* Tagline */}
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="400"
        fontSize="13"
        letterSpacing="5"
        x="340" y="258"
        textAnchor="middle"
        fill="#0a1a3a"
      >CONFIANÇA &amp; RESPONSABILIDADE</text>
    </svg>
  );
}

// Versão compacta removida — usar GrupoHCLogo diretamente

// Comercial Araguaia — C vermelho
function AraguaiaLogo({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 542 550">
      <circle cx="264" cy="288" r="180" fill="#ffffff" />
      <path
        d="M 245.92 545.01 C139.91,536.77 51.03,466.90 18.68,366.37 C10.43,340.75 6.74,316.50 6.74,288.00 C6.74,259.50 10.43,235.25 18.68,209.63 C49.47,113.93 131.38,45.89 232.00,32.39 C248.73,30.15 279.27,30.15 296.00,32.39 C347.14,39.25 389.62,58.06 431.75,92.49 L 435.00 95.14 L 435.00 37.00 L 480.00 37.00 L 525.00 37.00 L 525.00 285.51 L 525.00 534.02 L 480.25 533.76 L 435.50 533.50 L 435.00 507.21 L 434.50 480.92 L 428.50 486.02 C392.77,516.38 344.87,537.28 297.00,543.39 C281.94,545.32 259.16,546.04 245.92,545.01 ZM 299.15 460.64 C332.31,453.51 360.66,438.69 384.08,416.25 C402.02,399.06 412.48,384.97 422.35,364.70 C426.43,356.34 432.70,339.67 434.37,332.75 L 435.04 330.00 L 389.07 330.00 L 343.10 330.00 L 338.42 337.24 C325.95,356.51 305.57,370.25 281.64,375.52 C269.72,378.14 249.45,377.21 238.00,373.51 C212.80,365.37 194.55,349.64 183.53,326.55 C176.83,312.51 175.50,306.13 175.50,288.00 C175.50,269.48 176.84,263.31 184.12,248.38 C195.56,224.88 215.34,208.79 241.99,201.30 C250.36,198.95 271.95,198.43 281.27,200.36 C302.67,204.78 323.08,217.53 335.02,233.91 L 339.45 240.00 L 386.23 240.00 C414.04,240.00 433.00,239.63 433.00,239.08 C433.00,238.57 431.61,234.23 429.92,229.42 C412.05,178.79 371.31,138.55 320.23,121.07 C289.15,110.43 251.80,109.13 219.36,117.56 C142.09,137.64 88.04,207.79 88.04,288.00 C88.04,370.71 145.25,442.15 225.77,459.96 C241.07,463.35 247.59,463.90 268.00,463.51 C284.09,463.21 289.54,462.71 299.15,460.64 Z"
        fill="rgba(175,21,24,1)"
      />
    </svg>
  );
}

function ConfianceIndustriaLogo({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center rounded-xl overflow-hidden bg-[#f0f4ff] p-1">
      <img src="/assets/images/logo-confiance-industria.svg" alt="Confiance" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

function AcosConfianceLogo({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center rounded-xl overflow-hidden bg-[#fff7f0] p-1">
      <img src="/assets/images/logo-acos-confiance.svg" alt="Aços Confiance" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// Logo do Grupo HC para tamanhos pequenos (header, perfil)
function GrupoHCLogo({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <rect width="100" height="80" rx="14" fill="#0a1a3a"/>
      <text
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="800"
        fontSize="52"
        x="50" y="58"
        textAnchor="middle"
        fill="white"
        letterSpacing="-2"
      >HC</text>
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
