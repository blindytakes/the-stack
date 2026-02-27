export default function CardsLoading() {
  return (
    <div className="container-page pt-12 pb-16">
      <div className="mb-10 animate-pulse space-y-4">
        <div className="h-3 w-16 rounded bg-bg-surface" />
        <div className="h-10 w-48 rounded bg-bg-surface" />
        <div className="h-5 w-80 rounded bg-bg-surface" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-bg-surface p-5">
            <div className="h-3 w-16 rounded bg-bg-elevated" />
            <div className="mt-2 h-5 w-3/4 rounded bg-bg-elevated" />
            <div className="mt-3 h-4 w-full rounded bg-bg-elevated" />
            <div className="mt-1 h-4 w-2/3 rounded bg-bg-elevated" />
            <div className="mt-4 flex gap-3">
              <div className="h-3 w-12 rounded bg-bg-elevated" />
              <div className="h-3 w-12 rounded bg-bg-elevated" />
              <div className="h-3 w-12 rounded bg-bg-elevated" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
