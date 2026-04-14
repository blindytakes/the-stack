'use client';

import { useRouter } from 'next/navigation';

type DetailPageDismissButtonProps = {
  fallbackHref: string;
  ariaLabel?: string;
  className?: string;
};

export function DetailPageDismissButton({
  fallbackHref,
  ariaLabel = 'Close details',
  className = ''
}: DetailPageDismissButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-text-muted transition hover:bg-black/60 hover:text-text-primary ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
