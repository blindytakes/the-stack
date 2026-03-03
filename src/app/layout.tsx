import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import './globals.css';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteNav } from '@/components/layout/site-nav';
import { WebVitalsReporter } from '@/components/analytics/web-vitals';
import { PostHogProvider } from '@/components/analytics/posthog-provider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap'
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: '400',
  display: 'swap'
});

const SITE_URL = 'https://thestackfinance.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'The Stack',
    template: '%s | The Stack'
  },
  description:
    'Make the banks work for you with transparent bonus strategy, banking plays, and payout math.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'The Stack',
    title: {
      default: 'The Stack',
      template: '%s | The Stack'
    },
    description:
      'Make the banks work for you with transparent bonus strategy, banking plays, and payout math.'
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: 'The Stack',
      template: '%s | The Stack'
    },
    description:
      'Make the banks work for you with transparent bonus strategy, banking plays, and payout math.'
  },
  other: {
    'color-scheme': 'dark'
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable} dark`}>
      <body className="min-h-screen bg-bg text-text-primary">
        <PostHogProvider>
          <WebVitalsReporter />
          <div className="glow min-h-screen">
            <SiteNav />
            <main className="pb-24">{children}</main>
            <SiteFooter />
          </div>
        </PostHogProvider>
      </body>
    </html>
  );
}
