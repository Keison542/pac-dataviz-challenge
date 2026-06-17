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

// same METRIC_CONFIGS (unchanged)
const METRIC_CONFIGS = { /* unchanged — keep your existing configs */ };

// Animated Bar (unchanged)
const AnimatedBar = (props: any) => {
  const springProps = useSpring({
    width: props.width,
    opacity: props.isHovered ? 0.95 : 0.85,
    config: { tension: 200, friction: 20 },
  });

  return (
    <>
      <animated.rect
        x={props.x}
        y={props.y}
        width={springProps.width}
        height={props.height}
        fill={props.fill}
        rx={props.rx}
        opacity={springProps.opacity}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
        className="cursor-pointer"
      />
    </>
  );
};

export function MultiMetricRankedDashboard({
  width,
  height,
  data,
  selectedCountry,
}: Props) {
  const [selectedMetric, setSelectedMetric] =
    useState<keyof typeof METRIC_CONFIGS>("economicLoss");

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

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

  if (!ranked.length) {
    return (
      <div className="p-6 text-center text-slate-400">
        No data available
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // 🔥 INEQUALITY METRICS (NEW CORE LOGIC)
  // ─────────────────────────────────────────────
  const values = ranked.map((d) => d.value);
  const total = values.reduce((a, b) => a + b, 0);

  const top1 = values[0];
  const top3 = values.slice(0, 3).reduce((a, b) => a + b, 0);
  const median = values[Math.floor(values.length / 2)] ?? 0;
  const bottom = values[values.length - 1] ?? 0;

  const topShare = total ? (top1 / total) * 100 : 0;
  const top3Share = total ? (top3 / total) * 100 : 0;

  // simple inequality proxy (no math jargon)
  const imbalanceScore = topShare > 40 ? "Highly concentrated" :
                         topShare > 25 ? "Moderately uneven" :
                         "Fairly distributed";

  const MARGIN = { top: 50, right: 40, bottom: 50, left: 90 };
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const yScale = scaleBand()
    .domain(ranked.map((d) => d.country))
    .range([0, boundsHeight])
    .padding(0.25);

  const xScale = scaleLinear()
    .domain([0, Math.max(...values) * 1.15])
    .range([0, boundsWidth]);

  const medianX = xScale(median);

  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800">
          Unequal Distribution of Climate Impacts
        </h3>
        <p className="text-xs text-slate-600">
          This view highlights how climate burden is distributed across nations — not just who is highest, but how uneven the system is.
        </p>
      </div>

      {/* INEQUALITY INSIGHT CARDS */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="p-2 bg-rose-50 rounded">
          <div className="text-sm font-bold text-rose-600">
            {topShare.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500">carried by top nation</div>
        </div>

        <div className="p-2 bg-amber-50 rounded">
          <div className="text-sm font-bold text-amber-600">
            {top3Share.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500">top 3 concentration</div>
        </div>

        <div className="p-2 bg-slate-100 rounded">
          <div className="text-sm font-bold text-slate-700">
            {imbalanceScore}
          </div>
          <div className="text-[10px] text-slate-500">system pattern</div>
        </div>
      </div>

      {/* STORYLINE */}
      <p className="text-sm text-slate-700 mb-4">
        The data reveals a structurally uneven system where a small number of countries carry a disproportionate share of {currentMetric.title.toLowerCase()}.
        This creates a “top-heavy” climate burden across the Pacific region.
      </p>

      {/* SVG */}
      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {/* MEDIAN DIVIDER (NEW VISUAL STORY) */}
          <line
            x1={medianX}
            x2={medianX}
            y1={0}
            y2={boundsHeight}
            stroke="#cbd5e1"
            strokeDasharray="4 4"
          />

          {/* BACKGROUND SPLIT */}
          <rect x={0} y={0} width={medianX} height={boundsHeight} fill="#f8fafc" />
          <rect x={medianX} y={0} width={boundsWidth - medianX} height={boundsHeight} fill="#fff7ed" opacity={0.3} />

          {/* BARS */}
          {ranked.map((d) => {
            const y = yScale(d.country)!;
            const w = xScale(d.value);

            const isTop = d.value === top1;

            return (
              <g key={d.country}
                 onMouseEnter={() => setHoveredCountry(d.country)}
                 onMouseLeave={() => setHoveredCountry(null)}>

                <text
                  x={-10}
                  y={y + 12}
                  fontSize={11}
                  textAnchor="end"
                  fill="#475569"
                >
                  {d.country}
                </text>

                <AnimatedBar
                  x={0}
                  y={y}
                  width={w}
                  height={yScale.bandwidth()}
                  rx={4}
                  fill={isTop ? "#ef4444" : "#3b82f6"}
                  isHovered={hoveredCountry === d.country}
                />

                <text
                  x={w + 5}
                  y={y + 12}
                  fontSize={10}
                  fill="#64748b"
                >
                  {Math.round(d.value)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* FOOTER STORY */}
      <p className="text-xs text-slate-500 mt-4">
        Interpretation: {topShare.toFixed(0)}% of total impact is concentrated in the most affected nation,
        indicating a strongly uneven climate burden across the region.
      </p>

    </div>
  );
}
