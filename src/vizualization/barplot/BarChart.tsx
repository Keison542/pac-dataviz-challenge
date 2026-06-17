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
    title: "Economic Loss by Country",
    insight: "Who bears the highest financial burden from disasters?",
    color: "#0891b2",
    gradientStart: "#0891b2",
    gradientEnd: "#06b6d4",
    unit: "USD",
    format: (v: number) => {
      const absV = Math.abs(v);
      if (absV >= 1_000_000_000) return `$${(absV / 1_000_000_000).toFixed(1)}B`;
      if (absV >= 1_000_000) return `$${(absV / 1_000_000).toFixed(1)}M`;
      if (absV >= 1_000) return `$${(absV / 1_000).toFixed(1)}K`;
      return `$${absV}`;
    },
    formatNumber: (v: number) => {
      const absV = Math.abs(v);
      if (absV >= 1_000_000_000) return `${(absV / 1_000_000_000).toFixed(1)}B`;
      if (absV >= 1_000_000) return `${(absV / 1_000_000).toFixed(1)}M`;
      if (absV >= 1_000) return `${(absV / 1_000).toFixed(1)}K`;
      return `${absV}`;
    }
  },
  cropYield: {
    title: "Crop Yield Impact by Country",
    insight: "Which nations face the greatest agricultural productivity loss?",
    color: "#10b981",
    gradientStart: "#059669",
    gradientEnd: "#10b981",
    unit: "t/ha",
    format: (v: number) => `${Math.abs(v).toFixed(1)} t/ha`,
    formatNumber: (v: number) => `${Math.abs(v).toFixed(1)}`
  },
  touristArrivals: {
    title: "Tourist Arrivals by Country",
    insight: "Which tourism-dependent economies are most vulnerable?",
    color: "#14b8a6",
    gradientStart: "#0d9488",
    gradientEnd: "#14b8a6",
    unit: "visitors",
    format: (v: number) => `${Math.abs(v)} visitors`,
    formatNumber: (v: number) => `${Math.abs(v)}`
  },
  livestockYield: {
    title: "Livestock Yield by Country",
    insight: "Which nations face livestock production challenges?",
    color: "#f59e0b",
    gradientStart: "#d97706",
    gradientEnd: "#f59e0b",
    unit: "tons",
    format: (v: number) => `${Math.abs(v)} tons`,
    formatNumber: (v: number) => `${Math.abs(v)}`
  },
  climateAlteringLand: {
    title: "Climate-Altering Land by Country",
    insight: "Which nations have the most land affected by climate change?",
    color: "#8b5cf6",
    gradientStart: "#7c3aed",
    gradientEnd: "#8b5cf6",
    unit: "hectares",
    format: (v: number) => `${Math.abs(v)} ha`,
    formatNumber: (v: number) => `${Math.abs(v)}`
  },
  populationGrowth: {
    title: "Population Growth by Country",
    insight: "Which nations have the highest population growth rates?",
    color: "#ec4898",
    gradientStart: "#db2777",
    gradientEnd: "#ec4898",
    unit: "%",
    format: (v: number) => `${Math.abs(v)}%`,
    formatNumber: (v: number) => `${Math.abs(v)}`
  },
  affectedPersons: {
    title: "People Affected by Country",
    insight: "Which nations have the highest number of people affected?",
    color: "#ef4444",
    gradientStart: "#dc2626",
    gradientEnd: "#ef4444",
    unit: "people",
    format: (v: number) => `${Math.abs(v)} people`,
    formatNumber: (v: number) => `${Math.abs(v)}`
  }
};

const AnimatedBar = ({
  width,
  height,
  y,
  x,
  fill,
  isHovered,
  onMouseEnter,
  onMouseLeave
}: any) => {
  const springProps = useSpring({
    width,
    opacity: isHovered ? 1 : 0.85,
    config: { tension: 200, friction: 20 }
  });

  return (
    <>
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
    </>
  );
};

export function MultiMetricRankedDashboard({
  width,
  height,
  data
}: Props) {
  const [selectedMetric, setSelectedMetric] =
    useState<keyof typeof METRIC_CONFIGS>("economicLoss");

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const [tooltip, setTooltip] = useState<null | {
    x: number;
    y: number;
    country: string;
    value: number;
  }>(null);

  const currentMetric = METRIC_CONFIGS[selectedMetric];
  const currentData = data[selectedMetric];

  const ranked = useMemo(() => {
    if (!currentData) return [];
    const map = new Map<string, number>();

    currentData.forEach((d) => {
      map.set(d.country, (map.get(d.country) ?? 0) + d.value);
    });

    return Array.from(map.entries())
      .map(([country, value]) => ({ country, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentData]);

  const widthInner = width - 140;
  const heightInner = height - 100;

  const yScale = scaleBand()
    .domain(ranked.map((d) => d.country))
    .range([0, heightInner])
    .padding(0.25);

  const xScale = scaleLinear()
    .domain([0, Math.max(...ranked.map((d) => d.value), 1)])
    .range([0, widthInner]);

  return (
    <div className="relative w-full">

      {/* TOOLTIP */}
      {tooltip && (
        <div
          className="absolute z-50 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            transform: "translate(0,0)"
          }}
        >
          <div className="font-semibold">{tooltip.country}</div>
          <div>
            {currentMetric.format(tooltip.value)}
          </div>
        </div>
      )}

      <svg width={width} height={height}>
        <g transform="translate(120,40)">
          {ranked.map((d) => {
            const y = yScale(d.country)!;
            const barWidth = xScale(d.value);

            return (
              <g key={d.country}>
                <text
                  x={-10}
                  y={y + 12}
                  textAnchor="end"
                  fontSize={11}
                  fill="#475569"
                >
                  {d.country}
                </text>

                <AnimatedBar
                  x={0}
                  y={y}
                  width={barWidth}
                  height={yScale.bandwidth()}
                  fill={currentMetric.gradientStart}
                  isHovered={hoveredCountry === d.country}
                  onMouseEnter={() => setHoveredCountry(d.country)}
                  onMouseLeave={() => setHoveredCountry(null)}
                />

                {/* hover capture layer */}
                <rect
                  x={0}
                  y={y}
                  width={barWidth}
                  height={yScale.bandwidth()}
                  fill="transparent"
                  onMouseMove={(e) => {
                    const rect = (e.target as SVGRectElement).getBoundingClientRect();
                    setTooltip({
                      x: rect.left,
                      y: rect.top,
                      country: d.country,
                      value: d.value
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
