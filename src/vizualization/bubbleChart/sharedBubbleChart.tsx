"use client";

import { scaleBand, scaleLinear, scaleSqrt } from "d3-scale";
import { useMemo, useState } from "react";

type DataPoint = {
  country: string;
  year: number;
  value: number;
};

type BubbleChartBaseProps = {
  width: number;
  height: number;
  data: DataPoint[];
  title?: string;
  insight?: string;
  valueSuffix?: string;
  colorScheme?: "rose" | "emerald" | "blue" | "amber" | "purple" | "teal";
  unitLabel?: string;
  isReversed?: boolean;
};

const MARGIN = {
  top: 50,
  right: 40,
  bottom: 100,
  left: 140,
};

const colorSchemes = {
  rose: {
    high: "#e11d48",
    mediumHigh: "#f43f5e",
    medium: "#fb7185",
    low: "#fda4af",
    accent: "#e11d48",
    bg: "rose-50",
    border: "border-rose-200",
    icon: "🔴"
  },
  emerald: {
    high: "#059669",
    mediumHigh: "#10b981",
    medium: "#34d399",
    low: "#6ee7b7",
    accent: "#059669",
    bg: "emerald-50",
    border: "border-emerald-200",
    icon: "🌿"
  },
  blue: {
    high: "#2563eb",
    mediumHigh: "#3b82f6",
    medium: "#60a5fa",
    low: "#93c5fd",
    accent: "#2563eb",
    bg: "blue-50",
    border: "border-blue-200",
    icon: "💧"
  },
  amber: {
    high: "#d97706",
    mediumHigh: "#f59e0b",
    medium: "#fbbf24",
    low: "#fcd34d",
    accent: "#d97706",
    bg: "amber-50",
    border: "border-amber-200",
    icon: "🌾"
  },
  purple: {
    high: "#7c3aed",
    mediumHigh: "#8b5cf6",
    medium: "#a78bfa",
    low: "#c4b5fd",
    accent: "#7c3aed",
    bg: "purple-50",
    border: "border-purple-200",
    icon: "🩺"
  },
  teal: {
    high: "#0d9488",
    mediumHigh: "#14b8a6",
    medium: "#2dd4bf",
    low: "#5eead4",
    accent: "#0d9488",
    bg: "teal-50",
    border: "border-teal-200",
    icon: "✈️"
  }
};

// Base Bubble Chart Component
function BubbleChartBase({
  width,
  height,
  data,
  title,
  insight,
  valueSuffix = "",
  colorScheme = "rose",
  unitLabel = "value",
  isReversed = false
}: BubbleChartBaseProps) {
  const [hovered, setHovered] = useState<DataPoint | null>(null);
  const colors = colorSchemes[colorScheme as keyof typeof colorSchemes] || colorSchemes.rose;

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
  const totalValue = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);
  
  const largestEvent = useMemo(() => {
    return data.reduce((max, d) => d.value > max.value ? d : max, data[0]);
  }, [data]);

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

  const xAxisTicks = useMemo(() => {
    const maxTicks = Math.max(5, Math.min(8, Math.floor(boundsWidth / 80)));
    const step = Math.ceil(years.length / maxTicks);
    return years.filter((_, i) => i % step === 0);
  }, [years, boundsWidth]);

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
    if (isReversed) {
      if (value < maxValue * 0.2) return colors.high;
      if (value < maxValue * 0.5) return colors.mediumHigh;
      if (value < maxValue * 0.8) return colors.medium;
      return colors.low;
    }
    if (value > maxValue * 0.8) return colors.high;
    if (value > maxValue * 0.5) return colors.mediumHigh;
    if (value > maxValue * 0.3) return colors.medium;
    return colors.low;
  };

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(1);
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
        <div className={`p-3 bg-${colors.bg} rounded-lg border-l-4`} style={{ borderColor: colors.high }}>
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      {/* Key Findings Summary Cards */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className={`text-center p-2 bg-${colors.bg} rounded-lg`}>
          <div className={`text-lg font-bold`} style={{ color: colors.high }}>
            {formatNumber(totalValue)} {valueSuffix}
          </div>
          <div className="text-xs text-slate-500">total value</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-lg font-bold text-amber-700">
            {formatNumber(largestEvent?.value || 0)} {valueSuffix}
          </div>
          <div className="text-xs text-slate-500">largest single event</div>
          <div className="text-[10px] text-slate-400">{largestEvent?.country}, {largestEvent?.year}</div>
        </div>
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <div className="text-lg font-bold text-emerald-700">
            {yearTotals.year || "—"}
          </div>
          <div className="text-xs text-slate-500">peak year</div>
          <div className="text-[10px] text-slate-400">{formatNumber(yearTotals.total)} {valueSuffix} total</div>
        </div>
      </div>

      {/* Narrative Paragraph */}
      {largestEvent && (
        <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">{largestEvent.country}</span> recorded the highest 
            value in <span className="font-bold text-slate-900">{largestEvent.year}</span> at{' '}
            <span className="font-bold" style={{ color: colors.high }}>{largestEvent.value.toLocaleString()} {valueSuffix}</span>.
            {yearTotals.year && ` The peak year region-wide was ${yearTotals.year}, with ${formatNumber(yearTotals.total)} {valueSuffix} total across all nations.`}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-slate-500">Bubble size = {unitLabel}</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Intensity:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.high }}></div>
            <span className="text-slate-400">{isReversed ? "Low" : "High"}</span>
            <div className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: colors.medium }}></div>
            <span className="text-slate-400">Medium</span>
            <div className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: colors.low }}></div>
            <span className="text-slate-400">{isReversed ? "High" : "Low"}</span>
          </div>
        </div>
      </div>

      <svg width={width} height={height} className="overflow-visible">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Vertical Grid Lines */}
          {xAxisTicks.map((year) => {
            const xPos = (xScale(year) ?? 0) + xScale.bandwidth() / 2;
            return (
              <line
                key={`grid-${year}`}
                x1={xPos}
                x2={xPos}
                y1={0}
                y2={boundsHeight}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

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
                {isLargest && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r + 4}
                    fill="none"
                    stroke={colors.high}
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
                    {formatNumber(d.value)}
                  </text>
                )}
              </g>
            );
          })}

          {/* X Axis - Years */}
          {xAxisTicks.map((year) => {
            const xPos = (xScale(year) ?? 0) + xScale.bandwidth() / 2;
            const isPeakYear = year === yearTotals.year;
            
            return (
              <g key={`x-tick-${year}`}>
                <line
                  x1={xPos}
                  y1={boundsHeight}
                  x2={xPos}
                  y2={boundsHeight + 5}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={xPos}
                  y={boundsHeight + 20}
                  textAnchor="start"
                  fontSize={isPeakYear ? "11" : "10"}
                  fill={isPeakYear ? "#d97706" : "#64748b"}
                  fontWeight={isPeakYear ? "bold" : "normal"}
                  transform={`rotate(45, ${xPos}, ${boundsHeight + 20})`}
                  className="select-none whitespace-nowrap"
                >
                  {year}
                  {isPeakYear && " ●"}
                </text>
              </g>
            );
          })}

          {/* Y Axis - Countries */}
          {countries.map((country) => {
            const yPos = (yScale(country) ?? 0) + yScale.bandwidth() / 2;
            const isLargestCountry = country === largestEvent?.country;
            
            return (
              <g key={`y-tick-${country}`}>
                <line
                  x1={-5}
                  y1={yPos}
                  x2={0}
                  y2={yPos}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={-12}
                  y={yPos + 3}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill={isLargestCountry ? colors.high : "#475569"}
                  fontWeight={isLargestCountry ? "bold" : "normal"}
                  className="select-none"
                >
                  {country}
                  {isLargestCountry && " 👑"}
                </text>
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={boundsWidth / 2}
            y={boundsHeight + 65}
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontWeight="500"
          >
            Year
          </text>
          
          <text
            transform={`rotate(-90) translate(${-boundsHeight / 2}, -55)`}
            textAnchor="middle"
            fill="#64748b"
            fontSize="11"
            fontWeight="500"
          >
            Country
          </text>
        </g>
      </svg>

      {/* Enhanced Tooltip */}
      {hovered && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-xl px-4 py-3 rounded-lg z-50"
          style={{
            left: (xScale(hovered.year) ?? 0) + MARGIN.left + (xScale.bandwidth() / 2) + 25,
            top: (yScale(hovered.country) ?? 0) + MARGIN.top + (yScale.bandwidth() / 2) - 30,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.high }}></div>
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {hovered.country} • {hovered.year}
            </span>
          </div>
          <div className="text-xl font-bold" style={{ color: colors.high }}>
            {hovered.value.toLocaleString()} {valueSuffix}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {unitLabel}
          </div>
        </div>
      )}

      {/* Footer Insight */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          📊 {countries.length} Pacific nations tracked across {years.length} years · 
          Largest bubble = {largestEvent?.country} in {largestEvent?.year} ({formatNumber(largestEvent?.value || 0)} {valueSuffix})
        </p>
      </div>
    </div>
  );
}

// Export individual components
export function TuberculosisBubbleChart(props: Omit<BubbleChartBaseProps, 'colorScheme' | 'valueSuffix' | 'unitLabel' | 'isReversed'>) {
  return (
    <BubbleChartBase
      {...props}
      valueSuffix="/100k"
      unitLabel="TB incidence rate"
      colorScheme="purple"
      isReversed={false}
    />
  );
}

export function CropYieldBubbleChart(props: Omit<BubbleChartBaseProps, 'colorScheme' | 'valueSuffix' | 'unitLabel' | 'isReversed'>) {
  return (
    <BubbleChartBase
      {...props}
      valueSuffix="t/ha"
      unitLabel="yield per hectare"
      colorScheme="emerald"
      isReversed={true}
    />
  );
}

export function LivestockYieldBubbleChart(props: Omit<BubbleChartBaseProps, 'colorScheme' | 'valueSuffix' | 'unitLabel' | 'isReversed'>) {
  return (
    <BubbleChartBase
      {...props}
      valueSuffix="tons"
      unitLabel="production tons"
      colorScheme="amber"
      isReversed={false}
    />
  );
}

export function TouristArrivalsBubbleChart(props: Omit<BubbleChartBaseProps, 'colorScheme' | 'valueSuffix' | 'unitLabel' | 'isReversed'>) {
  return (
    <BubbleChartBase
      {...props}
      valueSuffix="arrivals"
      unitLabel="tourist arrivals"
      colorScheme="teal"
      isReversed={false}
    />
  );
}