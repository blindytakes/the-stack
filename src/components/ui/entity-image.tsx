type EntityImageProps = {
  src?: string;
  alt: string;
  label: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  priority?: boolean;
  fit?: 'contain' | 'cover';
  position?: string;
  scale?: number;
};

function buildClassName(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function buildInitials(label: string) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'TS';
}

export function EntityImage({
  src,
  alt,
  label,
  className,
  imgClassName,
  fallbackClassName,
  priority = false,
  fit = 'contain',
  position,
  scale = 1
}: EntityImageProps) {
  const initials = buildInitials(label);

  return (
    <div
      className={buildClassName(
        'relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_58%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]',
        className
      )}
    >
      {src ? (
        // Arbitrary editorial image hosts are allowed; these URLs are canonical data, not user uploads.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{
            ...(position ? { objectPosition: position } : {}),
            ...(scale !== 1 ? { transform: `scale(${scale})` } : {})
          }}
          className={buildClassName(
            'h-full w-full',
            fit === 'cover' ? 'object-cover' : 'object-contain',
            imgClassName
          )}
        />
      ) : (
        <div
          className={buildClassName(
            'flex h-full w-full items-center justify-center',
            fallbackClassName
          )}
          aria-hidden="true"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/20 text-lg font-semibold uppercase tracking-[0.24em] text-text-primary">
            {initials}
          </div>
        </div>
      )}
    </div>
  );
}
