"use client";

import { scaleBand, scaleSqrt } from "d3-scale";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";

type DataPoint = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  width?: number;
  height?: number;
  data: DataPoint[];
  className?: string;
  title?: string;
  subtitle?: string;
};

const MARGIN = { top: 40, right: 20, bottom: 80, left: 140 };

export function BubbleChart({ 
  width: propWidth, 
  height: propHeight, 
  data,
  className = "",
  title = "Livelihood shocks are uneven",
  subtitle = "Bubble size = impact severity",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<DataPoint | null>(null);

  // ─── Responsive sizing ───
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 600;
        const height = propHeight || Math.min(rect.width * 0.7, 500);
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [propWidth, propHeight]);

  const { width, height } = dimensions;

  // ─── Responsive font size ───
  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.6;
    if (width < 600) return base * 0.8;
    if (width < 800) return base * 0.9;
    return base;
  }, [width]);

  // ─── Data processing ───
  const countries = useMemo(() => 
    Array.from(new Set(data.map(d => d.country))), 
    [data]
  );
  
  const years = useMemo(() => 
    Array.from(new Set(data.map(d => d.year))).sort(), 
    [data]
  );

  const maxValue = Math.max(...data.map(d => d.value), 1);

  // ─── Scales ───
  const x = useMemo(() => 
    scaleBand()
      .domain(years)
      .range([0, width - MARGIN.left - MARGIN.right])
      .padding(0.3),
    [years, width]
  );

  const y = useMemo(() => 
    scaleBand()
      .domain(countries)
      .range([0, height - MARGIN.top - MARGIN.bottom])
      .padding(0.3),
    [countries, height]
  );

  const r = useMemo(() => 
    scaleSqrt()
      .domain([0, maxValue])
      .range([4, Math.min(40, width / 15)]),
    [maxValue, width]
  );

  const fontSize = getFontSize(11);
  const titleFontSize = getFontSize(14);
  const subtitleFontSize = getFontSize(12);

  if (!data.length || !width || !height) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  const chartWidth = width - MARGIN.left - MARGIN.right;
  const chartHeight = height - MARGIN.top - MARGIN.bottom;

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center ${className}`}>
      {/* ─── HEADER ─── */}
      <div className="mb-3 text-center px-4">
        <div 
          className="font-semibold text-slate-900"
          style={{ fontSize: titleFontSize }}
        >
          {title}
        </div>
        {subtitle && (
          <div 
            className="text-slate-500 mt-0.5"
            style={{ fontSize: subtitleFontSize }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* ─── CHART ─── */}
      <div className="relative w-full overflow-x-auto">
        <svg 
          width={width} 
          height={height} 
          className="block"
          viewBox={width && height ? `0 0 ${width} ${height}` : undefined}
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* BUBBLES */}
            {data.map((d, i) => {
              const cx = x(d.year) ?? 0;
              const cy = y(d.country) ?? 0;
              const radius = r(d.value);
              const isHovered = hovered?.country === d.country && hovered?.year === d.year;

              return (
                <circle
                  key={`${d.country}-${d.year}-${i}`}
                  cx={cx + (x.bandwidth() / 2)}
                  cy={cy + (y.bandwidth() / 2)}
                  r={radius}
                  fill="#ef4444"
                  opacity={isHovered ? 0.95 : 0.7}
                  stroke={isHovered ? "#b91c1c" : "none"}
                  strokeWidth={isHovered ? 2 : 0}
                  onMouseEnter={() => setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer transition-all duration-200"
                />
              );
            })}

            {/* Y-AXIS LABELS (Countries) */}
            {countries.map((country, i) => {
              const cy = y(country) ?? 0;
              if (cy < 10 || cy > chartHeight - 10) return null;
              
              return (
                <text
                  key={`country-${i}`}
                  x={-10}
                  y={cy + y.bandwidth() / 2 + fontSize * 0.35}
                  textAnchor="end"
                  fontSize={Math.min(fontSize, 11)}
                  fill="#475569"
                  className="truncate"
                >
                  {country.length > 15 ? country.slice(0, 12) + "…" : country}
                </text>
              );
            })}

            {/* X-AXIS LABELS (Years) */}
            {years.map((year, i) => {
              const cx = x(year) ?? 0;
              if (cx < 10 || cx > chartWidth - 10) return null;
              
              return (
                <text
                  key={`year-${i}`}
                  x={cx + x.bandwidth() / 2}
                  y={chartHeight + 25}
                  textAnchor="middle"
                  fontSize={Math.min(fontSize, 10)}
                  fill="#94a3b8"
                >
                  {year}
                </text>
              );
            })}

            {/* AXIS LABELS */}
            <text
              x={chartWidth / 2}
              y={chartHeight + 55}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#64748b"
            >
              Year
            </text>

            <text
              transform={`rotate(-90, -60, ${chartHeight / 2})`}
              x={-chartHeight / 2}
              y={-80}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#64748b"
            >
              Countries
            </text>
          </g>
        </svg>

        {/* ─── TOOLTIP ─── */}
        {hovered && (
          <div 
            className="absolute bg-white border shadow-lg rounded-lg p-2 sm:p-3 pointer-events-none z-10"
            style={{
              left: Math.min(
                (x(hovered.year) ?? 0) + MARGIN.left + 20,
                width - 180
              ),
              top: Math.min(
                (y(hovered.country) ?? 0) + MARGIN.top - 20,
                height - 80
              ),
              maxWidth: Math.min(200, width - 40),
              fontSize: getFontSize(12),
            }}
          >
            <div className="font-semibold text-slate-900 text-sm sm:text-base">
              {hovered.country}
            </div>
            <div className="text-slate-500 text-xs sm:text-sm">{hovered.year}</div>
            <div className="text-sm sm:text-base font-bold text-red-600 mt-1">
              {hovered.value.toLocaleString()} impacted
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
