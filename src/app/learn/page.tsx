import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Playbooks on credit card strategy, timing, and maximizing value.'
};

export default function LearnPage() {
  return (
    <div className="container-page pt-12">
      <h1 className="font-[var(--font-heading)] text-4xl">Learn</h1>
      <p className="mt-4 text-text-secondary">
        Playbooks on card strategy, timing, and maximizing value. First articles landing soon.
      </p>
    </div>
  );
}
