import type { MetadataRoute } from 'next';

const SITE_DESCRIPTION =
  'Learn how to make the most of your money with practical card and banking strategies.';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Stack',
    short_name: 'The Stack',
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1a31',
    theme_color: '#0f1a31',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon'
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  };
}
