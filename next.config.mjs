import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { imageHosts } = require('./image-hosts.config.js');

const isProd = process.env.NODE_ENV === 'production';

// ── Segurança: cabeçalhos HTTP ────────────────────────────────────────────────
// CSP (Content-Security-Policy) limita de onde a página pode carregar scripts, imagens e conexões.
// Começa em modo "só relatar" (Report-Only): o navegador mostra no Console o que BLOQUEARIA, mas não bloqueia nada.
// Depois de navegar pelo site sem avisos de CSP no Console, defina CSP_MODE=enforce no ambiente para valer.
const supabaseOrigin = (() => {
    try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin; } catch { return 'https://*.supabase.co'; }
})();

const csp = [
    "default-src 'self'",
    // 'unsafe-inline' é exigido pelos scripts embutidos do Next; 'unsafe-eval' só no desenvolvimento
    `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"} https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${supabaseOrigin} https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com`,
    'frame-src https://challenges.cloudflare.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const cspHeaderName = process.env.CSP_MODE === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';

const securityHeaders = [
    { key: cspHeaderName, value: csp },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    // HSTS só em produção (exige HTTPS); depois de testar, pode-se acrescentar "; preload"
    ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
];

// Páginas com dados da conta ou links de uso único: nunca ficam em cache e não vazam o endereço pelo Referer
const privateHeaders = [
    { key: 'Cache-Control', value: 'no-store, max-age=0' },
    { key: 'Referrer-Policy', value: 'no-referrer' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    distDir: process.env.DIST_DIR || '.next',
    poweredByHeader: false, // não anuncia "X-Powered-By: Next.js"
    typescript: { ignoreBuildErrors: true },
    eslint: { ignoreDuringBuilds: true },
    images: {
        remotePatterns: [
            ...imageHosts,
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    async headers() {
        return [
            { source: '/:path*', headers: securityHeaders },
            ...['/login', '/register', '/forgot-password', '/reset-password', '/auth/:path*', '/perfil', '/cart', '/admin-dashboard/:path*']
                .map((source) => ({ source, headers: privateHeaders })),
        ];
    },
    async redirects() {
        return [
            { source: '/', destination: '/homepage', permanent: false },
        ];
    },
};

export default nextConfig;
