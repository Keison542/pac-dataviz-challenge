"use client";

import { useMemo, useState } from "react";

type Props = {
  data: {
    country: string;
    value: number;
  }[];
  title?: string;
  unit?: string;
  insight?: string;
};

export function CountryComparison({ 
  data, 
  title = "Country Comparison", 
  unit = "",
  insight = "Comparing climate impact across Pacific nations"
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const countries = useMemo(() => {
    const map = new Map<string, number>();

    data.forEach((d) => {
      map.set(d.country, (map.get(d.country) ?? 0) + d.value);
    });

    return Array.from(map.entries())
      .map(([country, value]) => ({ country, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const maxValue = Math.max(...countries.map(c => c.value), 1);
  const totalSum = countries.reduce((sum, c) => sum + c.value, 0);
  
  // ONLY show top 6 when showAll is false
  const top6 = countries.slice(0, 6);
  const otherCountries = countries.slice(6);
  const otherSum = otherCountries.reduce((sum, c) => sum + c.value, 0);
  
  // This is the key fix: displayedCountries depends on showAll
  const displayedCountries = showAll ? countries : top6;
  
  // Calculate story insights (only if we have data)
  const topCountry = countries[0];
  const topPercentage = topCountry && totalSum > 0 ? ((topCountry.value / totalSum) * 100).toFixed(1) : 0;
  const topVsSecond = topCountry && countries[1]
    ? Number(((topCountry.value / countries[1].value) * 100 - 100).toFixed(0))
    : 0;
  const averageValue = totalSum / countries.length;

  // Find the smallest among top 6 for comparison
  const smallestInTop = top6[top6.length - 1];
  const hasOtherCountries = otherCountries.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      
      {/* Header with storytelling */}
      <div className="p-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          
          {countries.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
            >
              {showAll ? "← Show Top 6 Only" : `Show All ${countries.length}`}
            </button>
          )}
        </div>
        
        {/* Story insight banner - only show when NOT showing all */}
        {!showAll && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
            </p>
          </div>
        )}
        
        {/* Key findings summary - only show when viewing top 6 */}
        {!showAll && topCountry && totalSum > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-700">{topPercentage}%</div>
              <div className="text-xs text-slate-500">of total impact</div>
            </div>
            <div className="text-center p-2 bg-emerald-50 rounded-lg">
              <div className="text-lg font-bold text-emerald-700">
                {topVsSecond >= 0 ? `${topVsSecond}%` : `${Math.abs(Number(topVsSecond))}%`}
              </div>
              <div className="text-xs text-slate-500">higher than 2nd place</div>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-lg">
              <div className="text-lg font-bold text-amber-700">
                {countries.length}
              </div>
              <div className="text-xs text-slate-500">nations analyzed</div>
            </div>
          </div>
        )}
      </div>

      {/* Chart body */}
      <div className="p-5 pt-4">
        {/* Narrative paragraph - only when showing top 6 */}
        {!showAll && topCountry && totalSum > 0 && (
          <div className="mb-5 pb-3 border-b border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">{topCountry.country}</span> leads with{' '}
              <span className="font-bold text-blue-600">{topCountry.value.toLocaleString()}{unit}</span> — 
              representing <span className="font-semibold">{topPercentage}%</span> of the total impact across all Pacific nations.
              {Number(topVsSecond) > 20 && ` This is nearly ${topVsSecond}% higher than the next most affected country.`}
            </p>
          </div>
        )}

        {/* Country list - THIS now properly shows only top 6 when showAll is false */}
        <div className="space-y-4">
          {displayedCountries.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const rank = index + 1;
            const isTop = rank === 1;
            const isBottom = rank === displayedCountries.length && !showAll && hasOtherCountries;

            // Color gradient based on rank
            const getBarColor = (rank: number, isTop: boolean, isBottom: boolean) => {
              if (isTop) return "from-red-600 via-red-500 to-red-400";
              if (rank <= 2) return "from-orange-500 to-orange-400";
              if (rank <= 3) return "from-amber-500 to-amber-400";
              if (isBottom) return "from-blue-400 to-cyan-400";
              return "from-blue-500 to-cyan-500";
            };

            return (
              <div key={item.country} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono w-6 ${isTop ? 'font-bold text-red-600' : 'text-slate-400'}`}>
                      #{rank}
                    </span>
                    <span className={`text-sm truncate max-w-[160px] ${isTop ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                      {item.country}
                      {isTop && <span className="ml-1 text-xs text-red-500">👑</span>}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold ${isTop ? 'text-red-600' : 'text-slate-700'}`}>
                      {item.value.toLocaleString()}
                    </span>
                    {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
                  </div>
                </div>

                {/* Progress Bar with gradient */}
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getBarColor(rank, isTop, isBottom)} rounded-full transition-all duration-700 group-hover:brightness-110`}
                    style={{ width: `${percentage}%` }}
                  />
                  {/* Value label on bar for large percentages */}
                  {percentage > 15 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white drop-shadow-sm">
                      {Math.round(percentage)}%
                    </span>
                  )}
                </div>

                <div className="flex justify-between mt-0.5">
                  <span className="text-[10px] text-slate-400">
                    {percentage.toFixed(1)}% of max
                  </span>
                  {isBottom && !showAll && hasOtherCountries && (
                    <span className="text-[10px] text-slate-400">
                      +{otherCountries.length} other nations
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* "Other countries" summary when showing top 6 AND there are other countries */}
        {!showAll && hasOtherCountries && otherCountries.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>📊 Combined impact of other {otherCountries.length} nations:</span>
              <span className="font-semibold text-slate-700">
                {otherSum.toLocaleString()}{unit}
              </span>
            </div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-slate-400 to-slate-300 rounded-full"
                style={{ width: `${(otherSum / totalSum) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              The remaining {otherCountries.length} countries account for {((otherSum / totalSum) * 100).toFixed(1)}% of total impact
            </p>
          </div>
        )}

        {/* Show All button at bottom - only when not showing all AND has other countries */}
        {!showAll && hasOtherCountries && countries.length > 6 && (
          <div className="text-center mt-5 pt-2">
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 mx-auto"
            >
              Show all {countries.length} countries ↓
            </button>
          </div>
        )}

        {/* Empty state */}
        {countries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2 opacity-30">📊</div>
            <p className="text-sm text-slate-400">No comparison data available</p>
          </div>
        )}
      </div>

      {/* Footer insight - only when showing top 6 */}
      {!showAll && countries.length > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            {countries.length === 6 
              ? `These 6 nations represent the full dataset for this indicator.`
              : `Showing the top 6 most impacted nations. ${countries.length - 6} other nations have significantly lower impact levels.`}
          </p>
        </div>
      )}

      {/* Footer when showing all countries */}
      {showAll && countries.length > 6 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            Showing all {countries.length} nations. Click "Show Top 6 Only" to see the most impacted.
          </p>
        </div>
      )}
    </div>
  );
}