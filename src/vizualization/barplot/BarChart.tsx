"use client";

import { scaleBand, scaleLinear } from "d3-scale";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { animated, useSpring } from "@react-spring/web";

type RecordType = {
  country: string;
  value: number;
};

type Props = {
  width?: number;
  height?: number;
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
  className?: string;
};

const METRIC_CONFIGS = {
  economicLoss: {
    label: "Economic Loss",
    color: "#475569",
    unit: "USD",
    format: (v: number) => {
      const absV = Math.abs(v);
      if (absV >= 1_000_000_000) return `$${(absV / 1_000_000_000).toFixed(1)}B`;
      if (absV >= 1_000_000) return `$${(absV / 1_000_000).toFixed(1)}M`;
      if (absV >= 1_000) return `$${(absV / 1_000).toFixed(1)}K`;
      return `$${absV}`;
    }
  },
  cropYield: {
    label: "Crop Yield",
    color: "#475569",
    unit: "t/ha",
    format: (v: number) => `${Math.abs(v).toFixed(1)} t/ha`
  },
  touristArrivals: {
    label: "Tourist Arrivals",
    color: "#475569",
    unit: "visitors",
    format: (v: number) => `${Math.abs(v).toLocaleString()} visitors`
  },
  livestockYield: {
    label: "Livestock Yield",
    color: "#475569",
    unit: "tons",
    format: (v: number) => `${Math.abs(v).toLocaleString()} tons`
  },
  climateAlteringLand: {
    label: "Climate-Altering Land",
    color: "#475569",
    unit: "ha",
    format: (v: number) => `${Math.abs(v).toLocaleString()} ha`
  },
  populationGrowth: {
    label: "Population Growth",
    color: "#475569",
    unit: "%",
    format: (v: number) => `${Math.abs(v).toFixed(1)}%`
  },
  affectedPersons: {
    label: "People Affected",
    color: "#475569",
    unit: "people",
    format: (v: number) => `${Math.abs(v).toLocaleString()} people`
  }
};

// Get all metric keys
const METRIC_KEYS = Object.keys(METRIC_CONFIGS) as Array<keyof typeof METRIC_CONFIGS>;

// Normalize function: 0 to 1 scale
const normalize = (value: number, max: number) => {
  if (max === 0) return 0;
  return Math.min(value / max, 1);
};

// Animated Bar Component
const AnimatedBar = ({ width, height, y, x, fill, isHovered, onMouseEnter, onMouseLeave }: any) => {
  const springProps = useSpring({
    width,
    opacity: isHovered ? 1 : 0.85,
    config: { tension: 200, friction: 20 }
  });

  return (
    <animated.rect
      x={x}
      y={y}
      width={springProps.width}
      height={height}
      fill={fill}
      rx={2}
      opacity={springProps.opacity}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: "pointer" }}
    />
  );
};

export function MultiMetricRankedDashboard({ 
  width: propWidth, 
  height: propHeight, 
  data,
  className = ""
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<null | {
    x: number;
    y: number;
    country: string;
    values: Record<string, number>;
    compositeScore: number;
  }>(null);

  // ─── Responsive sizing ───
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 600;
        const height = propHeight || Math.min(rect.width * 0.8, 500);
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
      return { left: 60, right: 10, top: 30, bottom: 50 };
    }
    if (width < 600) {
      return { left: 80, right: 15, top: 35, bottom: 60 };
    }
    if (width < 768) {
      return { left: 95, right: 18, top: 38, bottom: 70 };
    }
    return { left: 120, right: 20, top: 40, bottom: 80 };
  }, [width]);

  // ─── Responsive font size ───
  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.55;
    if (width < 600) return base * 0.7;
    if (width < 768) return base * 0.85;
    if (width < 1024) return base * 0.9;
    return base;
  }, [width]);

  // ─── 1. Build country-wise data for ALL 7 metrics ───
  const countryData = useMemo(() => {
    const map = new Map<string, Record<string, number>>();

    METRIC_KEYS.forEach((key) => {
      const records = data[key] || [];
      records.forEach((d) => {
        if (!map.has(d.country)) {
          map.set(d.country, {});
        }
        const entry = map.get(d.country)!;
        entry[key] = (entry[key] || 0) + d.value;
      });
    });

    return Array.from(map.entries()).map(([country, values]) => ({
      country,
      values
    }));
  }, [data]);

  // ─── 2. Compute max values per metric for normalization ───
  const maxValues = useMemo(() => {
    const maxes: Record<string, number> = {};
    METRIC_KEYS.forEach((key) => {
      let max = 0;
      countryData.forEach((c) => {
        const val = c.values[key] || 0;
        if (val > max) max = val;
      });
      maxes[key] = max || 1;
    });
    return maxes;
  }, [countryData]);

  // ─── 3. Compute composite score per country ───
  const ranked = useMemo(() => {
    return countryData
      .map((c) => {
        let composite = 0;
        METRIC_KEYS.forEach((key) => {
          const raw = c.values[key] || 0;
          composite += normalize(raw, maxValues[key]);
        });
        return {
          country: c.country,
          values: c.values,
          compositeScore: composite
        };
      })
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }, [countryData, maxValues]);

  // ─── 4. Calculate statistics ───
  const stats = useMemo(() => {
    if (ranked.length === 0) return null;

    const scores = ranked.map(d => d.compositeScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const range = max - min;
    const topCountry = ranked[0];
    const bottomCountry = ranked[ranked.length - 1];

    // Calculate gap percentage
    const gapPercent = ((max - min) / avg) * 100;

    return {
      avg,
      max,
      min,
      range,
      topCountry,
      bottomCountry,
      gapPercent,
      countryCount: ranked.length
    };
  }, [ranked]);

  // ─── 5. Chart dimensions ───
  const chartWidth = width - responsiveMargin.left - responsiveMargin.right;
  const chartHeight = height - responsiveMargin.top - responsiveMargin.bottom;

  const maxComposite = Math.max(...ranked.map((d) => d.compositeScore), 1);

  const yScale = scaleBand()
    .domain(ranked.map((d) => d.country))
    .range([0, chartHeight])
    .padding(width < 500 ? 0.15 : width < 768 ? 0.2 : 0.25);

  const xScale = scaleLinear()
    .domain([0, maxComposite * 1.15])
    .range([0, chartWidth]);

  // ─── 6. Tooltip handlers ───
  const handleMouseEnter = (country: string) => {
    setHoveredCountry(country);
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
    setTooltip(null);
  };

  const handleMouseMove = (e: React.MouseEvent, country: string, values: Record<string, number>, composite: number) => {
    const rect = (e.target as SVGRectElement).getBoundingClientRect();
    setTooltip({
      x: rect.left,
      y: rect.top,
      country,
      values,
      compositeScore: composite,
    });
  };

  // ─── 7. All bars use the same muted color ───
  const getBarColor = () => "#334155";

  const fontSize = getFontSize(11);
  const titleFontSize = getFontSize(18);
  const subtitleFontSize = getFontSize(14);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (!ranked.length || !width || !height) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-col items-center w-full ${className}`}>
      <div className="w-full max-w-4xl px-2 sm:px-4">
        {/* ─── Statistics Bar ─── */}
        {stats && (
          <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 border-b border-slate-100 pb-4">
            <div className="text-center">
              <div 
                className="font-medium text-slate-800"
                style={{ fontSize: fontSize * 1.2 }}
              >
                {stats.topCountry.country}
              </div>
              <div 
                className="text-slate-400"
                style={{ fontSize: fontSize * 0.7 }}
              >
                Highest vulnerability
              </div>
            </div>
            
            <div className="text-center">
              <div 
                className="font-medium text-slate-800"
                style={{ fontSize: fontSize * 1.2 }}
              >
                {stats.bottomCountry.country}
              </div>
              <div 
                className="text-slate-400"
                style={{ fontSize: fontSize * 0.7 }}
              >
                Lowest vulnerability
              </div>
            </div>
            
            <div className="text-center">
              <div 
                className="font-medium text-slate-800"
                style={{ fontSize: fontSize * 1.2 }}
              >
                {stats.gapPercent.toFixed(0)}%
              </div>
              <div 
                className="text-slate-400"
                style={{ fontSize: fontSize * 0.7 }}
              >
                Vulnerability gap
              </div>
            </div>
            
            <div className="text-center">
              <div 
                className="font-medium text-slate-800"
                style={{ fontSize: fontSize * 1.2 }}
              >
                {stats.countryCount}
              </div>
              <div 
                className="text-slate-400"
                style={{ fontSize: fontSize * 0.7 }}
              >
                Countries analyzed
              </div>
            </div>
          </div>
        )}

        {/* ─── Chart ─── */}
        <div className="relative w-full overflow-hidden">
          <svg 
            width={width} 
            height={height} 
            className="block"
            viewBox={width && height ? `0 0 ${width} ${height}` : undefined}
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <g transform={`translate(${responsiveMargin.left},${responsiveMargin.top})`}>
              {/* Average line */}
              {stats && (
                <line
                  x1={xScale(stats.avg)}
                  x2={xScale(stats.avg)}
                  y1={0}
                  y2={chartHeight}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              )}

              {/* Country labels */}
              {ranked.map((d) => {
                const y = yScale(d.country)!;
                const isHovered = hoveredCountry === d.country;
                
                const displayName = width < 500 
                  ? (d.country.length > 10 ? d.country.slice(0, 8) + "…" : d.country)
                  : width < 768 
                    ? (d.country.length > 12 ? d.country.slice(0, 10) + "…" : d.country)
                    : d.country;

                return (
                  <text
                    key={d.country}
                    x={-6}
                    y={y + yScale.bandwidth() / 2 + fontSize * 0.35}
                    textAnchor="end"
                    fontSize={Math.max(8, Math.min(fontSize, 11))}
                    fill="#334155"
                    fontWeight="400"
                  >
                    {displayName}
                  </text>
                );
              })}

              {/* Bars */}
              {ranked.map((d) => {
                const y = yScale(d.country)!;
                const barWidth = xScale(d.compositeScore);
                const isHovered = hoveredCountry === d.country;
                const barColor = getBarColor();
                const barHeight = yScale.bandwidth();

                return (
                  <g key={d.country}>
                    {/* Bar */}
                    <AnimatedBar
                      x={0}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={barColor}
                      isHovered={isHovered}
                      onMouseEnter={() => handleMouseEnter(d.country)}
                      onMouseLeave={handleMouseLeave}
                    />

                    {/* Hover capture + tooltip trigger */}
                    <rect
                      x={0}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="transparent"
                      onMouseMove={(e) => handleMouseMove(e, d.country, d.values, d.compositeScore)}
                      onMouseLeave={handleMouseLeave}
                      className={!isTouchDevice ? "cursor-pointer" : ""}
                    />

                    {/* Composite score label */}
                    {barWidth > (width < 500 ? 20 : 40) && (
                      <text
                        x={barWidth - 4}
                        y={y + barHeight / 2 + fontSize * 0.3}
                        textAnchor="end"
                        fontSize={Math.max(7, Math.min(fontSize * 0.85, 10))}
                        fill="#ffffff"
                        fontWeight="400"
                      >
                        {d.compositeScore.toFixed(2)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Average label */}
              {stats && (
                <text
                  x={xScale(stats.avg)}
                  y={-6}
                  textAnchor="middle"
                  fontSize={Math.max(6, fontSize * 0.65)}
                  fill="#94a3b8"
                >
                  avg {stats.avg.toFixed(2)}
                </text>
              )}

              {/* X-axis label */}
              <text
                x={chartWidth / 2}
                y={chartHeight + (width < 500 ? 20 : 30)}
                textAnchor="middle"
                fontSize={fontSize * 0.8}
                fill="#94a3b8"
              >
                Vulnerability index →
              </text>
            </g>
          </svg>

          <p>Figure 5:</p>

          {/* ─── Tooltip ─── */}
          {tooltip && !isMobile && (
            <div
              className="absolute z-50 max-w-xs rounded border border-slate-200 bg-white p-3 text-xs shadow-sm pointer-events-none"
              style={{
                left: Math.min(tooltip.x + 10, width - 220),
                top: Math.min(tooltip.y - 20, height - 180),
                fontSize: getFontSize(12),
              }}
            >
              <div className="font-medium text-slate-900">
                {tooltip.country}
              </div>

              <div className="mt-1 text-slate-600">
                Composite score: {tooltip.compositeScore.toFixed(2)}
              </div>

              <div className="mt-2 border-t border-slate-100 pt-2">
                {METRIC_KEYS.map((key) => {
                  const config = METRIC_CONFIGS[key];
                  const val = tooltip.values[key] || 0;
                  return (
                    <div
                      key={key}
                      className="flex justify-between text-slate-600"
                    >
                      <span>{config.label}</span>
                      <span className="font-mono">{config.format(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Mobile Tooltip ─── */}
          {tooltip && isMobile && (
            <div className="mt-2 text-center bg-white border border-slate-200 rounded p-2 mx-2">
              <div className="font-medium text-slate-900 text-xs">{tooltip.country}</div>
              <div className="text-slate-600 text-xs">
                Score: {tooltip.compositeScore.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer Insight ─── */}
        {stats && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p 
              className="text-slate-500 text-center max-w-2xl mx-auto"
              style={{ fontSize: fontSize * 0.85 }}
            >
              {stats.topCountry.country} faces the highest vulnerability, 
              while {stats.bottomCountry.country} shows the lowest — 
              a <span className="font-medium text-slate-700">{stats.gapPercent.toFixed(0)}%</span> gap 
              in composite vulnerability across {stats.countryCount} Pacific nations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
