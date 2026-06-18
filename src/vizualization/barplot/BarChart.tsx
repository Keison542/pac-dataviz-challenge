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
    color: "#0891b2",
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
    color: "#10b981",
    unit: "t/ha",
    format: (v: number) => `${Math.abs(v).toFixed(1)} t/ha`
  },
  touristArrivals: {
    label: "Tourist Arrivals",
    color: "#14b8a6",
    unit: "visitors",
    format: (v: number) => `${Math.abs(v).toLocaleString()} visitors`
  },
  livestockYield: {
    label: "Livestock Yield",
    color: "#f59e0b",
    unit: "tons",
    format: (v: number) => `${Math.abs(v).toLocaleString()} tons`
  },
  climateAlteringLand: {
    label: "Climate-Altering Land",
    color: "#8b5cf6",
    unit: "ha",
    format: (v: number) => `${Math.abs(v).toLocaleString()} ha`
  },
  populationGrowth: {
    label: "Population Growth",
    color: "#ec4898",
    unit: "%",
    format: (v: number) => `${Math.abs(v).toFixed(1)}%`
  },
  affectedPersons: {
    label: "People Affected",
    color: "#ef4444",
    unit: "people",
    format: (v: number) => `${Math.abs(v).toLocaleString()} people`
  }
};

// Get all metric keys
const METRIC_KEYS = Object.keys(METRIC_CONFIGS) as Array<keyof typeof METRIC_CONFIGS>;

// Vulnerability score ranges
const VULNERABILITY_LEVELS = {
  high: {
    label: "High Vulnerability",
    range: "Score ≥ 4.0",
    color: "#ef4444",
    bgColor: "#fef2f2",
    textColor: "#dc2626"
  },
  medium: {
    label: "Medium Vulnerability",
    range: "Score 2.5 - 3.9",
    color: "#f59e0b",
    bgColor: "#fffbeb",
    textColor: "#d97706"
  },
  low: {
    label: "Low Vulnerability",
    range: "Score < 2.5",
    color: "#10b981",
    bgColor: "#ecfdf5",
    textColor: "#059669"
  }
};

// Determine vulnerability level based on score
const getVulnerabilityLevel = (score: number) => {
  if (score >= 4.0) return "high";
  if (score >= 2.5) return "medium";
  return "low";
};

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
      rx={4}
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
    level: string;
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

  // ─── 4. Find top and bottom ───
  const topCountry = ranked[0];
  const bottomCountry = ranked[ranked.length - 1];

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
    const level = getVulnerabilityLevel(composite);
    setTooltip({
      x: rect.left,
      y: rect.top,
      country,
      values,
      compositeScore: composite,
      level
    });
  };

  // ─── 7. Get color based on vulnerability level ───
  const getBarColor = (score: number) => {
    const level = getVulnerabilityLevel(score);
    const colorMap = {
      high: "#ef4444",
      medium: "#f59e0b",
      low: "#10b981"
    };
    return colorMap[level];
  };

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
      <div className="w-full max-w-5xl px-2 sm:px-4">
        {/* ─── Header ─── */}
        <div className="mb-3 sm:mb-4 text-center">
          <h2 
            className="font-bold text-slate-800"
            style={{ fontSize: titleFontSize }}
          >
            Paying the Heaviest of the Carbon Debt Never Incurred
          </h2>
          <p 
            className="text-slate-600 mt-1"
            style={{ fontSize: subtitleFontSize * 0.85 }}
          >
            Pacific island nations emit less CO₂ than three-quarters of all countries, yet rank among the most vulnerable to climate change.
          </p>
          <p 
            className="text-slate-500 mt-0.5"
            style={{ fontSize: subtitleFontSize * 0.7 }}
          >
            Composite Vulnerability Index across 7 key climate impact metrics
          </p>
        </div>

        {/* ─── Summary Cards ─── */}
        <div className="mb-3 sm:mb-4 grid grid-cols-3 gap-1.5 sm:gap-3 max-w-2xl mx-auto">
          <div className="rounded-lg bg-cyan-50 p-1.5 sm:p-3 text-center border border-cyan-100">
            <div 
              className="font-bold text-cyan-700"
              style={{ fontSize: width < 500 ? 14 : 18 }}
            >
              {topCountry?.country || "—"}
            </div>
            <div 
              className="text-slate-500"
              style={{ fontSize: width < 500 ? 9 : 12 }}
            >
              Highest Vulnerability
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 p-1.5 sm:p-3 text-center border border-amber-100">
            <div 
              className="font-bold text-amber-700"
              style={{ fontSize: width < 500 ? 14 : 18 }}
            >
              {bottomCountry?.country || "—"}
            </div>
            <div 
              className="text-slate-500"
              style={{ fontSize: width < 500 ? 9 : 12 }}
            >
              Lowest Vulnerability
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-1.5 sm:p-3 text-center border border-slate-100">
            <div 
              className="font-bold text-slate-700"
              style={{ fontSize: width < 500 ? 14 : 18 }}
            >
              {ranked.length}
            </div>
            <div 
              className="text-slate-500"
              style={{ fontSize: width < 500 ? 9 : 12 }}
            >
              Countries Analyzed
            </div>
          </div>
        </div>

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
              {/* Country labels */}
              {ranked.map((d) => {
                const y = yScale(d.country)!;
                const level = getVulnerabilityLevel(d.compositeScore);
                const color = VULNERABILITY_LEVELS[level].color;
                const isHovered = hoveredCountry === d.country;
                
                // Truncate long country names on mobile
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
                    fill={isHovered ? "#0f172a" : "#475569"}
                    fontWeight={isHovered ? "bold" : "normal"}
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
                const barColor = getBarColor(d.compositeScore);
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

                    {/* Composite score label - only if bar is wide enough */}
                    {barWidth > (width < 500 ? 20 : 40) && (
                      <text
                        x={barWidth - 4}
                        y={y + barHeight / 2 + fontSize * 0.3}
                        textAnchor="end"
                        fontSize={Math.max(7, Math.min(fontSize * 0.85, 10))}
                        fill="#ffffff"
                        fontWeight="600"
                      >
                        {d.compositeScore.toFixed(2)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* X-axis label */}
              <text
                x={chartWidth / 2}
                y={chartHeight + (width < 500 ? 20 : 30)}
                textAnchor="middle"
                fontSize={fontSize}
                fill="#64748b"
              >
                Composite Vulnerability Score →
              </text>

              {/* Reference lines for vulnerability levels */}
              {[2.5, 4.0].map((score) => {
                const x = xScale(score);
                if (x < 5 || x > chartWidth - 5) return null;
                
                return (
                  <g key={score}>
                    <line
                      x1={x}
                      x2={x}
                      y1={0}
                      y2={chartHeight}
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                      strokeDasharray="4 4"
                      opacity="0.4"
                    />
                    <text
                      x={x}
                      y={-6}
                      textAnchor="middle"
                      fontSize={Math.max(6, fontSize * 0.7)}
                      fill="#94a3b8"
                    >
                      {score.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* ─── Tooltip ─── */}
          {tooltip && !isMobile && (
            <div
              className="absolute z-50 max-w-xs rounded-lg bg-slate-900 px-3 sm:px-4 py-2 sm:py-3 text-xs text-white shadow-lg pointer-events-none"
              style={{
                left: Math.min(tooltip.x + 10, width - 220),
                top: Math.min(tooltip.y - 20, height - 200),
                fontSize: getFontSize(12),
              }}
            >
              <div className="mb-1 font-semibold text-amber-300">{tooltip.country}</div>
              <div className="mb-1 font-bold text-cyan-300" style={{ fontSize: fontSize * 1.1 }}>
                Score: {tooltip.compositeScore.toFixed(2)}
              </div>
              <div className="mb-1">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: VULNERABILITY_LEVELS[tooltip.level as keyof typeof VULNERABILITY_LEVELS].bgColor,
                    color: VULNERABILITY_LEVELS[tooltip.level as keyof typeof VULNERABILITY_LEVELS].textColor
                  }}
                >
                  {VULNERABILITY_LEVELS[tooltip.level as keyof typeof VULNERABILITY_LEVELS].label}
                </span>
              </div>
              <div className="border-t border-slate-700 pt-1 mt-1">
                {METRIC_KEYS.slice(0, width < 500 ? 3 : 7).map((key) => {
                  const config = METRIC_CONFIGS[key];
                  const val = tooltip.values[key] || 0;
                  return (
                    <div key={key} className="flex justify-between gap-2 sm:gap-4">
                      <span style={{ color: config.color }}>{config.label}:</span>
                      <span className="font-mono text-amber-300" style={{ fontSize: fontSize * 0.85 }}>
                        {config.format(val)}
                      </span>
                    </div>
                  );
                })}
                {width < 500 && METRIC_KEYS.length > 3 && (
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    +{METRIC_KEYS.length - 3} more metrics
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Mobile Tooltip ─── */}
          {tooltip && isMobile && (
            <div className="mt-2 text-center bg-white border rounded-lg p-2 mx-2">
              <div className="font-semibold text-amber-600 text-xs">{tooltip.country}</div>
              <div className="font-bold text-cyan-600 text-sm">
                Score: {tooltip.compositeScore.toFixed(2)}
              </div>
              <div className="text-xs text-slate-600">
                {VULNERABILITY_LEVELS[tooltip.level as keyof typeof VULNERABILITY_LEVELS].label}
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer Insight ─── */}
        {topCountry && bottomCountry && (
          <div className="mt-4 sm:mt-6 border-t border-slate-200 pt-3 sm:pt-4 text-xs text-slate-600 max-w-3xl mx-auto text-center px-2">
            <p className="font-medium text-slate-700">
              Pacific islands have added almost nothing to the carbon ledger, yet they shoulder its heaviest costs.
            </p>
            <p className="mt-1" style={{ fontSize: fontSize * 0.85 }}>
              {topCountry.country} shows the highest composite vulnerability index (High Vulnerability), 
              while {bottomCountry.country} has the lowest (Low Vulnerability) across all 7 metrics — 
              reflecting the uneven burden of climate change on the region.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
