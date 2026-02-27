export default function Loading() {
  return (
    <div className="container-page pt-12">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-24 rounded bg-bg-surface" />
        <div className="h-10 w-72 rounded bg-bg-surface" />
        <div className="h-5 w-96 rounded bg-bg-surface" />
      </div>
    </div>
  );
}
