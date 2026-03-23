import Image from 'next/image';
import type { LearnArticleImage } from '@/lib/learn-articles';

type BlogCoverImageProps = {
  image?: LearnArticleImage | null;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
};

export function BlogCoverImage({
  image,
  className = '',
  imgClassName = '',
  priority = false
}: BlogCoverImageProps) {
  if (!image) {
    return (
      <div
        aria-hidden="true"
        className={`bg-gradient-to-br from-brand-coral/15 via-bg-elevated to-bg-surface ${className}`}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 960px, (min-width: 768px) 720px, 100vw"
        className={imgClassName}
        style={{
          objectFit: 'cover',
          objectPosition: image.position ?? 'center'
        }}
      />
    </div>
  );
}
