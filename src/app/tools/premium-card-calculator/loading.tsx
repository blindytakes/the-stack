export default function PremiumCardCalculatorLoading() {
  return (
    <div className="container-page pt-12">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded bg-bg-surface" />
        <div className="h-10 w-72 rounded bg-bg-surface" />
        <div className="h-5 w-[32rem] max-w-full rounded bg-bg-surface" />
      </div>
      <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <div className="h-80 rounded-[2rem] border border-white/10 bg-bg-elevated" />
          <div className="h-72 rounded-[2rem] border border-white/10 bg-bg-elevated" />
          <div className="h-96 rounded-[2rem] border border-white/10 bg-bg-elevated" />
        </div>
        <div className="h-[38rem] rounded-[2rem] border border-white/10 bg-bg-elevated" />
      </div>
    </div>
  );
}
