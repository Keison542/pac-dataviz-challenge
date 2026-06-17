"use client";

import { scaleLinear } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import { useState, useMemo, useEffect } from "react";
import { LineItem } from "./LineItem";

const MARGIN = { top: 50, right: 40, bottom: 70, left: 75 };

export type ClimateDriverType =
  | "surfaceTempAnomaly"
  | "seaSurfaceTempAnomaly"
  | "precipitationAnomaly"
  | "seaLevelAnomaly";

type ClimateDataPoint = {
  year: number;
  value: number;
};

type LineChartProps = {
  width: number;
  height: number;
  data: ClimateDataPoint[];
  dataType: ClimateDriverType;
  selectedCountry?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
};

export const LineChart = ({
  width,
  height,
  data,
  dataType,
  selectedCountry = "Selected Country",
  xAxisLabel = "Year",
  yAxisLabel = "Value",
}: LineChartProps) => {
  const [tooltip, setTooltip] = useState<any>(null);
  const [animate, setAnimate] = useState(false);

  const boundsWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const boundsHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(d => d && typeof d.year === "number" && typeof d.value === "number");
  }, [data]);

  const processedData = useMemo(
    () => [...safeData].sort((a, b) => a.year - b.year),
    [safeData]
  );

  const xScale = useMemo(() => {
    const years = processedData.map(d => d.year);
    return scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, boundsWidth]);
  }, [processedData, boundsWidth]);

  const yScale = useMemo(() => {
    const values = processedData.map(d => d.value);
    return scaleLinear()
      .domain([Math.min(...values), Math.max(...values)])
      .range([boundsHeight, 0]);
  }, [processedData, boundsHeight]);

  const lineBuilder = useMemo(
    () =>
      line<any>()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value))
        .curve(curveMonotoneX),
    [xScale, yScale]
  );

  const areaBuilder = useMemo(
    () =>
      area<any>()
        .x(d => xScale(d.year))
        .y0(boundsHeight)
        .y1(d => yScale(d.value))
        .curve(curveMonotoneX),
    [xScale, yScale, boundsHeight]
  );

  useEffect(() => {
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  if (!processedData.length) return null;

  const linePath = lineBuilder(processedData);
  const areaPath = areaBuilder(processedData);

  return (
    <div className="w-full relative">

      {/* HEADER */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">
          Climate Signal: {dataType}
        </h3>
        <p className="text-xs text-slate-500">
          Trend visualization for {selectedCountry}
        </p>
      </div>

      {/* SVG */}
      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {/* AREA */}
          {areaPath && (
            <path d={areaPath} fill="#60a5fa" opacity={0.15} />
          )}

          {/* LINE */}
          {linePath && (
            <LineItem
              path={linePath}
              color="#2563eb"
              strokeWidth={3}
              opacity={animate ? 1 : 0}
              onHover={() => {}}
            />
          )}

          {/* POINTS WITH TOOLTIP */}
          {processedData.map((d, i) => (
            <circle
              key={i}
              cx={xScale(d.year)}
              cy={yScale(d.value)}
              r={4}
              fill="#2563eb"
              onMouseEnter={(e) =>
                setTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  year: d.year,
                  value: d.value,
                })
              }
              onMouseLeave={() => setTooltip(null)}
            />
          ))}

          {/* AXIS LABELS (NEW) */}
          <text x={boundsWidth / 2} y={boundsHeight + 55} textAnchor="middle" fontSize={11} fill="#64748b">
            {xAxisLabel}
          </text>

          <text
            transform="rotate(-90)"
            x={-boundsHeight / 2}
            y={-55}
            textAnchor="middle"
            fontSize={11}
            fill="#64748b"
          >
            {yAxisLabel}
          </text>

        </g>
      </svg>

      {/* TOOLTIP */}
      {tooltip && (
        <div
          className="absolute bg-white border shadow-md rounded px-2 py-1 text-xs"
          style={{ left: tooltip.x + 10, top: tooltip.y + 10 }}
        >
          <div>{tooltip.year}</div>
          <div className="font-bold">{tooltip.value}</div>
        </div>
      )}
    </div>
  );
};
