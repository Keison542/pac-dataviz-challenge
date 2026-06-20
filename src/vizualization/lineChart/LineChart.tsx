"use client";

import { scaleLinear } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { LineItem } from "./LineItem";

const MARGIN = { top: 40, right: 40, bottom: 60, left: 60 };

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
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    year: number;
    value: number;
  } | null>(null);

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  const boundsWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const boundsHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(
      (d) => d && typeof d.year === "number" && typeof d.value === "number"
    );
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
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.1 || 0.1;
    return scaleLinear()
      .domain([minVal - padding, maxVal + padding])
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

  const linePath = lineBuilder(processedData);

  const chartLabel = getChartLabel(dataType);
  const unit = getUnit(dataType);

  // ─── Generate x-axis ticks ───
  const xAxisTicks = useMemo(() => {
    if (processedData.length === 0) return [];
    const years = processedData.map(d => d.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const range = maxYear - minYear;

    const targetTicks = Math.min(8, Math.max(5, Math.floor(boundsWidth / 70)));
    const step = Math.max(1, Math.ceil(range / (targetTicks - 1)));

    const niceSteps = [1, 2, 5, 10, 20, 50, 100];
    const niceStep = niceSteps.find(s => s >= step) || step;

    const ticks: number[] = [];
    let start = Math.floor(minYear / niceStep) * niceStep;
    while (start <= maxYear) {
      if (start >= minYear && start <= maxYear) {
        ticks.push(start);
      }
      start += niceStep;
    }
    return ticks;
  }, [processedData, boundsWidth]);

  // ─── Tooltip handlers ───
  const handleMouseEnter = useCallback((event: React.MouseEvent, d: ClimateDataPoint) => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    setTooltip({
      x: mouseX + 15,
      y: mouseY - 10,
      year: d.year,
      value: d.value,
    });
    setHoveredPoint(d.year);
  }, []);

  const handleMouseLeave = useCallback(() => {
    tooltipTimerRef.current = setTimeout(() => {
      setTooltip(null);
      setHoveredPoint(null);
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  if (!processedData.length) return null;

  return (
    <div className="w-full relative">
      {/* ─── TOOLTIP ─── */}
      {tooltip && (
        <div
          className="fixed z-50 bg-white border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(0, 0)",
          }}
        >
          <div className="font-medium">{tooltip.year}</div>
          <div>{tooltip.value.toFixed(2)} {unit}</div>
        </div>
      )}

      {/* ─── CHART ─── */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="overflow-visible"
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* ─── SUBTLE GRIDLINES ─── */}
            {yScale.ticks(5).map((value) => (
              <line
                key={value}
                x1={0}
                x2={boundsWidth}
                y1={yScale(value)}
                y2={yScale(value)}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            ))}

            {/* ─── LINE ─── */}
            {linePath && (
              <LineItem
                path={linePath}
                color="#2563eb"
                strokeWidth={2}
                opacity={1}
              />
            )}

            {/* ─── POINTS WITH INTERACTION ─── */}
            {processedData.map((d, i) => {
              const x = xScale(d.year);
              const y = yScale(d.value);
              const isHovered = hoveredPoint === d.year;
              const pointRadius = isHovered ? 5 : 3;

              return (
                <g
                  key={i}
                  onMouseEnter={(e) => handleMouseEnter(e, d)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: "pointer" }}
                >
                  {/* Main circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={pointRadius}
                    fill="#2563eb"
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}

            {/* ─── X AXIS TICKS ─── */}
            {xAxisTicks.map((year) => {
              const x = xScale(year);
              const isHighlighted = processedData.some(d => d.year === year);
              return (
                <g key={year}>
                  <line
                    x1={x}
                    y1={boundsHeight}
                    x2={x}
                    y2={boundsHeight + 5}
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={boundsHeight + 18}
                    fontSize={10}
                    textAnchor="middle"
                    fill={isHighlighted ? "#475569" : "#94a3b8"}
                  >
                    {year}
                  </text>
                </g>
              );
            })}

            {/* ─── Y AXIS TICKS ─── */}
            {yScale.ticks(5).map((value) => {
              const y = yScale(value);
              return (
                <g key={value}>
                  <line
                    x1={-5}
                    y1={y}
                    x2={0}
                    y2={y}
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <text
                    x={-8}
                    y={y + 4}
                    fontSize={10}
                    textAnchor="end"
                    fill="#94a3b8"
                  >
                    {value.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* ─── AXIS LABELS ─── */}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 45}
              textAnchor="middle"
              fontSize={11}
              fill="#94a3b8"
            >
              {xAxisLabel}
            </text>

            <text
              x={-boundsHeight / 2}
              y={-48}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize={11}
              fill="#94a3b8"
            >
              {yAxisLabel || `${chartLabel} (${unit})`}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
