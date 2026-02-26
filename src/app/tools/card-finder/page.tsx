import { CardFinderTool } from '@/components/tools/card-finder';

export default function CardFinderPage() {
  return (
    <div className="container-page pt-12">
      <div className="mb-10 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-teal">Tool 01</p>
        <h1 className="mt-3 font-[var(--font-heading)] text-4xl text-text-primary">Card Finder</h1>
        <p className="mt-4 text-lg text-text-secondary">
          Answer a few questions to get a short list of cards tailored to your spend, fees, and goals.
        </p>
      </div>
      <CardFinderTool />
    </div>
  );
}
