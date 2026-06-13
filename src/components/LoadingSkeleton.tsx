export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-100 rounded-xl p-4">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}