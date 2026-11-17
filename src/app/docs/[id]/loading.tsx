export default function DocumentLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-14 border-b border-slate-200 bg-white" />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-12 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 px-6 pb-5 pt-7 sm:px-10 sm:pt-9">
            <div className="h-8 w-3/4 animate-pulse rounded-md bg-slate-200" />
            <div className="h-3 w-56 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="space-y-3 border-b border-slate-100 px-6 py-2 sm:px-10">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-8 w-9 animate-pulse rounded-md bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="space-y-3 px-6 py-6 sm:px-10 sm:py-8">
            {[100, 92, 96, 80, 88, 70].map((width, index) => (
              <div
                key={index}
                className="h-4 animate-pulse rounded bg-slate-100"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
