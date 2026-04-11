export default function CardVsCardLoading() {
  return (
    <div className="container-page pt-6 md:pt-8">
      <div className="animate-pulse rounded-[2.3rem] border border-white/10 bg-bg-elevated p-6 md:p-10">
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_17rem] md:items-center md:gap-8">
          <div className="max-w-3xl space-y-4">
            <div className="h-4 w-28 rounded bg-bg-surface" />
            <div className="h-16 max-w-2xl rounded-3xl bg-bg-surface" />
            <div className="h-5 w-full max-w-xl rounded bg-bg-surface" />
            <div className="flex flex-col gap-3">
              <div className="h-12 w-52 rounded-full bg-bg-surface" />
            </div>
            <div className="h-5 w-48 rounded bg-bg-surface" />
          </div>
          <div className="mt-8 hidden h-52 rounded-[1.45rem] bg-bg-surface md:mt-0 md:block" />
        </div>
      </div>
    </div>
  );
}
