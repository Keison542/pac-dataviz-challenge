interface ConclusionProps {
  selectedCountry: string;
  seaTrend: number;
  countriesCount: number;
}

export function Conclusion({ selectedCountry, seaTrend, countriesCount }: ConclusionProps) {
  return (
    <div className="text-center mt-16 pt-8 border-t border-slate-200">
      <div className="relative">
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-5xl opacity-20">🌊</div>
        <div className="text-[1.5rem] font-semibold mb-4 text-slate-900">🌿 The Evidence Is Unequivocal</div>
        <div className="text-base text-slate-600 max-w-[720px] mx-auto leading-relaxed">
          For <strong>{selectedCountry}</strong>, the data confirms the complete causal chain: 
          <strong style={{ color: "#D85A30" }}> rising temperatures</strong> drive <strong style={{ color: "#2E86AB" }}>environmental changes</strong>, 
          which create <strong style={{ color: "#EF9F27" }}>economic losses</strong> and ultimately 
          <strong style={{ color: "#7F77DD" }}> affect human communities</strong>.
          {seaTrend > 0 && ` Sea levels have risen ${seaTrend.toFixed(1)}% — and the trend is accelerating.`}
        </div>
        <div className="text-base text-slate-900 font-medium max-w-[720px] mx-auto leading-relaxed mt-4">
          The question is no longer "Is climate change real?" but "How will we respond?"
        </div>
        <div className="text-sm text-slate-500 max-w-[720px] mx-auto leading-relaxed mt-4">
          📊 Tracking: Climate Drivers → Environmental Impact → Economic Consequence → Human Consequence<br />
          🌏 {countriesCount} Pacific Island nations and territories<br />
        </div>
      </div>
    </div>
  );
}