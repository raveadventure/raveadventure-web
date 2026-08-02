import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://raveadventure.pl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/review', '/status', '/maintenance'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
