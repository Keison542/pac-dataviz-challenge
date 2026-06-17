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

      <div className="max-w-3xl mx-auto text-slate-600 leading-relaxed space-y-5">

        <p>
          Across the Pacific, climate change is not appearing as a single isolated
          trend. Rising temperatures, changing rainfall patterns, warming oceans,
          and sea-level rise are occurring simultaneously and reinforcing one another.
        </p>

        <p>
          The evidence shows that environmental pressures are translating into
          real-world consequences. Agricultural productivity becomes less stable,
          livelihood assets face increasing stress, economic losses accumulate,
          and communities experience growing exposure to climate-related risks.
        </p>

        <p>
          The interaction analysis demonstrates that these impacts do not occur
          independently. A change in one part of the climate system often produces
          cascading effects across environmental, economic, and human systems.
          This interconnectedness is one of the defining characteristics of climate
          vulnerability in Pacific Island nations.
        </p>

        {seaTrend > 0 && (
          <div className="my-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
              Key Observation
            </div>

            <div className="text-xl font-semibold text-slate-900">
              Sea levels increased by {seaTrend.toFixed(1)}%
            </div>

            <div className="text-sm text-slate-500 mt-2">
              Rising seas represent one of the clearest long-term signals visible
              across the region and amplify risks to coastal communities,
              infrastructure, and livelihoods.
            </div>
          </div>
        )}

        <p>
          While each country experiences climate impacts differently, the broader
          pattern remains consistent across the {countriesCount} Pacific Island
          nations and territories represented in this analysis: climate change is
          affecting environmental systems, economic resilience, and human wellbeing
          at the same time.
        </p>
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
