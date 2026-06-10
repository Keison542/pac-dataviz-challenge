"use client";

import { scaleBand, scaleLinear } from "d3-scale";
import { useMemo } from "react";

const MARGIN = {
  top: 60,
  right: 30,
  bottom: 40,
  left: 120,
};

type RecordType = {
  country: string;
  value: number;
};

type Props = {
  width: number;
  height: number;
  data: RecordType[];
  title?: string;
  insight?: string;
  unit?: string;
};

function formatValue(v: number) {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v}`;
}

function formatNumber(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

export function RankedBarChart({ 
  width, 
  height, 
  data, 
  title = "Economic Impact by Country", 
  insight = "Comparing financial burden across Pacific nations",
  unit = "USD"
}: Props) {

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // Aggregate and rank all data (keep all countries)
  const ranked = useMemo(() => {
    const map = new Map<string, number>();

    data.forEach(d => {
      map.set(d.country, (map.get(d.country) ?? 0) + d.value);
    });

    return Array.from(map.entries())
      .map(([country, value]) => ({ country, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const maxValue = Math.max(...ranked.map(d => d.value), 1);
  const totalSum = ranked.reduce((sum, d) => sum + d.value, 0);
  const totalCountries = ranked.length;
  
  // Calculate story insights
  const topCountry = ranked[0];
  const secondCountry = ranked[1];
  const bottomCountry = ranked[ranked.length - 1];
  
  const topPercentage = topCountry && totalSum > 0 ? ((topCountry.value / totalSum) * 100).toFixed(1) : 0;
  const topVsSecond = topCountry && secondCountry ? ((topCountry.value / secondCountry.value) * 100 - 100).toFixed(0) : 0;
  const bottomPercentage = bottomCountry && totalSum > 0 ? ((bottomCountry.value / totalSum) * 100).toFixed(1) : 0;
  
  // Calculate concentration (how much top 3 countries dominate)
  const top3Sum = ranked.slice(0, 3).reduce((sum, d) => sum + d.value, 0);
  const top3Percentage = (top3Sum / totalSum) * 100;

  const yScale = scaleBand()
    .domain(ranked.map(d => d.country))
    .range([0, boundsHeight])
    .padding(0.25);

  const xScale = scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([0, boundsWidth]);

  const ticks = xScale.ticks(6);

  // Dynamic height adjustment based on number of countries
  const chartHeight = Math.max(boundsHeight, Math.min(600, ranked.length * 35));

  return (
    <div className="w-full">
      {/* Title Section */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      {/* Key Findings Summary Cards */}
      {topCountry && totalSum > 0 && (
        <div className="mb-5 grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-700">{topPercentage}%</div>
            <div className="text-xs text-slate-500">from top nation</div>
          </div>
          <div className="text-center p-2 bg-emerald-50 rounded-lg">
            <div className="text-lg font-bold text-emerald-700">
              {topVsSecond >= 0 ? `${topVsSecond}%` : `${Math.abs(Number(topVsSecond))}%`}
            </div>
            <div className="text-xs text-slate-500">higher than 2nd</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-700">
              {top3Percentage.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">from top 3 nations</div>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <div className="text-lg font-bold text-amber-700">
              {totalCountries}
            </div>
            <div className="text-xs text-slate-500">nations analyzed</div>
          </div>
        </div>
      )}

      {/* Narrative Paragraph */}
      {topCountry && totalSum > 0 && (
        <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">{topCountry.country}</span> leads with{' '}
            <span className="font-bold text-cyan-600">{formatValue(topCountry.value)}</span> in {unit.toLowerCase()} — 
            representing <span className="font-semibold">{topPercentage}%</span> of the total regional impact.
            {Number(topVsSecond) > 20 && ` This is ${topVsSecond}% higher than ${secondCountry?.country}, the second most affected nation.`}
            {' '}The top 3 countries alone account for <span className="font-semibold">{top3Percentage.toFixed(0)}%</span> of all recorded economic losses.
          </p>
        </div>
      )}

      {/* Chart */}
      <svg width={width} height={Math.max(height, MARGIN.top + chartHeight + MARGIN.bottom)} className="overflow-visible">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="topBarGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
          <linearGradient id="secondBarGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="thirdBarGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {/* Grid lines */}
          {ticks.map((t) => (
            <line
              key={t}
              x1={xScale(t)}
              x2={xScale(t)}
              y1={0}
              y2={chartHeight}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
          ))}

          {/* X-axis tick labels */}
          {ticks.map((t) => (
            <text
              key={`tick-${t}`}
              x={xScale(t)}
              y={chartHeight + 20}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {formatValue(t)}
            </text>
          ))}

          {/* Bars */}
          {ranked.map((d, i) => {
            const y = yScale(d.country)!;
            const isTop = i === 0;
            const isSecond = i === 1;
            const isThird = i === 2;
            
            let barColor;
            if (isTop) barColor = "url(#topBarGradient)";
            else if (isSecond) barColor = "url(#secondBarGradient)";
            else if (isThird) barColor = "url(#thirdBarGradient)";
            else barColor = "url(#barGradient)";
            
            return (
              <g key={d.country}>
                {/* Bar */}
                <rect
                  x={0}
                  y={y}
                  width={xScale(d.value)}
                  height={yScale.bandwidth()}
                  fill={barColor}
                  rx={4}
                  className="transition-all duration-500 hover:opacity-90"
                />
                
                {/* Value label on bar (if wide enough) */}
                {xScale(d.value) > 65 && (
                  <text
                    x={xScale(d.value) - 8}
                    y={y + yScale.bandwidth() / 2}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill="#ffffff"
                    fontWeight={600}
                  >
                    {formatValue(d.value)}
                  </text>
                )}

                {/* Country label */}
                <text
                  x={-12}
                  y={y + yScale.bandwidth() / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill={isTop ? "#be123c" : isSecond ? "#ea580c" : isThird ? "#d97706" : "#475569"}
                  fontWeight={isTop || isSecond || isThird ? 600 : 500}
                >
                  {d.country}
                  {isTop && <tspan className="text-red-500"> 👑</tspan>}
                  {isSecond && <tspan className="text-orange-500"> 🥈</tspan>}
                  {isThird && <tspan className="text-amber-500"> 🥉</tspan>}
                </text>

                {/* Value label outside bar (if bar is too narrow) */}
                {xScale(d.value) <= 65 && (
                  <text
                    x={xScale(d.value) + 8}
                    y={y + yScale.bandwidth() / 2}
                    dominantBaseline="middle"
                    fontSize={11}
                    fill={isTop ? "#be123c" : isSecond ? "#ea580c" : isThird ? "#d97706" : "#334155"}
                    fontWeight={isTop || isSecond || isThird ? 600 : 500}
                  >
                    {formatValue(d.value)}
                  </text>
                )}
              </g>
            );
          })}

          {/* X-axis label */}
          <text
            x={boundsWidth / 2}
            y={chartHeight + 45}
            textAnchor="middle"
            fontSize={11}
            fill="#64748b"
            fontWeight={500}
          >
            {unit} (logarithmic scale)
          </text>
        </g>
      </svg>

      {/* Distribution Insight Footer */}
      {ranked.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            📊 <span className="font-medium">Distribution insight:</span> The top 3 countries ({ranked.slice(0, 3).map(d => d.country).join(", ")}) 
            account for <span className="font-semibold">{top3Percentage.toFixed(1)}%</span> of the total {formatNumber(totalSum)} {unit}.
            {bottomCountry && ` The lowest among all is ${bottomCountry.country} with ${formatValue(bottomCountry.value)}.`}
          </p>
        </div>
      )}

      {/* Empty state */}
      {ranked.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <div className="text-4xl mb-2 opacity-30">📊</div>
          <p className="text-sm text-slate-400">No data available for this indicator</p>
        </div>
      )}
    </div>
  );
}