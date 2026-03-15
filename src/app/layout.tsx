import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { PriceProvider } from '@/context/PriceContext';
import '../styles/tailwind.css';

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028'),
  title: 'Comercial Araguaia — Materiais de Construção Civil · Guanambi/BA',
  description: 'Revenda especializada em cimento, ferragens, vergalhões e materiais de serralheiro em Guanambi, Bahia. Desde 1990 com qualidade e os melhores preços.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <CartProvider>
            <PriceProvider>
              {children}
              <Toaster position="top-center" toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff', color: '#0d1117',
                  border: '1px solid #dde3ed', borderRadius: '0.75rem',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.875rem', fontWeight: 600,
                },
                success: { iconTheme: { primary: '#af1518', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#af1518', secondary: '#fff' } },
              }} />
            </PriceProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
