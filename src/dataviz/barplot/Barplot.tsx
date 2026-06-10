import { scaleBand, scaleLinear } from "d3-scale";
import { useMemo, useState } from "react";
import type { InteractionData } from "@/dataviz/barplot/types/interaction";

const MARGIN = { top: 60, right: 180, bottom: 80, left: 140 };

type Props = {
  width: number;
  height: number;
  data: any[];
  dataType: string;
  setSelectedCountry: (c: string) => void;
  highlightedYear?: number;
  stackBy?: string;
  title?: string;
  insight?: string;
};

export const Barplot = ({
  width,
  height,
  data,
  dataType,
  setSelectedCountry,
  highlightedYear,
  stackBy = "year",
  title = "Direct Disaster Economic Loss",
  insight = "Each bar segment represents economic loss from disasters in a given year. Darker colors indicate more recent events.",
}: Props) => {
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const [hovered, setHovered] = useState<InteractionData | null>(null);
  const [showAllYears, setShowAllYears] = useState(false);

  const countries = useMemo(
    () => Array.from(new Set(data.map((d) => d.country))).sort(),
    [data]
  );

  const stackKeys = useMemo(
    () => Array.from(new Set(data.map((d) => d[stackBy]))).sort((a, b) => a - b),
    [data, stackBy]
  );

  // Show only recent years or all based on toggle
  const displayedKeys = useMemo(() => {
    if (showAllYears || stackKeys.length <= 6) return stackKeys;
    return stackKeys.slice(-6);
  }, [stackKeys, showAllYears]);

  const hasData = data.length > 0 && countries.length > 0 && displayedKeys.length > 0;

  const stackedData = useMemo(() => {
    if (!hasData) return [];

    const countryMap = new Map();

    countries.forEach(country => {
      const countryData = data.filter(d => d.country === country);
      let cumulative = 0;
      const segments: any[] = [];

      displayedKeys.forEach(key => {
        const item = countryData.find(d => d[stackBy] === key);
        const value = item ? Math.max(0, item.value ?? 0) : 0;

        segments.push({
          key,
          value,
          start: cumulative,
          end: cumulative + value,
          country,
          year: item?.year
        });

        cumulative += value;
      });

      countryMap.set(country, segments);
    });

    return Array.from(countryMap.values()).flat();
  }, [data, countries, displayedKeys, stackBy, hasData]);

  const maxTotal = useMemo(() => {
    if (!hasData) return 1;
    const totals = countries.map(country => 
      data
        .filter(d => d.country === country)
        .reduce((sum, d) => sum + Math.max(0, d.value ?? 0), 0)
    );
    return Math.max(...totals, 1);
  }, [data, countries, hasData]);

  // Calculate story insights
  const totalLoss = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const topCountry = useMemo(() => {
    const totals = countries.map(country => ({
      country,
      total: data.filter(d => d.country === country).reduce((sum, d) => sum + (d.value || 0), 0)
    }));
    return totals.sort((a, b) => b.total - a.total)[0];
  }, [data, countries]);

  const worstYear = useMemo(() => {
    const totals = displayedKeys.map(key => ({
      year: key,
      total: data.filter(d => d[stackBy] === key).reduce((sum, d) => sum + (d.value || 0), 0)
    }));
    return totals.sort((a, b) => b.total - a.total)[0];
  }, [data, displayedKeys, stackBy]);

  const yScale = useMemo(
    () => scaleBand()
      .domain(countries)
      .range([0, boundsHeight])
      .padding(0.3),
    [countries, boundsHeight]
  );

  const xScale = useMemo(
    () => scaleLinear()
      .domain([0, maxTotal * 1.08])
      .range([0, boundsWidth]),
    [maxTotal, boundsWidth]
  );

  const formatTick = (value: number): string => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  // Color based on year (more recent = darker)
  const getColor = (key: string) => {
    const index = displayedKeys.indexOf(key);
    const total = displayedKeys.length;
    const intensity = 0.3 + (index / total) * 0.7;
    return `rgba(6, 182, 212, ${intensity})`;
  };

  // Empty State
  if (!hasData) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30">📊</div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No economic loss data available for the selected filter
          </p>
        </div>
      </div>
    );
  }

  const bars = stackedData.map((segment, i) => {
    const y = yScale(segment.country)!;
    const barHeight = yScale.bandwidth();
    const xStart = xScale(segment.start);
    const xEnd = xScale(segment.end);
    const barWidth = Math.max(2, xEnd - xStart);

    return (
      <g key={`${segment.country}-${segment.key}-${i}`}>
        <rect
          x={xStart}
          y={y}
          width={barWidth}
          height={barHeight}
          fill={getColor(segment.key)}
          rx={4}
          className="cursor-pointer transition-opacity hover:opacity-80"
          onMouseEnter={() => {
            setHovered({
              x: xEnd + 10,
              y: y + barHeight / 2,
              value: segment.value,
              label: `${segment.country} • ${segment.key}`,
            });
          }}
          onMouseLeave={() => setHovered(null)}
          onClick={() => setSelectedCountry(segment.country)}
        />

        {barWidth > 60 && segment.value > 0 && (
          <text
            x={xStart + barWidth / 2}
            y={y + barHeight / 2 + 4}
            textAnchor="middle"
            fontSize="10"
            fill="#ffffff"
            fontWeight="600"
          >
            {segment.value >= 1_000_000 ? `${(segment.value / 1_000_000).toFixed(0)}M` : segment.value >= 1_000 ? `${(segment.value / 1_000).toFixed(0)}K` : segment.value}
          </text>
        )}
      </g>
    );
  });

  return (
    <div className="w-full">
      {/* Header with Storytelling */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-cyan-500">
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      {/* Key Findings Summary Cards */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-cyan-50 rounded-lg">
          <div className="text-lg font-bold text-cyan-700">{formatTick(totalLoss)}</div>
          <div className="text-xs text-slate-500">total economic loss</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-lg font-bold text-amber-700">{topCountry?.country || "—"}</div>
          <div className="text-xs text-slate-500">most impacted nation</div>
          <div className="text-[10px] text-slate-400">{formatTick(topCountry?.total || 0)} total</div>
        </div>
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <div className="text-lg font-bold text-emerald-700">{worstYear?.year || "—"}</div>
          <div className="text-xs text-slate-500">worst year recorded</div>
          <div className="text-[10px] text-slate-400">{formatTick(worstYear?.total || 0)} total</div>
        </div>
      </div>

      {/* Year Range Toggle */}
      {stackKeys.length > 6 && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => setShowAllYears(!showAllYears)}
            className="text-xs font-medium text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
          >
            {showAllYears ? "← Show Recent 6 Years" : `Show All ${stackKeys.length} Years →`}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-500">Darker = more recent</span>
        <div className="flex items-center gap-2">
          {displayedKeys.slice(-3).map((key, i) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(key) }}></div>
              <span className="text-slate-400">{key}</span>
            </div>
          ))}
          <span className="text-slate-400">→</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(displayedKeys[displayedKeys.length - 1]) }}></div>
            <span className="text-slate-600 font-medium">{displayedKeys[displayedKeys.length - 1]}</span>
          </div>
        </div>
      </div>

      <svg width={width} height={height} className="overflow-visible">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid lines */}
          {xScale.ticks(6).map((v, i) => (
            <line
              key={`grid-${i}`}
              x1={xScale(v)}
              x2={xScale(v)}
              y1={0}
              y2={boundsHeight}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Horizontal grid lines */}
          {countries.map((country) => {
            const yPos = yScale(country)! + yScale.bandwidth() / 2;
            return (
              <line
                key={`hgrid-${country}`}
                x1={0}
                x2={boundsWidth}
                y1={yPos}
                y2={yPos}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            );
          })}

          {bars}

          {/* X-axis ticks */}
          {xScale.ticks(6).map((v, i) => (
            <text
              key={`x-${i}`}
              x={xScale(v)}
              y={boundsHeight + 25}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {formatTick(v)}
            </text>
          ))}

          {/* Country labels */}
          {countries.map((country, i) => {
            const yPos = yScale(country)! + yScale.bandwidth() / 2;
            const isTopCountry = country === topCountry?.country;
            return (
              <text
                key={i}
                x={-14}
                y={yPos + 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="11"
                fill={isTopCountry ? "#d97706" : "#475569"}
                fontWeight={isTopCountry ? 600 : 400}
                className="cursor-pointer hover:fill-slate-800"
                onClick={() => setSelectedCountry(country)}
              >
                {country}
                {isTopCountry && <tspan className="text-amber-500"> 👑</tspan>}
              </text>
            );
          })}

          {/* Axis Titles */}
          <text
            x={boundsWidth / 2}
            y={boundsHeight + 52}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
            fontWeight="500"
          >
            Total Economic Loss (USD)
          </text>

          <text
            transform={`rotate(-90) translate(${-boundsHeight / 2}, -85)`}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
            fontWeight="500"
          >
            Country
          </text>
        </g>
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none bg-white border border-slate-200 shadow-lg px-4 py-2 rounded-lg z-50"
          style={{
            left: hovered.x + MARGIN.left + 25,
            top: hovered.y + MARGIN.top - 30,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {hovered.label}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-800 tabular-nums">
            {formatTick(hovered.value || 0)}
          </div>
        </div>
      )}

      {/* Footer Insight */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          📊 Click any bar or country name to drill down · Darker segments = more recent years · 
          {topCountry?.country} accounts for the largest share of total losses
        </p>
      </div>
    </div>
  );
};