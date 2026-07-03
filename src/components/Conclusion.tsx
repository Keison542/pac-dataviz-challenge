interface ConclusionProps {
  selectedCountry: string;
  seaTrend: number;
  countriesCount: number;
}

export function Conclusion({
  selectedCountry,
  seaTrend,
  countriesCount,
}: ConclusionProps) {
  return (
    <div className="text-center mt-20 pt-10 border-t border-slate-200">

      <div className="text-[1.8rem] font-semibold text-slate-900 mb-4">
        What the Data Reveals
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2 text-xs">
        <span className="px-3 py-1 rounded-full bg-slate-100">
          Climate Drivers
        </span>
        <span>→</span>
        <span className="px-3 py-1 rounded-full bg-slate-100">
          Environmental Change
        </span>
        <span>→</span>
        <span className="px-3 py-1 rounded-full bg-slate-100">
          Livelihood Impacts
        </span>
        <span>→</span>
        <span className="px-3 py-1 rounded-full bg-slate-100">
          Economic Consequences
        </span>
        <span>→</span>
        <span className="px-3 py-1 rounded-full bg-slate-100">
          Human Outcomes
        </span>
      </div>

      <div className="mt-12 max-w-2xl mx-auto text-[1.15rem] font-medium text-slate-900 leading-relaxed">
        The central insight is not that individual climate indicators are changing.
        It is that environmental, economic, and human systems are becoming
        increasingly connected through climate impacts, making resilience a
        whole-system challenge rather than a sector-specific one.
      </div>
    </div>
  );
}
