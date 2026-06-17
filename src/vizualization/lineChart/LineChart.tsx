"use client";

import { scaleLinear } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import { useState, useMemo, useEffect, useRef } from "react";
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

const getChartLabel = (dataType: ClimateDriverType): string => {
  switch (dataType) {
    case "surfaceTempAnomaly":
      return "Surface Temperature";
    case "seaSurfaceTempAnomaly":
      return "Sea Surface Temperature";
    case "precipitationAnomaly":
      return "Rainfall Anomaly";
    case "seaLevelAnomaly":
      return "Sea Level Rise";
    default:
      return "Value";
  }
};

const getUnit = (dataType: ClimateDriverType): string => {
  switch (dataType) {
    case "surfaceTempAnomaly":
    case "seaSurfaceTempAnomaly":
      return "°C";
    case "precipitationAnomaly":
      return "mm";
    case "seaLevelAnomaly":
      return "m";
    default:
      return "";
  }
};

export const LineChart = ({
  width,
  height,
  data,
  dataType,
  selectedCountry = "Selected Country",
  xAxisLabel = "Year",
  yAxisLabel,
}: LineChartProps) => {
  const [tooltip, setTooltip] = useState<any>(null);
  const hoverRef = useRef<SVGCircleElement | null>(null);

  const boundsWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const boundsHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(
      d => d && typeof d.year === "number" && typeof d.value === "number"
    );
  }, [data]);

  const processedData = useMemo(
    () => [...safeData].sort((a, b) => a.year - b.year),
    [safeData]
  );

  const stats = useMemo(() => {
    if (!processedData.length) return null;

    const first = processedData[0].value;
    const last = processedData[processedData.length - 1].value;

    const percentChange =
      first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;

    return {
      percentChange,
      trend:
        percentChange > 0
          ? "warming / rising"
          : percentChange < 0
          ? "cooling / falling"
          : "stable",
    };
  }, [processedData]);

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

  const linePath = lineBuilder(processedData);
  const areaPath = areaBuilder(processedData);

  const chartLabel = getChartLabel(dataType);
  const unit = getUnit(dataType);

  if (!processedData.length) return null;

  return (
    <div className="w-full relative">

      {/* ===================== */}
      {/* HEADER (UNCHANGED) */}
      {/* ===================== */}
      <div className="text-center mb-6">
        <div className="text-xs tracking-widest text-slate-500 font-semibold">
          CLIMATE SIGNAL EVIDENCE
        </div>

        <h3 className="text-lg font-bold text-slate-800 mt-1">
          {chartLabel} trend confirmation
        </h3>

        {stats && (
          <div className="mt-2 text-sm text-slate-600">
            Signal detected:{" "}
            <span
              className={
                stats.percentChange > 0
                  ? "text-red-600 font-semibold"
                  : "text-blue-600 font-semibold"
              }
            >
              {stats.trend}
            </span>{" "}
            ({Math.abs(stats.percentChange).toFixed(1)}%)
          </div>
        )}
      </div>

      {/* ===================== */}
      {/* TOOLTIP (FIXED) */}
      {/* ===================== */}
      {tooltip && (
        <div
          className="absolute z-50 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 40,
          }}
        >
          <div className="font-semibold">{selectedCountry}</div>
          <div>Year: {tooltip.year}</div>
          <div>
            Value: {tooltip.value.toFixed(2)} {unit}
          </div>
        </div>
      )}

      {/* ===================== */}
      {/* CHART */}
      {/* ===================== */}
      <div className="relative">
        <svg width={width} height={height}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* AREA */}
            {areaPath && (
              <path
                d={areaPath}
                fill="rgba(37, 99, 235, 0.1)"
                opacity={1}
              />
            )}

            {/* LINE */}
            {linePath && (
              <LineItem
                path={linePath}
                color="#2563eb"
                strokeWidth={3}
                opacity={1}
              />
            )}

            {/* POINTS (WITH FIXED TOOLTIP) */}
            {processedData.map((d, i) => {
              const x = xScale(d.year);
              const y = yScale(d.value);

              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#2563eb"
                  stroke="#fff"
                  strokeWidth={2}
                  onMouseEnter={(e) => {
                    const rect = (e.target as SVGCircleElement).getBoundingClientRect();
                    setTooltip({
                      x: rect.left,
                      y: rect.top,
                      year: d.year,
                      value: d.value,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}

            {/* ===================== */}
            {/* AXIS LABELS (ADDED ONLY) */}
            {/* ===================== */}

            {/* X Axis Label */}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 55}
              textAnchor="middle"
              fontSize={12}
              fill="#64748b"
            >
              {xAxisLabel}
            </text>

            {/* Y Axis Label */}
            <text
              x={-boundsHeight / 2}
              y={-55}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize={12}
              fill="#64748b"
            >
              {yAxisLabel || `${chartLabel} (${unit})`}
            </text>

            {/* X ticks (UNCHANGED) */}
            {processedData.map((d, i) => (
              <text
                key={i}
                x={xScale(d.year)}
                y={boundsHeight + 20}
                fontSize={10}
                textAnchor="middle"
                fill="#94a3b8"
              >
                {d.year}
              </text>
            ))}

          </g>
        </svg>
      </div>

      {/* ===================== */}
      {/* FOOTER (UNCHANGED) */}
      {/* ===================== */}
      <div className="mt-4 text-sm text-slate-600 text-center max-w-2xl mx-auto">
        This chart isolates long-term {chartLabel.toLowerCase()} anomalies
        in {selectedCountry}, showing whether a consistent climate signal is emerging.
      </div>
    </div>
  );
};
