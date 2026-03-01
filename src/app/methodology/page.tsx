import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'How The Stack evaluates and ranks cards.'
};

export default function MethodologyPage() {
  return (
    <div className="container-page pt-12 pb-16 max-w-3xl">
      <h1 className="font-[var(--font-heading)] text-4xl text-text-primary">Methodology</h1>

      <div className="mt-8 space-y-6 text-sm leading-7 text-text-secondary">
        <section>
          <h2 className="text-base font-semibold text-text-primary">Scoring inputs</h2>
          <p>
            Recommendations prioritize expected value from rewards, bonus value, fees, and benefit
            fit against user inputs (goals, spend profile, fee tolerance, and credit tier).
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text-primary">Data sources</h2>
          <p>
            Card details come from issuer disclosures, partner feeds, and manual review. Offers are
            verified periodically and reflected in both structured fields and long-form notes.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text-primary">Editorial independence</h2>
          <p>
            Affiliate relationships may exist, but recommendation logic is based on fit and value
            signals. We prefer transparency over maximizing conversion.
          </p>
        </section>
      </div>
    </div>
  );
}
