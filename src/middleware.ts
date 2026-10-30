import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware-client';

// Públicas: home, login/cadastro, catálogo (/products e /products/[id]) e /sobre.
// Continuam exigindo login: /cart (enviar orçamento), /perfil e /admin-dashboard.
// Adicionar item ao orçamento também pede login (veja CartContext).
const PUBLIC_PATHS = new Set([
  '/', '/homepage', '/login', '/register', '/products', '/sobre',
  '/forgot-password', '/reset-password', '/auth/confirm', // fluxo de conta: abertos pelos links dos e-mails
]);

function isPublic(pathname: string): boolean {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (PUBLIC_PATHS.has(normalized)) return true;
  if (normalized.startsWith('/products/')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/assets/')) return true;
  if (pathname.startsWith('/images/')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/favicon.svg') return true;
  // Arquivos estáticos com extensão
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|css|js)$/.test(pathname)) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    // Mesmo em rotas públicas, renova o token se existir
    const { response } = createMiddlewareClient(request);
    return response;
  }

  const { supabase, response } = createMiddlewareClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Painel administrativo: só quem tem role "admin" em app_metadata (gravado apenas pelo servidor/SQL).
  // user_metadata NÃO conta: o próprio usuário consegue editá-lo.
  if (pathname === '/admin-dashboard' || pathname.startsWith('/admin-dashboard/')) {
    if (user.app_metadata?.role !== 'admin') {
      const home = request.nextUrl.clone();
      home.pathname = '/homepage';
      home.search = '';
      return NextResponse.redirect(home);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
