'use client';

import { useEffect, useState } from 'react';

type TOCProps = {
  sections: { heading: string }[];
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function TableOfContents({ sections }: TOCProps) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const headings = document.querySelectorAll('article h2[id]');
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Array.from(headings).indexOf(entry.target as Element);
            if (index !== -1) setActiveIndex(index);
          }
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0
      }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections]);

  function scrollToSection(index: number) {
    const id = slugify(sections[index].heading);
    const target = document.getElementById(id);
    if (!target) return;
    const yOffset = -96;
    const y = target.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
    setIsOpen(false);
  }

  const tocItems = sections.map((section, i) => (
    <button
      key={i}
      onClick={() => scrollToSection(i)}
      className={`block w-full text-left text-sm transition hover:text-text-primary ${
        activeIndex === i ? 'font-medium text-brand-teal' : 'text-text-muted'
      }`}
    >
      {section.heading}
    </button>
  ));

  return (
    <>
      {/* Desktop: sticky sidebar */}
      <nav className="hidden lg:block" aria-label="Table of contents">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Contents</p>
        <div className="mt-3 flex flex-col gap-2.5 border-l border-white/10 pl-4">
          {tocItems}
        </div>
      </nav>

      {/* Mobile: collapsible disclosure */}
      <div className="lg:hidden" aria-label="Table of contents">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-bg-surface px-5 py-3 text-sm font-medium text-text-primary"
        >
          <span>Contents</span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={`h-4 w-4 text-text-muted transition ${isOpen ? 'rotate-180' : ''}`}
          >
            <path
              d="M5 8l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {isOpen && (
          <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-white/10 bg-bg-surface px-5 py-4">
            {tocItems}
          </div>
        )}
      </div>
    </>
  );
}

