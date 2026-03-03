import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology',
  description: 'How The Stack evaluates offers using transparent payout math and fit signals.'
};

export default function MethodologyPage() {
  return (
    <div className="container-page pt-12 pb-16 max-w-3xl">
      <h1 className="font-heading text-4xl text-text-primary">Methodology</h1>

      <div className="mt-8 space-y-6 text-sm leading-7 text-text-secondary">
        <section>
          <h2 className="text-base font-semibold text-text-primary">Net value formula</h2>
          <p>
            We estimate annual value using a simple framework: welcome bonus value + rewards value
            + benefit/credit value + banking yield value - annual fees - avoidable interest and
            penalty costs.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text-primary">Scoring inputs</h2>
          <p>
            Recommendations prioritize expected value and fit against user inputs (goals, spend
            profile, fee tolerance, and credit tier). Offers that look flashy but do not fit your
            behavior are penalized.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text-primary">Data sources</h2>
          <p>
            Offer and benefit details come from issuer disclosures, partner feeds, and manual
            review. Data is verified periodically and reflected in both structured fields and
            long-form notes.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text-primary">Editorial independence</h2>
          <p>
            Affiliate relationships may exist, but recommendation logic is based on fit and value
            signals. We prefer transparency over maximizing conversion.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-text-primary">Outcome expectations</h2>
          <p>
            Claims like &quot;up to $3,000/year&quot; describe potential outcomes, not guarantees.
            Actual results vary by credit profile, available offers, spending patterns, and
            redemption choices.
          </p>
        </section>
      </div>
    </div>
  );
}
