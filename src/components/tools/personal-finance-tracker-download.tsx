import { PERSONAL_FINANCE_TRACKER_DOWNLOAD_PATH } from '@/lib/personal-finance-tracker';

const previewRows = [
  {
    label: 'Housing',
    amount: '-$1,650',
    accentClassName: 'bg-brand-coral/80'
  },
  {
    label: 'Bills',
    amount: '-$420',
    accentClassName: 'bg-brand-gold/80'
  },
  {
    label: 'Savings',
    amount: '+$600',
    accentClassName: 'bg-brand-teal/80'
  }
] as const;

export function PersonalFinanceTrackerDownload() {
  return (
    <section className="relative overflow-hidden rounded-[2.3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,20,0.99),rgba(11,17,29,0.98))] px-6 py-9 shadow-[0_28px_90px_rgba(0,0,0,0.3)] md:px-10 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:38px_38px] opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(45,212,191,0.12),transparent_24%),radial-gradient(circle_at_88%_14%,rgba(255,255,255,0.05),transparent_28%)]" />
      <div className="pointer-events-none absolute -left-12 top-[-2rem] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.15),transparent_72%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-3rem] top-[-2rem] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_72%)] blur-3xl" />

      <div className="relative md:grid md:grid-cols-[minmax(0,1fr)_17rem] md:items-center md:gap-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-teal">Free Download</p>
          <h1 className="mt-4 font-heading text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.05em] text-text-primary">
            Download the personal finance tracker
          </h1>
          <p className="mt-4 max-w-2xl text-[1.02rem] leading-7 text-text-secondary">
            A simple spreadsheet for spending, bills, savings goals, and monthly cash flow.
          </p>

          <div className="mt-7 flex flex-col items-start gap-3">
            <a
              href={PERSONAL_FINANCE_TRACKER_DOWNLOAD_PATH}
              download
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-black shadow-[0_14px_36px_rgba(45,212,191,0.2)] transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <span>Download Tracker (.xlsx)</span>
              <span className="transition-transform group-hover:translate-y-0.5" aria-hidden>
                ↓
              </span>
            </a>
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            Downloads a spreadsheet copy for Google Sheets or Excel.
          </p>
        </div>

        <div className="relative mt-8 hidden md:block md:mt-0">
          <div className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-[1.45rem] border border-white/6 bg-white/[0.02]" />
          <div className="relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,26,40,0.98),rgba(10,15,24,0.99))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
            <div className="pointer-events-none absolute right-[-1rem] top-2 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.12),transparent_70%)] blur-2xl" />

            <div className="relative flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
                Sample Sheet
              </p>
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand-teal/80" />
              </div>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-[1.05rem] border border-white/10 bg-white/[0.03]">
              <div className="grid grid-cols-[1fr_auto] border-b border-white/8 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                <span>Category</span>
                <span>Amount</span>
              </div>
              <div>
                {previewRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-white/6 px-3 py-3 first:border-t-0"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${row.accentClassName}`} />
                    <span className="text-sm text-text-secondary">{row.label}</span>
                    <span className="text-sm font-semibold text-text-primary">{row.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
