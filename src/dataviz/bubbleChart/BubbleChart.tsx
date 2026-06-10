"use client";

import { scaleBand, scaleLinear, scaleSqrt } from "d3-scale";
import { useMemo, useState } from "react";

type DataPoint = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  width: number;
  height: number;
  data: DataPoint[];
  title?: string;
  insight?: string;
};

const MARGIN = {
  top: 50,
  right: 40,
  bottom: 70,
  left: 140,
};

export function BubbleChart({
  width,
  height,
  data,
  title = "People Affected by Disasters",
  insight = "Larger bubbles reveal years when climate disasters displaced the most people",
}: Props) {
  const [hovered, setHovered] = useState<DataPoint | null>(null);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const countries = useMemo(
    () => Array.from(new Set(data.map((d) => d.country))).sort(),
    [data]
  );

  const years = useMemo(
    () => Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b),
    [data]
  );

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const totalAffected = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  
  // Find the single largest event
  const largestEvent = useMemo(() => {
    return data.reduce((max, d) => d.value > max.value ? d : max, data[0]);
  }, [data]);

  // Find the year with highest total impact
  const yearTotals = useMemo(() => {
    const totals = new Map<number, number>();
    data.forEach(d => {
      totals.set(d.year, (totals.get(d.year) || 0) + d.value);
    });
    let maxYear = 0;
    let maxTotal = 0;
    totals.forEach((total, year) => {
      if (total > maxTotal) {
        maxTotal = total;
        maxYear = year;
      }
    });
    return { year: maxYear, total: maxTotal };
  }, [data]);

  const xScale = useMemo(
    () =>
      scaleBand<number>()
        .domain(years)
        .range([0, boundsWidth])
        .padding(0.25),
    [years, boundsWidth]
  );

  const yScale = useMemo(
    () =>
      scaleBand<string>()
        .domain(countries)
        .range([0, boundsHeight])
        .padding(0.35),
    [countries, boundsHeight]
  );

  const radiusScale = useMemo(
    () => scaleSqrt().domain([0, maxValue]).range([4, 38]),
    [maxValue]
  );

  const colorScale = (value: number) => {
    if (value > maxValue * 0.8) return "#e11d48";
    if (value > maxValue * 0.5) return "#f43f5e";
    if (value > maxValue * 0.3) return "#fb7185";
    return "#fda4af";
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white" style={{ width, height }}>
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-30">○</div>
          <p className="text-sm text-slate-500">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Storytelling */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-rose-500">
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      {/* Key Findings Summary Cards */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-rose-50 rounded-lg">
          <div className="text-lg font-bold text-rose-700">
            {(totalAffected / 1000000).toFixed(1)}M
          </div>
          <div className="text-xs text-slate-500">total people affected</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-lg font-bold text-amber-700">
            {(largestEvent?.value / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-slate-500">largest single event</div>
          <div className="text-[10px] text-slate-400">{largestEvent?.country}, {largestEvent?.year}</div>
        </div>
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <div className="text-lg font-bold text-emerald-700">
            {yearTotals.year || "—"}
          </div>
          <div className="text-xs text-slate-500">worst year</div>
          <div className="text-[10px] text-slate-400">{(yearTotals.total / 1000).toFixed(0)}K affected</div>
        </div>
      </div>

      {/* Narrative Paragraph */}
      {largestEvent && (
        <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">
            The data reveals that <span className="font-bold text-slate-900">{largestEvent.country}</span> experienced the 
            single largest disaster impact in <span className="font-bold text-slate-900">{largestEvent.year}</span>, with{' '}
            <span className="font-bold text-rose-600">{largestEvent.value.toLocaleString()} people</span> affected.
            {yearTotals.year && ` The most devastating year across all Pacific nations was ${yearTotals.year}, when ${(yearTotals.total / 1000).toFixed(0)}K people were displaced or impacted.`}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="text-slate-500">Bubble size = people affected</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Severity:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-slate-400">High</span>
            <div className="w-3 h-3 rounded-full bg-rose-300 ml-2"></div>
            <span className="text-slate-400">Medium</span>
            <div className="w-3 h-3 rounded-full bg-rose-200 ml-2"></div>
            <span className="text-slate-400">Low</span>
          </div>
        </div>
      </div>

      <svg width={width} height={height} className="overflow-visible">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Vertical Grid Lines */}
          {years.map((year) => (
            <line
              key={year}
              x1={(xScale(year) ?? 0) + xScale.bandwidth() / 2}
              x2={(xScale(year) ?? 0) + xScale.bandwidth() / 2}
              y1={0}
              y2={boundsHeight}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Horizontal Grid Lines */}
          {countries.map((country) => (
            <line
              key={country}
              x1={0}
              x2={boundsWidth}
              y1={(yScale(country) ?? 0) + yScale.bandwidth() / 2}
              y2={(yScale(country) ?? 0) + yScale.bandwidth() / 2}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
          ))}

          {/* Bubbles */}
          {data.map((d, i) => {
            const cx = (xScale(d.year) ?? 0) + xScale.bandwidth() / 2;
            const cy = (yScale(d.country) ?? 0) + yScale.bandwidth() / 2;
            const r = radiusScale(d.value);
            const isLargest = d === largestEvent;

            return (
              <g key={i}>
                {/* Outer glow for largest bubble */}
                {isLargest && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r + 4}
                    fill="none"
                    stroke="#e11d48"
                    strokeWidth="2"
                    opacity="0.3"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={colorScale(d.value)}
                  fillOpacity={0.85}
                  stroke="#ffffff"
                  strokeWidth={isLargest ? 3 : 1.5}
                  className="cursor-pointer transition-all duration-200 hover:opacity-100"
                  style={{ opacity: 0.9 }}
                  onMouseEnter={() => setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                />
                {/* Label inside very large bubble */}
                {r > 25 && (
                  <text
                    x={cx}
                    y={cy + 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#ffffff"
                    className="pointer-events-none"
                  >
                    {(d.value / 1000).toFixed(0)}K
                  </text>
                )}
              </g>
            );
          })}

          {/* X Axis - Years */}
          {years.map((year) => (
            <text
              key={year}
              x={(xScale(year) ?? 0) + xScale.bandwidth() / 2}
              y={boundsHeight + 22}
              textAnchor="middle"
              fill="#64748b"
              fontSize="11"
              fontWeight={year === yearTotals.year ? "bold" : "normal"}
              fill={year === yearTotals.year ? "#d97706" : "#64748b"}
            >
              {year}
              {year === yearTotals.year && <tspan className="text-amber-500"> ●</tspan>}
            </text>
          ))}

          {/* Y Axis - Countries */}
          {countries.map((country) => (
            <text
              key={country}
              x={-12}
              y={(yScale(country) ?? 0) + yScale.bandwidth() / 2 + 3}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#475569"
              fontSize="11"
              fontWeight={country === largestEvent?.country ? "bold" : "normal"}
              className={country === largestEvent?.country ? "text-rose-600" : ""}
            >
              {country}
              {country === largestEvent?.country && <tspan className="text-rose-500"> 👑</tspan>}
            </text>
          ))}

          {/* Axis Titles */}
          <text
            x={boundsWidth / 2}
            y={boundsHeight + 48}
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontWeight="500"
          >
            Year
          </text>
        </g>
      </svg>

      {/* Enhanced Tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none bg-white border border-slate-200 shadow-lg px-4 py-3 rounded-lg z-50"
          style={{
            left: (xScale(hovered.year) ?? 0) + MARGIN.left + (xScale.bandwidth() / 2) + 25,
            top: (yScale(hovered.country) ?? 0) + MARGIN.top + (yScale.bandwidth() / 2) - 20,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {hovered.country} • {hovered.year}
            </span>
          </div>
          <div className="text-xl font-bold text-rose-600 tabular-nums">
            {hovered.value.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            people affected by disasters
          </div>
        </div>
      )}

      {/* Footer Insight */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          📊 {countries.length} Pacific nations tracked across {years.length} years · 
          Largest bubble = {largestEvent?.country} in {largestEvent?.year} ({largestEvent?.value.toLocaleString()} people)
        </p>
      </div>
    </div>
  );
}