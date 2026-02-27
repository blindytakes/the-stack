import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Card Directory',
  description: 'Browse and compare credit cards by rewards, fees, and benefits.'
};

export default function CardsPage() {
  return (
    <div className="container-page pt-12">
      <h1 className="font-[var(--font-heading)] text-4xl">Card Directory</h1>
      <p className="mt-4 text-text-secondary">
        We are building a searchable library of the best cards. Coming soon.
      </p>
    </div>
  );
}
