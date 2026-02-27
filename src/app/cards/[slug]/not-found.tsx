import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CardNotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-brand-coral">404</p>
      <h1 className="mt-3 font-[var(--font-heading)] text-4xl text-text-primary">Card not found</h1>
      <p className="mt-4 max-w-md text-text-secondary">
        We couldn&apos;t find that card. It may have been removed or the URL might be wrong.
      </p>
      <Link href="/cards" className="mt-8">
        <Button>Browse all cards</Button>
      </Link>
    </div>
  );
}
