export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-14 border-b border-slate-200 bg-white" />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-40 animate-pulse rounded-md bg-slate-200" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-200/70" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200/80" />
          </div>
        </div>

        {[0, 1].map((section) => (
          <section key={section} className="mt-9">
            <div className="mb-3 h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0"
                >
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/5 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
