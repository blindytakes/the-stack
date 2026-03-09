type SummaryStatCardProps = {
  label: string;
  value: string;
  description: string;
  tone?: 'neutral' | 'teal' | 'gold';
};

export function SummaryStatCard({
  label,
  value,
  description,
  tone = 'neutral'
}: SummaryStatCardProps) {
  const toneClass =
    tone === 'teal'
      ? 'border-brand-teal/25 bg-brand-teal/10'
      : tone === 'gold'
        ? 'border-brand-gold/20 bg-brand-gold/10'
        : 'border-white/10 bg-bg/40';

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p className="mt-2 font-heading text-4xl text-text-primary">{value}</p>
      <p className="mt-2 text-base leading-7 text-text-secondary">{description}</p>
    </div>
  );
}
