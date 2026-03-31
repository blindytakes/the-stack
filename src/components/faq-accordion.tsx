'use client';

import { useState, useRef, useCallback } from 'react';

type FaqItem = {
  question: string;
  answer: string;
};

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`rounded-2xl border bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 ${
        isOpen
          ? 'border-brand-teal/30 shadow-[0_0_15px_rgba(45,212,191,0.06)]'
          : 'border-white/10'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-xl font-semibold leading-snug text-text-primary md:text-[1.7rem]"
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        <span
          className={`text-2xl text-brand-teal transition-transform duration-300 ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? `${contentRef.current?.scrollHeight ?? 200}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <p ref={contentRef} className="pt-4 pr-8 text-lg leading-8 text-text-secondary md:text-xl md:leading-9">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <AccordionItem
          key={item.question}
          item={item}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </div>
  );
}
