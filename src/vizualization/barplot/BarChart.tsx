"use client";

import { scaleBand, scaleLinear } from "d3-scale";
import { useMemo, useState } from "react";
import { animated, useSpring } from "@react-spring/web";

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

export function MultiMetricRankedDashboard({ width, height, data }: Props) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<null | {
    x: number;
    y: number;
    country: string;
    values: Record<string, number>;
    compositeScore: number;
    level: string;
  }>(null);

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

  // ─── 5. Get total composite sum ───
  const totalComposite = ranked.reduce((sum, d) => sum + d.compositeScore, 0);

  // ─── 6. Chart dimensions ───
  const leftMargin = 120;
  const topMargin = 40;
  const chartWidth = width - leftMargin - 20;
  const chartHeight = height - topMargin - 20;

  const maxComposite = Math.max(...ranked.map((d) => d.compositeScore), 1);

  const yScale = scaleBand()
    .domain(ranked.map((d) => d.country))
    .range([0, chartHeight])
    .padding(0.25);

  const xScale = scaleLinear()
    .domain([0, maxComposite * 1.15])
    .range([0, chartWidth]);

  // ─── 7. Tooltip handlers ───
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

  // ─── 8. Get color based on vulnerability level ───
  const getBarColor = (score: number) => {
    const level = getVulnerabilityLevel(score);
    const colorMap = {
      high: "#ef4444",
      medium: "#f59e0b",
      low: "#10b981"
    };
    return colorMap[level];
  };

  if (!ranked.length) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full flex justify-center">

      {/* ─── Header ─── */}
      <div className="mb-4">
        <p className="text-sm text-slate-600">
          Regional Vulnerability Index: Composite score across 7 key climate impact metrics
        </p>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-cyan-50 p-2 text-center">
          <div className="text-lg font-bold text-cyan-700">
            {topCountry?.country || "—"}
          </div>
          <div className="text-xs text-slate-500">Highest Vulnerability</div>
        </div>
        <div className="rounded-lg bg-amber-50 p-2 text-center">
          <div className="text-lg font-bold text-amber-700">
            {bottomCountry?.country || "—"}
          </div>
          <div className="text-xs text-slate-500">Lowest Vulnerability</div>
        </div>
        <div className="rounded-lg bg-purple-50 p-2 text-center">
          <div className="text-lg font-bold text-purple-700">
            {ranked.length}
          </div>
          <div className="text-xs text-slate-500">Countries Analyzed</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-center">
          <div className="text-lg font-bold text-slate-700">
            {METRIC_KEYS.length}
          </div>
          <div className="text-xs text-slate-500">Metrics Combined</div>
        </div>
      </div>

      {/* ─── Vulnerability Level Legend ─── */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-slate-600">Vulnerability Level:</span>
        {Object.entries(VULNERABILITY_LEVELS).map(([key, level]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: level.color }}
            />
            <span className="text-slate-600">{level.label}</span>
            <span className="text-slate-400">({level.range})</span>
          </div>
        ))}
      </div>

      {/* ─── Chart ─── */}
      <svg width={width} height={height}>
        <g transform={`translate(${leftMargin},${topMargin})`}>
          {/* Country labels */}
          {ranked.map((d) => {
            const y = yScale(d.country)!;
            const level = getVulnerabilityLevel(d.compositeScore);
            const color = VULNERABILITY_LEVELS[level].color;
            
            return (
              <text
                key={d.country}
                x={-10}
                y={y + yScale.bandwidth() / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill={hoveredCountry === d.country ? "#0f172a" : "#475569"}
                fontWeight={hoveredCountry === d.country ? "bold" : "normal"}
              >
                {d.country}
              </text>
            );
          })}

          {/* Bars */}
          {ranked.map((d) => {
            const y = yScale(d.country)!;
            const barWidth = xScale(d.compositeScore);
            const isHovered = hoveredCountry === d.country;
            const barColor = getBarColor(d.compositeScore);

            return (
              <g key={d.country}>
                {/* Bar */}
                <AnimatedBar
                  x={0}
                  y={y}
                  width={barWidth}
                  height={yScale.bandwidth()}
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
                  height={yScale.bandwidth()}
                  fill="transparent"
                  onMouseMove={(e) => handleMouseMove(e, d.country, d.values, d.compositeScore)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: "pointer" }}
                />

                {/* Composite score label */}
                {barWidth > 40 && (
                  <text
                    x={barWidth - 6}
                    y={y + yScale.bandwidth() / 2 + 4}
                    textAnchor="end"
                    fontSize={10}
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
            y={chartHeight + 30}
            textAnchor="middle"
            fontSize={11}
            fill="#64748b"
          >
            Composite Vulnerability Score →
          </text>

          {/* Reference lines for vulnerability levels */}
          {[2.5, 4.0].map((score) => {
            const x = xScale(score);
            return (
              <g key={score}>
                <line
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={chartHeight}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
                <text
                  x={x}
                  y={-8}
                  textAnchor="middle"
                  fontSize={8}
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
      {tooltip && (
        <div
          className="absolute z-50 max-w-xs rounded-lg bg-slate-900 px-4 py-3 text-xs text-white shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 20,
            transform: "translate(0,0)"
          }}
        >
          <div className="mb-1 font-semibold text-amber-300">{tooltip.country}</div>
          <div className="mb-1 text-sm font-bold text-cyan-300">
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
            {METRIC_KEYS.map((key) => {
              const config = METRIC_CONFIGS[key];
              const val = tooltip.values[key] || 0;
              return (
                <div key={key} className="flex justify-between gap-4">
                  <span style={{ color: config.color }}>{config.label}:</span>
                  <span className="font-mono text-amber-300">{config.format(val)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Footer Insight ─── */}
      {topCountry && bottomCountry && (
        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <p>
            {topCountry.country} has the highest composite vulnerability index (High Vulnerability),
            while {bottomCountry.country} has the lowest (Low Vulnerability)
            across all 7 metrics.
          </p>
        </div>
      )}
    </div>
  );
}
