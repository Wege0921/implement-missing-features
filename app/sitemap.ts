import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kingdom-learning.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/sermons`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/learn`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const supabase = await createClient()
    const [{ data: sermons }, { data: paths }] = await Promise.all([
      supabase
        .from('sermons')
        .select('id, updated_at')
        .eq('is_published', true),
      supabase.from('learning_paths').select('id, updated_at').eq('is_published', true),
    ])

    const sermonRoutes: MetadataRoute.Sitemap =
      sermons?.map((s) => ({
        url: `${baseUrl}/sermons/${s.id}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })) ?? []

    const pathRoutes: MetadataRoute.Sitemap =
      paths?.map((p) => ({
        url: `${baseUrl}/learn/${p.id}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })) ?? []

    return [...staticRoutes, ...sermonRoutes, ...pathRoutes]
  } catch {
    return staticRoutes
  }
}
