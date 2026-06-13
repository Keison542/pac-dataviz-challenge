"use client";

import { scaleBand, scaleLinear, scaleSqrt } from "d3-scale";
import { useMemo, useState, useCallback } from "react";
import { animated, useSpring } from "@react-spring/web";

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
  bottom: 100,
  left: 140,
};

// AnimatedBubble component - similar to LineItem but for circles
const AnimatedBubble = ({ 
  cx, cy, r, fill, fillOpacity, stroke, strokeWidth, 
  isLargest, isHovered, onMouseEnter, onMouseLeave 
}: any) => {
  const springProps = useSpring({
    r: isHovered ? r + 4 : r,
    fillOpacity: isHovered ? 1 : fillOpacity,
    strokeWidth: isHovered ? 3 : strokeWidth,
    config: { tension: 200, friction: 20 },
  });

  const glowSpring = useSpring({
    opacity: isHovered ? 0.4 : 0,
    config: { tension: 200, friction: 20 },
  });

  return (
    <>
      {/* Outer glow for largest bubble */}
      {isLargest && !isHovered && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 4}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          opacity="0.3"
        />
      )}
      {/* Glow effect on hover */}
      {isHovered && (
        <animated.circle
          cx={cx}
          cy={cy}
          r={r + 8}
          fill={fill}
          opacity={glowSpring.opacity}
          style={{ filter: "blur(6px)" }}
        />
      )}
      <animated.circle
        cx={cx}
        cy={cy}
        r={springProps.r}
        fill={fill}
        fillOpacity={springProps.fillOpacity}
        stroke={stroke}
        strokeWidth={springProps.strokeWidth}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="cursor-pointer transition-all duration-200"
      />
    </>
  );
};

export function BubbleChart({
  width,
  height,
  data,
  title = "People Affected by Disasters",
  insight = "Larger bubbles reveal years when climate disasters displaced the most people",
}: Props) {
  const [hovered, setHovered] = useState<DataPoint | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

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
    if (value > maxValue * 0.8) return "#e11d48";
    if (value > maxValue * 0.5) return "#f43f5e";
    if (value > maxValue * 0.3) return "#fb7185";
    return "#fda4af";
  };

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
  };

  const handleBubbleHover = useCallback((point: DataPoint | null) => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
    
    if (point) {
      setHovered(point);
    } else {
      const timer = setTimeout(() => {
        setHovered(null);
      }, 50);
      setHoverTimer(timer);
    }
  }, [hoverTimer]);

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
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-rose-500">
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-rose-50 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="text-lg font-bold text-rose-700">
            {formatNumber(totalAffected)}
          </div>
          <div className="text-xs text-slate-500">total people affected</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="text-lg font-bold text-amber-700">
            {formatNumber(largestEvent?.value || 0)}
          </div>
          <div className="text-xs text-slate-500">largest single event</div>
          <div className="text-[10px] text-slate-400">{largestEvent?.country}, {largestEvent?.year}</div>
        </div>
        <div className="text-center p-2 bg-emerald-50 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="text-lg font-bold text-emerald-700">
            {yearTotals.year || "—"}
          </div>
          <div className="text-xs text-slate-500">worst year</div>
          <div className="text-[10px] text-slate-400">{formatNumber(yearTotals.total)} affected</div>
        </div>
      </div>

      {largestEvent && (
        <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100 transition-all duration-200 hover:shadow-sm">
          <p className="text-sm text-slate-700 leading-relaxed">
            The data reveals that <span className="font-bold text-slate-900">{largestEvent.country}</span> experienced the 
            single largest disaster impact in <span className="font-bold text-slate-900">{largestEvent.year}</span>, with{' '}
            <span className="font-bold text-rose-600">{largestEvent.value.toLocaleString()} people</span> affected.
            {yearTotals.year && ` The most devastating year across all Pacific nations was ${yearTotals.year}, when ${formatNumber(yearTotals.total)} people were displaced or impacted.`}
          </p>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
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

          {data.map((d, i) => {
            const cx = (xScale(d.year) ?? 0) + xScale.bandwidth() / 2;
            const cy = (yScale(d.country) ?? 0) + yScale.bandwidth() / 2;
            const r = radiusScale(d.value);
            const isLargest = d === largestEvent;
            const isHovered = hovered === d;
            const bubbleColor = colorScale(d.value);

            return (
              <AnimatedBubble
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill={bubbleColor}
                fillOpacity={0.85}
                stroke="#e11d48"
                strokeWidth={isLargest ? 3 : 1.5}
                isLargest={isLargest}
                isHovered={isHovered}
                onMouseEnter={() => handleBubbleHover(d)}
                onMouseLeave={() => handleBubbleHover(null)}
              />
            );
          })}

          {data.map((d, i) => {
            const cx = (xScale(d.year) ?? 0) + xScale.bandwidth() / 2;
            const cy = (yScale(d.country) ?? 0) + yScale.bandwidth() / 2;
            const r = radiusScale(d.value);
            const isHovered = hovered === d;
            
            if (r <= 25) return null;
            
            return (
              <text
                key={`label-${i}`}
                x={cx}
                y={cy + 3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isHovered ? "10" : "9"}
                fontWeight="bold"
                fill="#ffffff"
                className="pointer-events-none transition-all duration-200"
                style={{
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  transition: "all 0.2s ease"
                }}
              >
                {formatNumber(d.value)}
              </text>
            );
          })}

          {xAxisTicks.map((year) => {
            const xPos = (xScale(year) ?? 0) + xScale.bandwidth() / 2;
            const isWorstYear = year === yearTotals.year;
            
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
                  fontSize={isWorstYear ? "11" : "10"}
                  fill={isWorstYear ? "#d97706" : "#64748b"}
                  fontWeight={isWorstYear ? "bold" : "normal"}
                  transform={`rotate(45, ${xPos}, ${boundsHeight + 20})`}
                  className="select-none whitespace-nowrap"
                >
                  {year}
                  {isWorstYear && " ●"}
                </text>
              </g>
            );
          })}

          {countries.map((country) => {
            const yPos = (yScale(country) ?? 0) + yScale.bandwidth() / 2;
            const isLargestCountry = country === largestEvent?.country;
            const isHoveredCountry = hovered?.country === country;
            
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
                  fill={isLargestCountry ? "#e11d48" : (isHoveredCountry ? "#f43f5e" : "#475569")}
                  fontWeight={isLargestCountry || isHoveredCountry ? "bold" : "normal"}
                  className="select-none transition-all duration-200"
                  style={{
                    transform: isHoveredCountry ? "translateX(-4px)" : "translateX(0)",
                    transition: "transform 0.2s ease"
                  }}
                >
                  {country}
                  {isLargestCountry && " 👑"}
                </text>
              </g>
            );
          })}

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

      {hovered && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-xl px-4 py-3 rounded-lg z-50 animate-in fade-in zoom-in duration-200"
          style={{
            left: (xScale(hovered.year) ?? 0) + MARGIN.left + (xScale.bandwidth() / 2) + 25,
            top: (yScale(hovered.country) ?? 0) + MARGIN.top + (yScale.bandwidth() / 2) - 40,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
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
          <div className="text-[10px] text-slate-300 mt-1">
            {hovered.value > 100000 ? "Catastrophic event" : 
             hovered.value > 50000 ? "Major disaster" : 
             hovered.value > 10000 ? "Significant impact" : "Regional impact"}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          📊 {countries.length} Pacific nations tracked across {years.length} years · 
          Largest bubble = {largestEvent?.country} in {largestEvent?.year} ({formatNumber(largestEvent?.value || 0)} people) · 
          💡 Hover over any bubble for details — they grow and glow
        </p>
      </div>
    </div>
  );
}