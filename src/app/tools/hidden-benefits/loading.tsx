export default function HiddenBenefitsLoading() {
  return (
    <div className="container-page pt-12">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-20 rounded bg-bg-surface" />
        <div className="h-10 w-56 rounded bg-bg-surface" />
        <div className="h-5 w-80 rounded bg-bg-surface" />
      </div>
      <div className="mt-10 animate-pulse rounded-3xl border border-white/10 bg-bg-elevated p-10">
        <div className="h-12 w-full rounded-2xl bg-bg-surface" />
      </div>
    </div>
  );
}
