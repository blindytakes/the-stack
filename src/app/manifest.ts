import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Stack',
    short_name: 'The Stack',
    description:
      'Make the banks work for you with transparent bonus strategy, banking plays, and payout math.',
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
