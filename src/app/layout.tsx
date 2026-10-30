import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

// Шрифты — с собственного сервера (пакеты @fontsource), без запросов к Google Fonts
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import '@fontsource/onest/600.css';
import '@fontsource/onest/700.css';
import '@fontsource/unbounded/600.css';
import '@fontsource/unbounded/700.css';
import './globals.css';

import { CookieBanner } from '@/components/CookieBanner';
import { siteUrl } from '@/content/site';

const title = 'TrustGuard AI — контроль запросов и ответов генеративного ИИ';
const description =
  'Фильтр между пользователем и языковой моделью: безопасное пропускает, спорное переформулирует, запрещённое блокирует со ссылкой на норму. Работает в контуре заказчика.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s — TrustGuard AI',
  },
  description,
  applicationName: 'TrustGuard AI',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'TrustGuard AI',
    title,
    description,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#F3F1FD',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Перейти к содержанию
        </a>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
