import type { Metadata } from 'next';
import { NewsletterSignup } from '@/components/newsletter-signup';

export const metadata: Metadata = {
  title: 'Newsletter',
  description:
    'Get bonus offers, timing tips, and free tools delivered to your inbox. Curated, not sponsored.',
};

export default function NewsletterPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-20">
      <div className="w-full max-w-xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand-teal">
          Stay ahead
        </p>
        <h1 className="mt-3 font-heading text-4xl text-text-primary md:text-5xl">
          Get Bonus Plays
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-text-secondary">
          Bonus offers, timing tips, and free tools delivered to your inbox.
          Curated, not sponsored.
        </p>

        <div className="mt-8">
          <NewsletterSignup
            source="newsletter_page"
            compact
            size="large"
            submitLabel="Get bonus plays"
          />
        </div>

        <p className="mt-6 text-xs text-text-muted">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
