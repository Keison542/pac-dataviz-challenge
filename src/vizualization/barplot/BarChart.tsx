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
    icon: "",
    color: "#0891b2",
    gradientStart: "#0891b2",
    gradientEnd: "#06b6d4",
    unit: "USD",
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
    icon: "",
    color: "#10b981",
    gradientStart: "#059669",
    gradientEnd: "#10b981",
    unit: "t/ha",
    formatNumber: (v: number) => `${Math.abs(v).toFixed(1)}`
  },

  touristArrivals: {
    title: "Tourist Arrivals by Country",
    insight: "Which tourism-dependent economies are most vulnerable?",
    icon: "",
    color: "#14b8a6",
    gradientStart: "#0d9488",
    gradientEnd: "#14b8a6",
    unit: "visitors",
    formatNumber: (v: number) => {
      const absV = Math.abs(v);
      if (absV >= 1_000_000) return `${(absV / 1_000_000).toFixed(1)}M`;
      if (absV >= 1_000) return `${(absV / 1_000).toFixed(1)}K`;
      return `${absV}`;
    }
  },

  livestockYield: {
    title: "Livestock Yield by Country",
    insight: "Which nations face livestock production challenges?",
    icon: "",
    color: "#f59e0b",
    gradientStart: "#d97706",
    gradientEnd: "#f59e0b",
    unit: "tons",
    formatNumber: (v: number) => {
      const absV = Math.abs(v);
      if (absV >= 1_000_000) return `${(absV / 1_000_000).toFixed(1)}M`;
      if (absV >= 1_000) return `${(absV / 1_000).toFixed(1)}K`;
      return `${absV}`;
    }
  },

  climateAlteringLand: {
    title: "Climate-Altering Land by Country",
    insight: "Which nations have the most land affected by climate change?",
    icon: "",
    color: "#8b5cf6",
    gradientStart: "#7c3aed",
    gradientEnd: "#8b5cf6",
    unit: "hectares",
    formatNumber: (v: number) => `${Math.abs(v)}`
  },

  populationGrowth: {
    title: "Population Growth by Country",
    insight: "Which nations have the highest population growth rates?",
    icon: "",
    color: "#ec4898",
    gradientStart: "#db2777",
    gradientEnd: "#ec4898",
    unit: "%",
    formatNumber: (v: number) => `${Math.abs(v).toFixed(1)}`
  },

  affectedPersons: {
    title: "People Affected by Country",
    insight: "Which nations have the highest number of people affected?",
    icon: "",
    color: "#ef4444",
    gradientStart: "#dc2626",
    gradientEnd: "#ef4444",
    unit: "people",
    formatNumber: (v: number) => {
      const absV = Math.abs(v);
      if (absV >= 1_000_000) return `${(absV / 1_000_000).toFixed(1)}M`;
      if (absV >= 1_000) return `${(absV / 1_000).toFixed(1)}K`;
      return `${absV}`;
    }
  }
};

// Animated bar
const AnimatedBar = ({ width, height, y, x, fill, rx, isHovered, onMouseEnter, onMouseLeave }: any) => {
  const springProps = useSpring({
    width,
    opacity: isHovered ? 0.95 : 0.85,
    config: { tension: 200, friction: 20 },
  });

  return (
    <>
      <animated.rect
        x={x}
        y={y}
        width={springProps.width}
        height={height}
        rx={rx}
        fill={fill}
        opacity={springProps.opacity}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: "pointer" }}
      />
    </>
  );
};

export function MultiMetricRankedDashboard({ width, height, data }: Props) {
  const [selectedMetric, setSelectedMetric] =
    useState<keyof typeof METRIC_CONFIGS>("economicLoss");

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const currentMetric = METRIC_CONFIGS[selectedMetric];
  const currentData = data?.[selectedMetric] ?? [];

  // Aggregate safely
  const ranked = useMemo(() => {
    if (!Array.isArray(currentData)) return [];

    const map = new Map<string, number>();

    currentData.forEach(d => {
      if (!d?.country || typeof d.value !== "number") return;
      map.set(d.country, (map.get(d.country) ?? 0) + d.value);
    });

    return Array.from(map.entries())
      .map(([country, value]) => ({ country, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentData]);

  // ✅ EARLY RETURN (CRITICAL FIX)
  if (!ranked.length) {
    return (
      <div className="flex items-center justify-center w-full h-full text-slate-400">
        No data available
      </div>
    );
  }

  const hasNegative = ranked.some(d => d.value < 0);

  const minValue = Math.min(...ranked.map(d => d.value), 0);
  const maxValue = Math.max(...ranked.map(d => d.value), 1);

  const paddedMin = minValue < 0 ? minValue * 1.1 : 0;
  const paddedMax = maxValue * 1.1;

  const MARGIN = { top: 40, right: 40, bottom: 40, left: hasNegative ? 120 : 80 };

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const xScale = scaleLinear()
    .domain([paddedMin, paddedMax])
    .nice()
    .range([0, boundsWidth]);

  const yScale = scaleBand()
    .domain(ranked.map(d => d.country))
    .range([0, boundsHeight])
    .padding(0.25);

  const zeroX = xScale(0);

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

        {/* zero line */}
        {hasNegative && (
          <line
            x1={zeroX}
            x2={zeroX}
            y1={0}
            y2={boundsHeight}
            stroke="#94a3b8"
            strokeDasharray="4 4"
          />
        )}

        {/* bars */}
        {ranked.map(d => {
          const y = yScale(d.country)!;
          const h = yScale.bandwidth();
          const x = d.value < 0 ? xScale(d.value) : zeroX;
          const w = Math.abs(xScale(d.value) - zeroX);

          return (
            <g key={d.country}>
              <text
                x={-10}
                y={y + h / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="#475569"
                onMouseEnter={() => setHoveredCountry(d.country)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                {d.country}
              </text>

              <AnimatedBar
                x={x}
                y={y}
                width={w}
                height={h}
                rx={4}
                fill={d.value < 0 ? "#94a3b8" : currentMetric.color}
                isHovered={hoveredCountry === d.country}
                onMouseEnter={() => setHoveredCountry(d.country)}
                onMouseLeave={() => setHoveredCountry(null)}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
