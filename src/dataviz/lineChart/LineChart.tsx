"use client";

import { DisasterLossRecord } from "@/data/economic_consequence/direct_disaster_economic_loss";
import { AffectedPeopleRecord } from "@/data/human_consequence/number_of_persons_affected";
import { sexColorScale, climateColorScale } from "@/lib/utils";
import { scaleLinear } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { CircleItem } from "./CircleItem";
import { LineItem } from "./LineItem";
import { InteractionData } from "./types/interaction";
import { AXIS_COLOR, AXIS_FONT_SIZE } from "../constant";

const MARGIN = { top: 50, right: 40, bottom: 70, left: 75 };

export type LineChartDataType = 
  | "employmentRate"
  | "surfaceTempAnomaly"
  | "seaSurfaceTempAnomaly"
  | "precipitationAnomaly"
  | "seaLevelAnomaly"
  | "greenhouseGasEmission"
  | "cropYield"
  | "livestockYield"
  | "powerGeneration"
  | "tourismArrivals"
  | "meteorologicalMonitoringNetwork"
  | "fisheriesManagement"
  | "environmentalTaxes"
  | "alteredLandCover";

type LineChartProps = {
  width: number;
  height: number;
  data: AffectedPeopleRecord[] | DisasterLossRecord[];
  dataType?: LineChartDataType;
  selectedCountry?: string;
  setHoveredDataPoint?: (interactionData: InteractionData | null) => void;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  insight?: string;
  valueFormatter?: (value: number) => string;
};

const formatYAxisTick = (value: number, dataType: LineChartDataType): string => {
  switch (dataType) {
    case "surfaceTempAnomaly":
    case "seaSurfaceTempAnomaly":
      return `${value.toFixed(1)}°C`;
    case "precipitationAnomaly":
      return `${value.toFixed(0)}mm`;
    case "seaLevelAnomaly":
      return `${value.toFixed(2)}m`;
    case "greenhouseGasEmission":
      return `${(value / 1_000_000).toFixed(1)}M t`;
    default:
      return value.toLocaleString();
  }
};

const formatNumber = (v: number): string => {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
};

export const LineChart = ({
  width,
  height,
  data,
  dataType = "employmentRate",
  selectedCountry,
  setHoveredDataPoint,
  xAxisLabel = "Year",
  yAxisLabel,
  title,
  insight = "This chart shows how climate indicators have evolved over time, revealing trends and anomalies.",
  valueFormatter,
}: LineChartProps) => {
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [isLineHovered, setIsLineHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  
  // Refs for hover management
  const pointHoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lineHoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hasData = data.length > 0;

  const processedData = useMemo(() => {
    if (!hasData) return [];
    return (data as any[])
      .map(d => ({
        year: d.year ?? d.TIME_PERIOD ?? 0,
        value: d.value ?? d.OBS_VALUE ?? 0,
        category: d.Sex || "Value"
      }))
      .sort((a, b) => a.year - b.year);
  }, [data, hasData]);

  // Calculate story insights
  const firstValue = processedData[0]?.value;
  const lastValue = processedData[processedData.length - 1]?.value;
  const percentChange = firstValue && lastValue ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0;
  const trendDirection = percentChange > 0 ? "increasing" : percentChange < 0 ? "decreasing" : "stable";
  const maxValue = Math.max(...processedData.map(d => d.value));
  const maxYear = processedData.find(d => d.value === maxValue)?.year;
  const minValue = Math.min(...processedData.map(d => d.value));
  const minYear = processedData.find(d => d.value === minValue)?.year;

  useEffect(() => {
    if (!hasData) return;
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(timer);
  }, [data, hasData]);

  const isClimateData = !(data.length > 0 && "Sex" in data[0]);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (pointHoverTimerRef.current) {
      clearTimeout(pointHoverTimerRef.current);
      pointHoverTimerRef.current = null;
    }
    if (lineHoverTimerRef.current) {
      clearTimeout(lineHoverTimerRef.current);
      lineHoverTimerRef.current = null;
    }
  }, []);

  // Handle point hover
  const handlePointEnter = useCallback((x: number, y: number, value: number, year: number, category: string) => {
    clearTimers();
    setHoveredPoint({ x, y, value, year, category });
    if (setHoveredDataPoint) {
      setHoveredDataPoint({
        x: x + MARGIN.left,
        y: y + MARGIN.top,
        label: `${selectedCountry ?? "Global"} • ${year}`,
        value,
      });
    }
  }, [setHoveredDataPoint, selectedCountry, clearTimers]);

  const handlePointLeave = useCallback(() => {
    clearTimers();
    pointHoverTimerRef.current = setTimeout(() => {
      setHoveredPoint(null);
      setHoveredDataPoint?.(null);
      pointHoverTimerRef.current = null;
    }, 50);
  }, [setHoveredDataPoint, clearTimers]);

  // Handle line hover
  const handleLineHover = useCallback((hovered: boolean) => {
    clearTimers();
    
    if (hovered) {
      setIsLineHovered(true);
      setHoveredPoint(null);
      setHoveredDataPoint?.(null);
    } else {
      lineHoverTimerRef.current = setTimeout(() => {
        setIsLineHovered(false);
        lineHoverTimerRef.current = null;
      }, 50);
    }
  }, [setHoveredDataPoint, clearTimers]);

  // Empty state
  if (!hasData) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30">📈</div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No data available for the selected country or indicator
          </p>
        </div>
      </div>
    );
  }

  const years = processedData.map(d => d.year);
  const values = processedData.map(d => d.value);

  const minDataYear = Math.min(...years);
  const maxDataYear = Math.max(...years);
  const minValueAll = Math.min(0, ...values);
  const maxValueAll = Math.max(...values);

  const yScale = scaleLinear()
    .domain([minValueAll * 0.95, maxValueAll * 1.08])
    .range([boundsHeight, 0]);

  const xScale = scaleLinear()
    .domain([minDataYear, maxDataYear])
    .range([0, boundsWidth]);

  const lineBuilder = line<any>()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(curveMonotoneX);

  const areaBuilder = area<any>()
    .x(d => xScale(d.year))
    .y0(boundsHeight)
    .y1(d => yScale(d.value))
    .curve(curveMonotoneX);

  // Get color for the line
  const getLineColor = () => {
    if (percentChange > 0) return "#e11d48";
    if (percentChange < 0) return "#0891b2";
    return "#06b6d4";
  };

  const getGradientStart = () => {
    if (percentChange > 0) return "#f43f5e";
    if (percentChange < 0) return "#22d3ee";
    return "#67e8f9";
  };

  const getGradientEnd = () => {
    if (percentChange > 0) return "#e11d48";
    if (percentChange < 0) return "#0891b2";
    return "#06b6d4";
  };

  const lineColor = getLineColor();

  return (
    <div className="w-full">
      {/* Header with Storytelling */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          {title || (isClimateData ? "Climate Indicator Trend" : "Indicator Trend")}
        </h3>
        <div className="p-3 bg-slate-50 rounded-lg border-l-4" style={{ borderLeftColor: lineColor }}>
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      {/* Key Findings Summary Cards */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: percentChange > 0 ? '#fef2f2' : '#ecfeff' }}>
          <div className="text-lg font-bold" style={{ color: lineColor }}>
            {percentChange > 0 ? `+${percentChange.toFixed(1)}%` : `${percentChange.toFixed(1)}%`}
          </div>
          <div className="text-xs text-slate-500">overall change</div>
          <div className="text-[10px] text-slate-400">{trendDirection} trend</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-lg font-bold text-amber-700">
            {maxYear || "—"}
          </div>
          <div className="text-xs text-slate-500">peak year</div>
          <div className="text-[10px] text-slate-400">{valueFormatter ? valueFormatter(maxValue) : formatNumber(maxValue)}</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">
            {minYear || "—"}
          </div>
          <div className="text-xs text-slate-500">lowest year</div>
          <div className="text-[10px] text-slate-400">{valueFormatter ? valueFormatter(minValue) : formatNumber(minValue)}</div>
        </div>
      </div>

      {/* Narrative Paragraph */}
      <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          Over the recorded period, this indicator has shown a 
          <span className={`font-bold ${percentChange > 0 ? 'text-rose-600' : percentChange < 0 ? 'text-cyan-600' : 'text-slate-600'}`}>
            {' '}{trendDirection} trend
          </span> of {Math.abs(percentChange).toFixed(1)}%. 
          The highest value was recorded in <span className="font-bold text-amber-700">{maxYear}</span> 
          ({valueFormatter ? valueFormatter(maxValue) : formatNumber(maxValue)}),
          while the lowest was in <span className="font-bold text-blue-700">{minYear}</span>
          ({valueFormatter ? valueFormatter(minValue) : formatNumber(minValue)}).
        </p>
      </div>

      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={getGradientStart()} stopOpacity="0.25" />
            <stop offset="100%" stopColor={getGradientEnd()} stopOpacity="0.02" />
          </linearGradient>

          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={getGradientStart()} />
            <stop offset="100%" stopColor={getGradientEnd()} />
          </linearGradient>
        </defs>

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid */}
          {xScale.ticks(8).map((v, i) => (
            <line
              key={`x-${i}`}
              x1={xScale(v)} x2={xScale(v)}
              y1={0} y2={boundsHeight}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
          ))}
          {yScale.ticks(6).map((v, i) => (
            <line
              key={`y-${i}`}
              x1="0" x2={boundsWidth}
              y1={yScale(v)} y2={yScale(v)}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
          ))}

          {/* Zero line */}
          <line
            x1={0} x2={boundsWidth}
            y1={yScale(0)} y2={yScale(0)}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Area Fill */}
          {isClimateData && (
            <path
              d={areaBuilder(processedData) || ""}
              fill="url(#areaGradient)"
              opacity={animate ? 1 : 0}
              style={{ transition: "opacity 1s ease-out" }}
            />
          )}

          {/* Main Line using LineItem */}
          <LineItem
            path={lineBuilder(processedData) || ""}
            color="url(#lineGradient)"
            strokeWidth={isClimateData ? 3.5 : 3}
            opacity={animate ? 1 : 0}
            onHover={handleLineHover}
          />

          {/* Data Points */}
          {processedData.map((d, i) => {
            const x = xScale(d.year);
            const y = yScale(d.value);
            const isPointHovered = hoveredPoint?.year === d.year;
            const isMax = d.value === maxValue;
            const isMin = d.value === minValue;

            const showPoint = isClimateData 
              ? (isPointHovered || isMax || isMin || i % 3 === 0 || i === 0 || i === processedData.length - 1)
              : true;

            if (!showPoint) return null;

            return (
              <g key={i}>
                <CircleItem
                  x={x}
                  y={y}
                  r={isPointHovered ? 8 : (isMax || isMin ? 6 : 4.5)}
                  color={isMax ? "#f59e0b" : isMin ? "#3b82f6" : lineColor}
                  opacity={isLineHovered && !isPointHovered ? 0.4 : 1}
                  onMouseEnter={() => handlePointEnter(x, y, d.value, d.year, d.category)}
                  onMouseLeave={handlePointLeave}
                  isSelected={isPointHovered}
                />
                {isPointHovered && !isLineHovered && (
                  <circle
                    cx={x} cy={y}
                    r={12}
                    fill="none"
                    stroke={lineColor}
                    strokeOpacity="0.3"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}

          {/* X Axis Labels */}
          {xScale.ticks(8).map((v, i) => (
            <text
              key={`x-${i}`}
              x={xScale(v)}
              y={boundsHeight + 25}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {v}
            </text>
          ))}

          {/* Y Axis Labels */}
          {yScale.ticks(6).map((v, i) => (
            <text
              key={`y-${i}`}
              x={-10}
              y={yScale(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#64748b"
            >
              {valueFormatter ? valueFormatter(v) : formatYAxisTick(v, dataType)}
            </text>
          ))}

          {/* Axis Titles */}
          <text
            x={boundsWidth / 2}
            y={boundsHeight + 52}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
            fontWeight="500"
          >
            {xAxisLabel}
          </text>

          <text
            transform={`rotate(-90) translate(${-boundsHeight / 2}, -50)`}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
            fontWeight="500"
          >
            {yAxisLabel || (isClimateData ? "Anomaly Value" : "Value")}
          </text>
        </g>
      </svg>

      {/* Tooltip - Only show when line is not hovered */}
      {hoveredPoint && !isLineHovered && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-lg px-4 py-2 rounded-lg z-50"
          style={{
            left: hoveredPoint.x + MARGIN.left + 20,
            top: hoveredPoint.y + MARGIN.top - 40,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lineColor }}></div>
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {hoveredPoint.year}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-800 tabular-nums">
            {valueFormatter ? valueFormatter(hoveredPoint.value) : hoveredPoint.value.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {selectedCountry || "Regional"} • {hoveredPoint.category}
          </div>
        </div>
      )}

      {/* Footer Insight */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          📊 Hover over any point for details · {percentChange > 0 ? '📈 Rising trend detected' : percentChange < 0 ? '📉 Declining trend detected' : '📊 Stable trend detected'} · 
          Peak: {maxYear} ({valueFormatter ? valueFormatter(maxValue) : formatNumber(maxValue)})
        </p>
      </div>
    </div>
  );
};