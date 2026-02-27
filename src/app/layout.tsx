import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import './globals.css';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteNav } from '@/components/layout/site-nav';
import { WebVitalsReporter } from '@/components/analytics/web-vitals';

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

export const metadata: Metadata = {
  title: {
    default: 'The Stack',
    template: '%s | The Stack'
  },
  description: 'Find credit cards by priorities, not hype.'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable} dark`}>
      <body className="min-h-screen bg-bg text-text-primary">
        <WebVitalsReporter />
        <div className="glow min-h-screen">
          <SiteNav />
          <main className="pb-24">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
