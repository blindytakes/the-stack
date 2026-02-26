export function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="container-page flex flex-col gap-4 py-10 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-[var(--font-heading)] text-lg text-text-primary">The Stack</div>
          <p>Independent card intelligence. No hype, just signal.</p>
        </div>
        <div className="flex flex-wrap gap-6">
          <span>Privacy</span>
          <span>Transparency</span>
          <span>Contact</span>
        </div>
      </div>
    </footer>
  );
}
