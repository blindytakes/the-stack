import type { NextConfig } from 'next';

function normalizeHeaderValue(value: string): string {
  return value.replace(/\s{2,}/g, ' ').trim();
}

function toOrigin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy() {
  const connectSrc = new Set(["'self'", 'https://challenges.cloudflare.com']);
  const posthogOrigin = toOrigin(process.env.NEXT_PUBLIC_POSTHOG_HOST);
  if (posthogOrigin) {
    connectSrc.add(posthogOrigin);
  }

  return normalizeHeaderValue(`
    default-src 'self';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    object-src 'none';
    script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src ${Array.from(connectSrc).join(' ')};
    frame-src https://challenges.cloudflare.com;
    upgrade-insecure-requests;
  `);
}

const nextConfig: NextConfig = {
  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: buildContentSecurityPolicy()
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
