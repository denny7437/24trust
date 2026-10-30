import type { MetadataRoute } from 'next';
import { siteUrl } from '@/content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '', priority: 1 },
    { path: '/privacy', priority: 0.3 },
    { path: '/consent', priority: 0.3 },
  ];
  return pages.map(({ path, priority }) => ({
    url: `${siteUrl}${path || '/'}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority,
  }));
}
