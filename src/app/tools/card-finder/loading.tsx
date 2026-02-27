export default function CardFinderLoading() {
  return (
    <div className="container-page pt-12">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-20 rounded bg-bg-surface" />
        <div className="h-10 w-48 rounded bg-bg-surface" />
        <div className="h-5 w-80 rounded bg-bg-surface" />
      </div>
      <div className="mt-10 animate-pulse rounded-3xl border border-white/10 bg-bg-elevated p-10">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-bg-surface" />
          <div className="h-2 w-36 rounded-full bg-bg-surface" />
        </div>
        <div className="mt-8 h-8 w-48 rounded bg-bg-surface" />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="h-12 rounded-2xl bg-bg-surface" />
          <div className="h-12 rounded-2xl bg-bg-surface" />
          <div className="h-12 rounded-2xl bg-bg-surface" />
        </div>
      </div>
    </div>
  );
}
