"use client";

import { scaleBand, scaleLinear } from "d3-scale";
import { useMemo, useState } from "react";

type RecordType = {
  country: string;
  value: number;
};

type Props = {
  width: number;
  height: number;
  data: {
    economicLoss: RecordType[];
    cropYield: RecordType[];
    touristArrivals: RecordType[];
    livestockYield: RecordType[];
    climateAlteringLand: RecordType[];
    populationGrowth: RecordType[];
    affectedPersons: RecordType[];
  };
  selectedCountry?: string;
};

const MARGIN = {
  top: 60,
  right: 30,
  bottom: 40,
  left: 120,
};

const METRIC_CONFIGS = {
  economicLoss: {
    title: "Economic Loss by Country",
    insight: "Who bears the highest financial burden from disasters?",
    icon: "💰",
    color: "#0891b2",
    gradientStart: "#0891b2",
    gradientEnd: "#06b6d4",
    unit: "USD",
    format: (v: number) => {
      if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
      if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
      return `$${v}`;
    },
    formatNumber: (v: number) => {
      if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
      return v.toString();
    }
  },
  cropYield: {
    title: "Crop Yield Impact by Country",
    insight: "Which nations face the greatest agricultural productivity loss?",
    icon: "🌾",
    color: "#10b981",
    gradientStart: "#059669",
    gradientEnd: "#10b981",
    unit: "t/ha",
    format: (v: number) => `${v.toFixed(1)} t/ha`,
    formatNumber: (v: number) => v.toFixed(1)
  },
  touristArrivals: {
    title: "Tourist Arrivals by Country",
    insight: "Which tourism-dependent economies are most vulnerable?",
    icon: "✈️",
    color: "#14b8a6",
    gradientStart: "#0d9488",
    gradientEnd: "#14b8a6",
    unit: "visitors",
    format: (v: number) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
      return v.toString();
    },
    formatNumber: (v: number) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
      return v.toString();
    }
  },
  livestockYield: {
    title: "Livestock Yield by Country",
    insight: "Which nations face livestock production challenges?",
    icon: "🐄",
    color: "#f59e0b",
    gradientStart: "#d97706",
    gradientEnd: "#f59e0b",
    unit: "tons",
    format: (v: number) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
      return v.toString();
    },
    formatNumber: (v: number) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
      return v.toString();
    }
  },
  climateAlteringLand: {
    title: "Climate-Altering Land by Country",
    insight: "Which nations have the most land affected by climate change?",
    icon: "🌍",
    color: "#8b5cf6",
    gradientStart: "#7c3aed",
    gradientEnd: "#8b5cf6",
    unit: "hectares",
    format: (v: number) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ha`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K ha`;
      return `${v} ha`;
    },
    formatNumber: (v: number) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
      return v.toString();
    }
  },
  populationGrowth: {
    title: "Population Growth by Country",
    insight: "Which nations have the highest population growth rates?",
    icon: "👥",
    color: "#ec4898",
    gradientStart: "#db2777",
    gradientEnd: "#ec4898",
    unit: "%",
    format: (v: number) => `${v.toFixed(1)}%`,
    formatNumber: (v: number) => v.toFixed(1)
  },
  affectedPersons: {
    title: "People Affected by Country",
    insight: "Which nations have the highest number of people affected by climate disasters?",
    icon: "🆘",
    color: "#ef4444",
    gradientStart: "#dc2626",
    gradientEnd: "#ef4444",
    unit: "people",
    format: (v: number) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
      return v.toString();
    },
    formatNumber: (v: number) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
      return v.toString();
    }
  }
};

export function MultiMetricRankedDashboard({ width, height, data, selectedCountry }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof METRIC_CONFIGS>("economicLoss");

  const currentMetric = METRIC_CONFIGS[selectedMetric];
  const currentData = data[selectedMetric];

  // Aggregate and rank data
  const ranked = useMemo(() => {
    if (!currentData) return [];
    const map = new Map<string, number>();
    currentData.forEach(d => {
      map.set(d.country, (map.get(d.country) ?? 0) + d.value);
    });
    return Array.from(map.entries())
      .map(([country, value]) => ({ country, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentData]);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const maxValue = Math.max(...ranked.map(d => d.value), 1);
  const totalSum = ranked.reduce((sum, d) => sum + d.value, 0);
  const totalCountries = ranked.length;

  const topCountry = ranked[0];
  const secondCountry = ranked[1];
  const thirdCountry = ranked[2];
  const bottomCountry = ranked[ranked.length - 1];

  const topPercentage = topCountry && totalSum > 0 ? ((topCountry.value / totalSum) * 100).toFixed(1) : 0;
  const topVsSecond = topCountry && secondCountry ? (topCountry.value / secondCountry.value) * 100 - 100 : 0;
  const top3Sum = ranked.slice(0, 3).reduce((sum, d) => sum + d.value, 0);
  const top3Percentage = totalSum > 0 ? (top3Sum / totalSum) * 100 : 0;

  const yScale = scaleBand()
    .domain(ranked.map(d => d.country))
    .range([0, boundsHeight])
    .padding(0.25);

  const xScale = scaleLinear()
    .domain([0, maxValue])
    .nice()
    .range([0, boundsWidth]);

  const ticks = xScale.ticks(6);

  if (!ranked.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white" style={{ width, height }}>
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30">📊</div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No data available for this metric
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Metric Selector - Single Row (Scrollable if needed) */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {(Object.keys(METRIC_CONFIGS) as Array<keyof typeof METRIC_CONFIGS>).map(key => {
            const config = METRIC_CONFIGS[key];
            const isActive = selectedMetric === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isActive ? 'shadow-sm' : 'opacity-70 grayscale'
                }`}
                style={{
                  backgroundColor: isActive ? `${config.color}15` : '#f1f5f9',
                  color: isActive ? config.color : '#64748b',
                  border: `1px solid ${isActive ? config.color : '#e2e8f0'}`
                }}
              >
                <span className="text-sm">{config.icon}</span>
                <span>{config.title.split(' by')[0]}</span>
                {isActive && (
                  <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header with Storytelling */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{currentMetric.title}</h3>
        <div className="p-3 bg-slate-50 rounded-lg border-l-4" style={{ borderColor: currentMetric.color }}>
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {currentMetric.insight}
          </p>
        </div>
      </div>

      {/* Key Findings Summary Cards */}
      {topCountry && totalSum > 0 && (
        <div className="mb-5 grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg" style={{ backgroundColor: `${currentMetric.color}10` }}>
            <div className="text-lg font-bold" style={{ color: currentMetric.color }}>{topPercentage}%</div>
            <div className="text-xs text-slate-500">from top nation</div>
          </div>
          <div className="text-center p-2 bg-emerald-50 rounded-lg">
            <div className="text-lg font-bold text-emerald-700">
              {topVsSecond >= 0 ? `${topVsSecond.toFixed(0)}%` : `${Math.abs(topVsSecond).toFixed(0)}%`}
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
            <span className="font-bold" style={{ color: currentMetric.color }}>{currentMetric.format(topCountry.value)}</span> — 
            representing <span className="font-semibold">{topPercentage}%</span> of the total regional impact.
            {topVsSecond > 20 && ` This is ${topVsSecond.toFixed(0)}% higher than ${secondCountry?.country}, the second most affected nation.`}
            {' '}The top 3 countries alone account for <span className="font-semibold">{top3Percentage.toFixed(0)}%</span> of all recorded {currentMetric.title.toLowerCase().split(' by')[0]}.
          </p>
        </div>
      )}

      {/* Chart */}
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={currentMetric.gradientStart} />
            <stop offset="100%" stopColor={currentMetric.gradientEnd} />
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
              y2={boundsHeight}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
          ))}

          {/* X-axis tick labels */}
          {ticks.map((t) => (
            <text
              key={`tick-${t}`}
              x={xScale(t)}
              y={boundsHeight + 20}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {currentMetric.formatNumber(t)}
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
                    {currentMetric.formatNumber(d.value)}
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
                    {currentMetric.formatNumber(d.value)}
                  </text>
                )}
              </g>
            );
          })}

          {/* X-axis label */}
          <text
            x={boundsWidth / 2}
            y={boundsHeight + 45}
            textAnchor="middle"
            fontSize={11}
            fill="#64748b"
            fontWeight={500}
          >
            {currentMetric.unit}
          </text>
        </g>
      </svg>

      {/* Distribution Insight Footer */}
      {ranked.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            📊 <span className="font-medium">Distribution insight:</span> The top 3 countries ({ranked.slice(0, 3).map(d => d.country).join(", ")}) 
            account for <span className="font-semibold">{top3Percentage.toFixed(1)}%</span> of the total {currentMetric.formatNumber(totalSum)} {currentMetric.unit}.
            {bottomCountry && ` The lowest among all is ${bottomCountry.country} with ${currentMetric.formatNumber(bottomCountry.value)}.`}
          </p>
        </div>
      )}
    </div>
  );
}