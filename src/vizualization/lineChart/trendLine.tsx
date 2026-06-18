"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState } from "react";
import { line, curveMonotoneX } from "d3-shape";
import { LineItem } from "@/vizualization/lineChart/LineItem";

const MARGIN = { top: 50, right: 40, bottom: 90, left: 100 };

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
}: Props) => {
  const [hovered, setHovered] = useState<UnifiedDatum | null>(null);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // Aggregate by year
  const trendData = useMemo(() => {
    const map = new Map<number, number>();

    data.forEach((d) => {
      map.set(d.year, (map.get(d.year) || 0) + d.value);
    });

    return Array.from(map.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
  }, [data]);

  const maxValue = useMemo(
    () => Math.max(...trendData.map((d) => d.value), 1),
    [trendData]
  );

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

  const linePath = useMemo(() => {
    return (
      line<{ year: number; value: number }>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.value))
        .curve(curveMonotoneX)(trendData) || ""
    );
  }, [trendData, xScale, yScale]);

  if (!trendData.length) return null;

  const format = (v: number) =>
    v >= 1e6
      ? `${(v / 1e6).toFixed(1)}M`
      : v >= 1e3
      ? `${(v / 1e3).toFixed(0)}K`
      : v.toString();

  return (
    <div className="w-full font-sans">

      {/* HEADER */}
      <div className="mb-5 text-center max-w-xl mx-auto">
        <div className="text-sm font-semibold text-slate-900">
          Livelihood Pressure Curve
        </div>

        <p className="text-xs text-slate-600 mt-1">
          Aggregated impact trend across years
        </p>
      </div>

      {/* CHART */}
      <div className="relative">
        <svg width={width} height={height}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* subtle baseline */}
            <line
              x1={0}
              x2={boundsWidth}
              y1={yScale(0)}
              y2={yScale(0)}
              stroke="#e5e7eb"
            />

            {/* LINE */}
            <LineItem
              path={linePath}
              color="#0ea5e9"
              strokeWidth={3}
              opacity={0.95}
              onHover={() => {}}
            />

            {/* POINTS */}
            {trendData.map((d, i) => {
              const isActive = hovered?.year === d.year;

              return (
                <circle
                  key={i}
                  cx={xScale(d.year)}
                  cy={yScale(d.value)}
                  r={isActive ? 6 : 3}
                  fill={isActive ? "#0284c7" : "#38bdf8"}
                  opacity={isActive ? 1 : 0.6}
                  onMouseEnter={() => setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}

            {/* AXIS LABELS */}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 55}
              textAnchor="middle"
              fontSize={11}
              fill="#374151"
            >
              Year
            </text>

            <text
              x={-60}
              y={boundsHeight / 2}
              textAnchor="middle"
              fontSize={11}
              fill="#374151"
              transform={`rotate(-90, -60, ${boundsHeight / 2})`}
            >
              Impact Level
            </text>

            {/* X ticks */}
            {trendData
              .filter((_, i) =>
                i % Math.ceil(trendData.length / 5) === 0
              )
              .map((d, i) => (
                <text
                  key={i}
                  x={xScale(d.year)}
                  y={boundsHeight + 25}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6b7280"
                >
                  {d.year}
                </text>
              ))}
          </g>
        </svg>

        {/* TOOLTIP */}
        {hovered && (
          <div className="absolute top-3 right-3 bg-white border border-slate-200 rounded-lg p-3 shadow-md">
            <div className="text-xs font-semibold text-slate-900">
              {hovered.year}
            </div>
            <div className="text-sm font-bold text-slate-800">
              {format(hovered.value)}
            </div>
            <div className="text-[10px] text-slate-500">
              recorded impact trend
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
