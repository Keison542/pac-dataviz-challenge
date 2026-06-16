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
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isLineHovered, setIsLineHovered] = useState(false);
  const [animate, setAnimate] = useState(false);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  const linePath = lineBuilder(processedData);
  const areaPath = areaBuilder(processedData);

  const chartLabel = getChartLabel(dataType);
  const unit = getUnit(dataType);

  if (!processedData.length) return null;

  return (
    <div className="w-full">

      {/* ===================== */}
      {/* CLIMATE SIGNAL HEADER */}
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
            </span>
            {" "}({Math.abs(stats.percentChange).toFixed(1)}%)
          </div>
        )}
      </div>

      {/* ===================== */}
      {/* SVG CHART */}
      {/* ===================== */}
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">

          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* Area */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#areaGradient)"
                opacity={animate ? 1 : 0}
              />
            )}

            {/* Line */}
            {linePath && (
              <LineItem
                path={linePath}
                color="#2563eb"
                strokeWidth={3}
                opacity={animate ? 1 : 0}
                onHover={setIsLineHovered}
              />
            )}

            {/* Points */}
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
                />
              );
            })}

            {/* X Axis */}
            {processedData.map((d, i) => (
              <text
                key={i}
                x={xScale(d.year)}
                y={boundsHeight + 20}
                fontSize={10}
                textAnchor="middle"
                fill="#64748b"
              >
                {d.year}
              </text>
            ))}

          </g>
        </svg>
      </div>

      {/* ===================== */}
      {/* INSIGHT FOOTER */}
      {/* ===================== */}
      <div className="mt-4 text-sm text-slate-600 text-center max-w-2xl mx-auto">
        This chart isolates long-term {chartLabel.toLowerCase()} anomalies,
        showing whether a consistent climate signal is emerging in {selectedCountry}.
      </div>
    </div>
  );
};
