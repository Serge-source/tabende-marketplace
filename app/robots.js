export default function robots() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://tabendebon.com';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/dashboard/', '/messages/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
