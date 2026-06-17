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

      {/* TITLE (assertive, not decorative) */}
      <div className="text-[1.6rem] font-semibold text-slate-900 mb-4">
        The Evidence Is Now Structural
      </div>

      {/* MAIN NARRATIVE */}
      <div className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">

        For <span className="font-medium text-slate-900">{selectedCountry}</span>,
        climate signals are no longer isolated events — they form a connected system of change.

        <br /><br />

        Rising temperatures are reinforcing environmental instability, which cascades into
        economic disruption and ultimately reshapes human livelihoods.

      </div>

      {/* EVIDENCE CALLOUT (important upgrade) */}
      {seaTrend > 0 && (
        <div className="mt-6 mx-auto max-w-xl rounded-lg border bg-slate-50 p-4">
          <div className="text-xs text-slate-500 mb-1">
            Observed Signal
          </div>

          <div className="text-lg font-semibold text-slate-900">
            Sea levels have risen {seaTrend.toFixed(1)}%
          </div>

          <div className="text-xs text-slate-500 mt-1">
            This shift is not linear — it is accelerating across multiple systems.
          </div>
        </div>
      )}

      {/* SYSTEM CHAIN (visual emphasis upgrade) */}
      <div className="mt-8 text-sm text-slate-700">
        <div className="font-medium text-slate-900 mb-2">
          Observed System Chain
        </div>

        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-100">
            Climate Drivers
          </span>
          <span>→</span>
          <span className="px-3 py-1 rounded-full bg-slate-100">
            Environmental Impact
          </span>
          <span>→</span>
          <span className="px-3 py-1 rounded-full bg-slate-100">
            Economic Consequence
          </span>
          <span>→</span>
          <span className="px-3 py-1 rounded-full bg-slate-100">
            Human Impact
          </span>
        </div>
      </div>

      {/* GLOBAL CONTEXT */}
      <div className="mt-6 text-sm text-slate-500">
        Across <span className="text-slate-900 font-medium">{countriesCount}</span> Pacific Island nations and territories,
        these patterns repeat with structural consistency.
      </div>

      {/* CLOSING STATEMENT (award-style ending) */}
      <div className="mt-10 text-[1.1rem] font-medium text-slate-900 max-w-xl mx-auto leading-relaxed">
        The question is no longer whether the system is changing —
        but how quickly adaptation can match its pace.
      </div>
    </div>
  );
}
