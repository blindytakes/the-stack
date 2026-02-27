import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'How The Stack ranks credit cards and why transparency matters.'
};

export default function AboutPage() {
  return (
    <div className="container-page pt-12">
      <h1 className="font-[var(--font-heading)] text-4xl">About The Stack</h1>
      <p className="mt-4 text-text-secondary">
        The Stack is a transparent, product-led guide to credit card decisions. We rank based on
        usefulness, not affiliate payouts.
      </p>
    </div>
  );
}
