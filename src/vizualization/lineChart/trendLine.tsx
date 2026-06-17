"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState, useRef, useEffect } from "react";
import { line, curveCardinal } from "d3-shape";
import { LineItem } from "@/vizualization/lineChart/LineItem";

const MARGIN = { top: 60, right: 60, bottom: 90, left: 110 };

export type UnifiedDatum = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  width: number;
  height: number;
  data: UnifiedDatum[];
  selectedCountry?: string;
  setSelectedCountry: (c: string) => void;
  highlightMode?: "economic" | "human" | "system";
};

export const TrendLine = ({
  width,
  height,
  data,
  selectedCountry,
  setSelectedCountry,
  highlightMode = "economic",
}: Props) => {
  const [hoveredPoint, setHoveredPoint] = useState<UnifiedDatum | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // ----------------------------
  // DATA AGGREGATION
  // ----------------------------
  const trendData = useMemo(() => {
    const map = new Map<number, number>();

    data.forEach((d) => {
      map.set(d.year, (map.get(d.year) || 0) + (d.value || 0));
    });

    return Array.from(map.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
  }, [data]);

  const maxValue = Math.max(...trendData.map((d) => d.value), 1);

  // ----------------------------
  // SCALES
  // ----------------------------
  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([
          trendData[0]?.year ?? 0,
          trendData.at(-1)?.year ?? 1,
        ])
        .range([0, boundsWidth]),
    [trendData, boundsWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([boundsHeight, 0]),
    [maxValue, boundsHeight]
  );

  // ----------------------------
  // LINE PATH
  // ----------------------------
  const linePath = useMemo(() => {
    return (
      line<{ year: number; value: number }>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.value))
        .curve(curveCardinal.tension(0.7))(trendData) || ""
    );
  }, [trendData, xScale, yScale]);

  // ----------------------------
  // KEY STORY POINTS
  // ----------------------------
  const worstPoint = useMemo(() => {
    return trendData.reduce((max, d) =>
      d.value > max.value ? d : max,
      trendData[0]
    );
  }, [trendData]);

  const first = trendData[0];
  const last = trendData.at(-1);

  const growth =
    first && last && first.value !== 0
      ? ((last.value - first.value) / first.value) * 100
      : 0;

  // ----------------------------
  // NARRATIVE TEXT (adaptive to section 2)
  // ----------------------------
  const narrative =
    highlightMode === "economic"
      ? "Economic losses signal the first structural stress in livelihoods."
      : highlightMode === "human"
      ? "Rising impacts translate directly into human exposure."
      : "Long-term livelihood systems begin reorganizing under climate pressure.";

  const format = (v: number) =>
    v >= 1e6
      ? `${(v / 1e6).toFixed(1)}M`
      : v >= 1e3
      ? `${(v / 1e3).toFixed(0)}K`
      : v.toString();

  if (!trendData.length) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-500">
        No livelihood data available
      </div>
    );
  }

  return (
    <div className="w-full font-sans">

      {/* =========================
          NARRATIVE HEADER (NOT KPI GRID)
      ========================== */}
      <div className="mb-4 text-center max-w-xl mx-auto">
        <div className="text-sm font-medium text-slate-700">
          Livelihood Pressure Curve
        </div>

        <p className="text-xs text-slate-500 mt-1">
          {narrative}
        </p>

        <div className="text-[11px] text-slate-400 mt-2">
          Growth: {growth.toFixed(1)}% · Peak impact year: {worstPoint?.year}
        </div>
      </div>

      {/* =========================
          CHART
      ========================== */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="overflow-visible"
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* SOFT GRID (reduced visual dominance) */}
            <line
              x1={0}
              x2={boundsWidth}
              y1={yScale(0)}
              y2={yScale(0)}
              stroke="#e2e8f0"
              strokeWidth={1}
            />

            {/* AREA BACKGROUND */}
            <path
              d={`${linePath} L ${xScale(last?.year || 0)} ${boundsHeight} L ${xScale(first?.year || 0)} ${boundsHeight} Z`}
              fill="#06b6d4"
              opacity={0.12}
            />

            {/* MAIN LINE */}
            <LineItem
              path={linePath}
              color={
                highlightMode === "human"
                  ? "#0ea5e9"
                  : highlightMode === "system"
                  ? "#14b8a6"
                  : "#06b6d4"
              }
              opacity={0.9}
              strokeWidth={3}
              onHover={() => {}}
            />

            {/* STORY PEAK MARKER */}
            {worstPoint && (
              <circle
                cx={xScale(worstPoint.year)}
                cy={yScale(worstPoint.value)}
                r={6}
                fill="#ef4444"
                opacity={0.9}
              />
            )}

            {/* SIMPLIFIED POINTS */}
            {trendData.map((d, i) => (
              <circle
                key={i}
                cx={xScale(d.year)}
                cy={yScale(d.value)}
                r={3}
                fill="#06b6d4"
                opacity={0.6}
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}

            {/* X LABELS (minimal) */}
            {trendData
              .filter((_, i) => i % Math.ceil(trendData.length / 5) === 0)
              .map((d, i) => (
                <text
                  key={i}
                  x={xScale(d.year)}
                  y={boundsHeight + 20}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#94a3b8"
                >
                  {d.year}
                </text>
              ))}
          </g>
        </svg>

        {/* =========================
            STORY TOOLTIP
        ========================== */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="text-xs font-semibold text-slate-700">
              {hoveredPoint.year}
            </div>
            <div className="text-sm font-bold text-slate-900">
              {format(hoveredPoint.value)}
            </div>
            <div className="text-[10px] text-slate-500">
              livelihood impact recorded
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
