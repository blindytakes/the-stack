import type { Metadata } from 'next';
import { HiddenBenefitsTool } from '@/components/tools/hidden-benefits';

export const metadata: Metadata = {
  title: 'Hidden Benefits',
  description:
    'Discover the hidden perks of your credit card — from purchase protection to travel credits — with estimated annual values.'
};

export default function HiddenBenefitsPage() {
  return (
    <div className="container-page pt-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">Tool 02</p>
        <h1 className="mt-3 font-[var(--font-heading)] text-4xl text-text-primary">
          Hidden Benefits
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          Select your card and see which protections and credits are worth real money.
        </p>
      </div>
      <HiddenBenefitsTool />
    </div>
  );
}
