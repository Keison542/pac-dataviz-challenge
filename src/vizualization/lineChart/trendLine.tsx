"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState, useRef } from "react";
import { line, curveCardinal } from "d3-shape";
import { LineItem } from "@/vizualization/lineChart/LineItem";

const MARGIN = { top: 60, right: 60, bottom: 100, left: 110 };

export const TrendLine = ({
  width,
  height,
  data,
  selectedCountry,
  setSelectedCountry,
  highlightMode = "economic",
}) => {
  const [hovered, setHovered] = useState<any>(null);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // =========================
  // DATA AGGREGATION
  // =========================
  const trendData = useMemo(() => {
    const map = new Map<number, number>();

    data.forEach(d => {
      map.set(d.year, (map.get(d.year) || 0) + (d.value || 0));
    });

    return Array.from(map.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
  }, [data]);

  const maxValue = Math.max(...trendData.map(d => d.value), 1);

  // =========================
  // SCALES
  // =========================
  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([trendData[0]?.year ?? 0, trendData.at(-1)?.year ?? 1])
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

  // =========================
  // LINE
  // =========================
  const linePath = useMemo(() => {
    return (
      line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value))
        .curve(curveCardinal.tension(0.7))(trendData) || ""
    );
  }, [trendData, xScale, yScale]);

  // =========================
  // KEY POINTS
  // =========================
  const worstPoint = useMemo(() => {
    return trendData.reduce(
      (max, d) => (d.value > max.value ? d : max),
      trendData[0]
    );
  }, [trendData]);

  const first = trendData[0];
  const last = trendData.at(-1);

  const growth =
    first && last && first.value !== 0
      ? ((last.value - first.value) / first.value) * 100
      : 0;

  // =========================
  // TOOLTIP FORMAT
  // =========================
  const format = (v: number) =>
    v >= 1e6
      ? `${(v / 1e6).toFixed(1)}M`
      : v >= 1e3
      ? `${(v / 1e3).toFixed(0)}K`
      : v.toFixed(0);

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
          HEADER
      ========================= */}
      <div className="mb-4 text-center max-w-xl mx-auto">
        <div className="text-sm font-medium text-slate-700">
          Livelihood Pressure Curve
        </div>

        <div className="text-xs text-slate-500 mt-1">
          Growth: {growth.toFixed(1)}% · Peak year: {worstPoint?.year}
        </div>
      </div>

      {/* =========================
          CHART
      ========================= */}
      <div className="relative">
        <svg width={width} height={height}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* AREA */}
            <path
              d={`${linePath} L ${xScale(last?.year || 0)} ${boundsHeight} L ${xScale(first?.year || 0)} ${boundsHeight} Z`}
              fill="#06b6d4"
              opacity={0.12}
            />

            {/* LINE */}
            <LineItem
              path={linePath}
              color={
                highlightMode === "human"
                  ? "#0ea5e9"
                  : highlightMode === "system"
                  ? "#14b8a6"
                  : "#06b6d4"
              }
              strokeWidth={3}
              opacity={0.9}
            />

            {/* WORST POINT */}
            {worstPoint && (
              <circle
                cx={xScale(worstPoint.year)}
                cy={yScale(worstPoint.value)}
                r={6}
                fill="#ef4444"
              />
            )}

            {/* INTERACTION LAYER (BETTER HOVER) */}
            {trendData.map((d, i) => (
              <circle
                key={i}
                cx={xScale(d.year)}
                cy={yScale(d.value)}
                r={10}
                fill="transparent"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();

                  setHovered({
                    year: d.year,
                    value: d.value,
                    x: e.clientX - (rect?.left || 0),
                    y: e.clientY - (rect?.top || 0),
                  });
                }}
                onMouseLeave={() => setHovered(null)}
              />
            ))}

            {/* =========================
                AXIS LABELS (NEW)
            ========================= */}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 65}
              textAnchor="middle"
              fontSize={11}
              fill="#64748b"
            >
              Year
            </text>

            <text
              transform="rotate(-90)"
              x={-boundsHeight / 2}
              y={-70}
              textAnchor="middle"
              fontSize={11}
              fill="#64748b"
            >
              Livelihood Impact
            </text>

          </g>
        </svg>

        {/* =========================
            TOOLTIP (FIXED POSITION)
        ========================= */}
        {hovered && (
          <div
            className="absolute bg-white border border-slate-200 rounded-md px-3 py-2 shadow-md text-xs"
            style={{
              left: hovered.x + 20,
              top: hovered.y + 20,
              pointerEvents: "none",
            }}
          >
            <div className="font-semibold text-slate-700">
              {hovered.year}
            </div>
            <div className="text-slate-900 font-bold">
              {format(hovered.value)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
