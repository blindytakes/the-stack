function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
      <div className="h-3 w-24 rounded bg-bg-elevated" />
      <div className="mt-4 h-8 w-16 rounded bg-bg-elevated" />
      <div className="mt-3 h-3 w-32 rounded bg-bg-elevated" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="h-28 w-36 rounded-2xl bg-bg-elevated" />
        <div className="h-6 w-20 rounded-full bg-bg-elevated" />
      </div>
      <div className="mt-5 h-5 w-3/4 rounded bg-bg-elevated" />
      <div className="mt-3 h-4 w-1/2 rounded bg-bg-elevated" />
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="h-12 rounded-xl bg-bg-elevated" />
        <div className="h-12 rounded-xl bg-bg-elevated" />
        <div className="h-12 rounded-xl bg-bg-elevated" />
      </div>
      <div className="mt-5 flex gap-3">
        <div className="h-10 flex-1 rounded-full bg-bg-elevated" />
        <div className="h-10 flex-1 rounded-full bg-bg-elevated" />
      </div>
    </div>
  );
}

export default function BusinessLoading() {
  return (
    <div className="container-page min-h-[calc(100vh+8rem)] pt-12 pb-16">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-bg-surface" />
        <div className="mt-4 h-10 w-full max-w-xl rounded bg-bg-surface" />
        <div className="mt-4 h-5 w-full max-w-2xl rounded bg-bg-surface" />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>

        <div className="mt-8 flex justify-center">
          <div className="h-14 w-full max-w-[42rem] rounded-full bg-bg-surface" />
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-bg-surface p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_14rem_10rem]">
            <div className="h-11 rounded-full bg-bg-elevated" />
            <div className="h-11 rounded-full bg-bg-elevated" />
            <div className="h-11 rounded-full bg-bg-elevated" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="h-9 w-24 rounded-full bg-bg-elevated" />
            <div className="h-9 w-28 rounded-full bg-bg-elevated" />
            <div className="h-9 w-20 rounded-full bg-bg-elevated" />
            <div className="h-9 w-24 rounded-full bg-bg-elevated" />
            <div className="h-9 w-28 rounded-full bg-bg-elevated" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
