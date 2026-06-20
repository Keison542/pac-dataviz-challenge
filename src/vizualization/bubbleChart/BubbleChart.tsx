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
  subtitle = "Historical records reveal persistent hotspots of vulnerability across the Pacific.",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<DataPoint | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // ─── Responsive sizing ───
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 600;
        const height = propHeight || Math.min(rect.width * 0.7, 500);
        setDimensions({ width, height });
        setIsMobile(width < 768);
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

  // ─── Responsive margins ───
  const responsiveMargin = useMemo(() => {
    if (width < 400) {
      return { top: 30, right: 10, bottom: 60, left: 80 };
    }
    if (width < 600) {
      return { top: 35, right: 15, bottom: 70, left: 100 };
    }
    if (width < 768) {
      return { top: 40, right: 18, bottom: 75, left: 115 };
    }
    return MARGIN;
  }, [width]);

  // ─── Responsive font size ───
  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.55;
    if (width < 600) return base * 0.7;
    if (width < 768) return base * 0.85;
    if (width < 1024) return base * 0.9;
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
  const chartWidth = width - responsiveMargin.left - responsiveMargin.right;
  const chartHeight = height - responsiveMargin.top - responsiveMargin.bottom;

  const x = useMemo(() => 
    scaleBand()
      .domain(years)
      .range([0, chartWidth])
      .padding(width < 500 ? 0.2 : 0.3),
    [years, chartWidth, width]
  );

  const y = useMemo(() => 
    scaleBand()
      .domain(countries)
      .range([0, chartHeight])
      .padding(width < 500 ? 0.2 : 0.3),
    [countries, chartHeight, width]
  );

  const r = useMemo(() => {
    const maxRadius = Math.min(
      40,
      width / 15,
      Math.min(x.bandwidth() / 2, y.bandwidth() / 2) * 0.8
    );
    return scaleSqrt()
      .domain([0, maxValue])
      .range([width < 500 ? 2 : 4, Math.max(6, maxRadius)]);
  }, [maxValue, width, x, y]);

  const fontSize = getFontSize(11);
  const titleFontSize = getFontSize(14);
  const subtitleFontSize = getFontSize(12);

  // ─── Dynamic ticks ───
  const visibleYears = useMemo(() => {
    const step = Math.max(1, Math.floor(years.length / (width < 500 ? 3 : width < 768 ? 4 : 6)));
    return years.filter((_, i) => i % step === 0 || i === years.length - 1);
  }, [years, width]);

  const visibleCountries = useMemo(() => {
    const step = Math.max(1, Math.floor(countries.length / (width < 500 ? 4 : width < 768 ? 6 : 10)));
    return countries.filter((_, i) => i % step === 0 || i === countries.length - 1);
  }, [countries, width]);

  if (!data.length || !width || !height) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center ${className}`}>
      {/* ─── HEADER ─── */}
      <div className="mb-2 sm:mb-3 text-center px-2 sm:px-4">
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
      <div className="relative w-full overflow-hidden">
        <svg 
          width={width} 
          height={height} 
          className="block"
          viewBox={width && height ? `0 0 ${width} ${height}` : undefined}
          style={{ maxWidth: '100%', height: 'auto' }}
        >
          <g transform={`translate(${responsiveMargin.left},${responsiveMargin.top})`}>
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
                  opacity={isHovered ? 0.95 : 0.55}
                  stroke={isHovered ? "#b91c1c" : "none"}
                  strokeWidth={isHovered ? Math.max(1.5, 2) : 0}
                  onMouseEnter={() => setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => isTouchDevice && setHovered(d)}
                  className={!isTouchDevice ? "cursor-pointer transition-all duration-200" : ""}
                />
              );
            })}

            {/* Y-AXIS LABELS (Countries) */}
            {(width < 768 ? visibleCountries : countries).map((country, i) => {
              const cy = y(country) ?? 0;
              if (cy < 5 || cy > chartHeight - 5) return null;
              
              const displayName = width < 500 
                ? (country.length > 10 ? country.slice(0, 8) + "…" : country)
                : width < 768 
                  ? (country.length > 12 ? country.slice(0, 10) + "…" : country)
                  : (country.length > 15 ? country.slice(0, 12) + "…" : country);
              
              return (
                <text
                  key={`country-${i}`}
                  x={-6}
                  y={cy + y.bandwidth() / 2 + fontSize * 0.35}
                  textAnchor="end"
                  fontSize={Math.max(7, Math.min(fontSize, 11))}
                  fill="#475569"
                >
                  {displayName}
                </text>
              );
            })}

            {/* X-AXIS LABELS (Years) */}
            {(width < 768 ? visibleYears : years).map((year, i) => {
              const cx = x(year) ?? 0;
              if (cx < 5 || cx > chartWidth - 5) return null;
              
              return (
                <text
                  key={`year-${i}`}
                  x={cx + x.bandwidth() / 2}
                  y={chartHeight + (width < 500 ? 18 : 25)}
                  textAnchor="middle"
                  fontSize={Math.max(7, Math.min(fontSize * 0.85, 10))}
                  fill="#94a3b8"
                >
                  {year}
                </text>
              );
            })}

            {/* AXIS LABELS */}
            {/* <text
              x={chartWidth / 2}
              y={chartHeight + (width < 500 ? 40 : 55)}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#64748b"
            >
              Year
            </text>

            <text
              transform={`rotate(-90, ${-(width < 500 ? 40 : 60)}, ${chartHeight / 2})`}
              x={-chartHeight / 2}
              y={-(width < 500 ? 60 : 80)}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#64748b"
            >
              Countries
            </text> */}
          </g>
        </svg>

        {/* ─── TOOLTIP ─── */}
        {hovered && (
          <div 
            className="absolute bg-white border shadow-lg rounded-lg p-2 sm:p-3 pointer-events-none z-10"
            style={{
              left: Math.min(
                (x(hovered.year) ?? 0) + responsiveMargin.left + 10,
                width - 180
              ),
              top: Math.min(
                (y(hovered.country) ?? 0) + responsiveMargin.top - 10,
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
            {/* <div className="text-sm sm:text-base font-bold text-red-600 mt-1">
              {hovered.value.toLocaleString()} impacted
            </div> */}

            <div className="text-sm sm:text-base font-semibold text-red-600 mt-1">
              {hovered.value.toLocaleString()} people affected
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
