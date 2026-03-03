import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'How The Stack helps people make more money from banks with transparent strategy.'
};

export default function AboutPage() {
  return (
    <div className="container-page pt-12">
      <h1 className="font-heading text-4xl">About The Stack</h1>
      <p className="mt-4 text-text-secondary">
        The Stack helps you make big banks work for you. We focus on practical bank and credit
        strategy that increases net value: bonuses, rewards, credits, APY, and avoided fees. We
        rank based on fit and expected value, not affiliate payouts.
      </p>
    </div>
  );
}
