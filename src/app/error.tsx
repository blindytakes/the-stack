'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-[var(--font-heading)] text-4xl text-text-primary">Something went wrong</h1>
      <p className="mt-4 max-w-md text-text-secondary">
        {process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset} className="mt-8">
        Try again
      </Button>
    </div>
  );
}
