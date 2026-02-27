export default function CardDetailLoading() {
  return (
    <div className="container-page pt-12 pb-16">
      <div className="mb-8 h-4 w-32 animate-pulse rounded bg-bg-surface" />
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-24 rounded bg-bg-surface" />
          <div className="h-10 w-72 rounded bg-bg-surface" />
          <div className="h-5 w-full max-w-md rounded bg-bg-surface" />
          <div className="h-4 w-full max-w-lg rounded bg-bg-surface" />
          <div className="h-4 w-3/4 rounded bg-bg-surface" />
        </div>
        <div className="animate-pulse rounded-3xl border border-white/10 bg-bg-elevated p-6">
          <div className="h-3 w-20 rounded bg-bg-surface" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 rounded bg-bg-surface" />
                <div className="h-4 w-16 rounded bg-bg-surface" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-12 animate-pulse space-y-8 lg:max-w-2xl">
        <div className="h-3 w-28 rounded bg-bg-surface" />
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
