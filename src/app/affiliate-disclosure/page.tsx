import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description: 'How affiliate relationships work on The Stack.'
};

export default function AffiliateDisclosurePage() {
  return (
    <div className="container-page pt-12 pb-16 max-w-3xl">
      <h1 className="font-[var(--font-heading)] text-4xl text-text-primary">Affiliate Disclosure</h1>
      <p className="mt-4 text-sm text-text-muted">Last updated: March 1, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-text-secondary">
        <p>
          Some links on The Stack are affiliate links. If you apply through those links, we may
          receive compensation from partner programs.
        </p>
        <p>
          Compensation can support operations, but it does not directly determine rankings in our
          tools or editorial recommendations.
        </p>
        <p>
          We aim to disclose affiliate relationships clearly and keep methodology transparent.
        </p>
      </div>
    </div>
  );
}
