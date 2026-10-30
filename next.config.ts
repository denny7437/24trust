import type { NextConfig } from 'next';

/**
 * Политика безопасности контента. Разрешены только свой домен и Яндекс Метрика
 * (подключается после согласия на аналитические cookie). Шрифты и скрипты — со своего сервера.
 * 'unsafe-inline' для скриптов нужен встроенным скриптам Next.js без nonce.
 */
const metrika = 'https://mc.yandex.ru https://mc.yandex.com';
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${metrika} https://yastatic.net`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${metrika}`,
  "font-src 'self' data:",
  `connect-src 'self' ${metrika}`,
  `frame-src blob: ${metrika}`,
  `child-src blob: ${metrika}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  // Самодостаточная сборка для Docker: .next/standalone + server.js
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ['nodemailer'],
  async headers() {
    const headers =
      process.env.NODE_ENV === 'production'
        ? [...securityHeaders, { key: 'Content-Security-Policy', value: contentSecurityPolicy }]
        : securityHeaders;
    return [{ source: '/:path*', headers }];
  },
};

export default nextConfig;
