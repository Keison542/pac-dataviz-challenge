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

// Climate driver data point
type ClimateDataPoint = {
  year: number;
  value: number;
};

type LineChartProps = {
  width: number;
  height: number;
  data: ClimateDataPoint[];
  dataType: ClimateDriverType;
  selectedCountry: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
};

const formatYAxisTick = (value: number, dataType: ClimateDriverType): string => {
  switch (dataType) {
    case "surfaceTempAnomaly":
    case "seaSurfaceTempAnomaly":
      return `${value.toFixed(1)}°C`;
    case "precipitationAnomaly":
      return `${value.toFixed(0)}mm`;
    case "seaLevelAnomaly":
      return `${value.toFixed(2)}m`;
    default:
      return value.toLocaleString();
  }
};

const getChartLabel = (dataType: ClimateDriverType): string => {
  switch (dataType) {
    case "surfaceTempAnomaly": return "Surface Temperature";
    case "seaSurfaceTempAnomaly": return "Sea Surface Temperature";
    case "precipitationAnomaly": return "Rainfall";
    case "seaLevelAnomaly": return "Sea Level";
    default: return "Value";
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
  selectedCountry,
  xAxisLabel = "Year",
  yAxisLabel,
  title,
}: LineChartProps) => {
  const [isClient, setIsClient] = useState(false);
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; year: number; value: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isLineHovered, setIsLineHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasData = data && data.length > 0;

  // Process climate driver data
  const processedData = useMemo(() => {
    if (!hasData) return [];
    return data
      .map(d => ({
        year: d.year ?? 0,
        value: d.value ?? 0,
      }))
      .filter(d => d.year > 0 && d.value !== null && !isNaN(d.value))
      .sort((a, b) => a.year - b.year);
  }, [data, hasData]);

  // Calculate statistics for the selected country's climate driver
  const firstValue = processedData[0]?.value;
  const lastValue = processedData[processedData.length - 1]?.value;
  const percentChange = firstValue && lastValue && firstValue !== 0 
    ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 
    : 0;
  const trendDirection = percentChange > 0 ? "increasing" : percentChange < 0 ? "decreasing" : "stable";
  const maxValue = Math.max(...processedData.map(d => d.value), 0);
  const maxYear = processedData.find(d => d.value === maxValue)?.year;
  const minValue = Math.min(...processedData.map(d => d.value), 0);
  const minYear = processedData.find(d => d.value === minValue)?.year;
  const averageValue = processedData.reduce((sum, d) => sum + d.value, 0) / processedData.length;

  useEffect(() => {
    if (!hasData) return;
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(timer);
  }, [data, hasData]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  if (!isClient) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="animate-pulse">Loading chart...</div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30">📊</div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Climate Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No {getChartLabel(dataType).toLowerCase()} data available for {selectedCountry}
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

  const handleMouseEnter = (event: React.MouseEvent, d: any, svgX: number, svgY: number) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    setTooltipPosition({ x: mouseX + 15, y: mouseY - 40 });
    setTooltipData({
      x: svgX,
      y: svgY,
      year: d.year,
      value: d.value,
    });
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setTooltipData(null);
    }, 100);
  };

  const handleLineHover = (hovered: boolean) => {
    if (hovered) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      setIsLineHovered(true);
      setTooltipData(null);
    } else {
      setIsLineHovered(false);
    }
  };

  const formatTooltipValue = (value: number) => {
    return `${value.toFixed(2)}${getUnit(dataType)}`;
  };

  const formatYValue = (value: number) => {
    return `${value.toFixed(2)}${getUnit(dataType)}`;
  };

  const chartLabel = getChartLabel(dataType);
  const unit = getUnit(dataType);

  return (
    <div className="w-full">
      {/* Stats Cards for the selected country */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-cyan-50 rounded-lg">
          <div className="text-sm font-bold text-cyan-700">{averageValue.toFixed(2)}{unit}</div>
          <div className="text-[10px] text-slate-500">Average</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-sm font-bold text-amber-700">{maxValue.toFixed(2)}{unit}</div>
          <div className="text-[10px] text-slate-500">Peak ({maxYear})</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-sm font-bold text-blue-700">{minValue.toFixed(2)}{unit}</div>
          <div className="text-[10px] text-slate-500">Lowest ({minYear})</div>
        </div>
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <div className={`text-sm font-bold ${percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {percentChange > 0 ? `+${percentChange.toFixed(1)}%` : `${percentChange.toFixed(1)}%`}
          </div>
          <div className="text-[10px] text-slate-500">Overall Change</div>
        </div>
      </div>

      {/* Insight Text with selected country */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
        <p className="text-xs text-slate-700 leading-relaxed">
          For <span className="font-semibold text-cyan-700">{selectedCountry}</span>, {chartLabel.toLowerCase()} has shown a{' '}
          <span className={`font-semibold ${percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {trendDirection} trend of {Math.abs(percentChange).toFixed(1)}%
          </span> over the recorded period ({minDataYear} - {maxDataYear}). 
          The highest value was <span className="font-semibold text-amber-600">{maxValue.toFixed(2)}{unit}</span> recorded in {maxYear},
          while the lowest was <span className="font-semibold text-blue-600">{minValue.toFixed(2)}{unit}</span> in {minYear}.
        </p>
      </div>

      {/* Chart */}
      <div className="relative" style={{ width, height }}>
        <svg 
          width={width} 
          height={height} 
          className="overflow-visible"
          style={{ cursor: isLineHovered ? 'pointer' : 'default' }}
        >
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
            {/* Grid lines */}
            {xScale.ticks(6).map((v, i) => (
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
            {yScale.ticks(5).map((v, i) => (
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

            {/* Area under curve */}
            <path
              d={areaBuilder(processedData) || ""}
              fill="url(#areaGradient)"
              opacity={animate ? 1 : 0}
              style={{ transition: "opacity 1s ease-out" }}
            />

            {/* Main line */}
            <LineItem
              path={lineBuilder(processedData) || ""}
              color="url(#lineGradient)"
              strokeWidth={3}
              opacity={animate ? 1 : 0}
              onHover={handleLineHover}
            />

            {/* Data points */}
            {processedData.map((d, i) => {
              const x = xScale(d.year);
              const y = yScale(d.value);
              const isHovered = tooltipData?.year === d.year;
              const isMax = d.value === maxValue && maxValue !== 0;
              const isMin = d.value === minValue && minValue !== 0;
              const pointRadius = isHovered ? 8 : (isMax || isMin ? 6 : 4);
              const pointColor = isMax ? "#f59e0b" : isMin ? "#3b82f6" : lineColor;

              const showLabel = (isMax || isMin || i === 0 || i === processedData.length - 1) && !isHovered;

              return (
                <g 
                  key={i}
                  onMouseEnter={(e) => handleMouseEnter(e, d, x, y)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: 'pointer' }}
                >
                  {isHovered && !isLineHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={pointRadius + 6}
                      fill={pointColor}
                      opacity="0.2"
                      pointerEvents="none"
                    />
                  )}
                  
                  <circle
                    cx={x}
                    cy={y}
                    r={pointRadius}
                    fill={pointColor}
                    stroke="white"
                    strokeWidth="2"
                    opacity={isLineHovered && !isHovered ? 0.4 : 1}
                  />
                  
                  {showLabel && (
                    <text
                      x={x}
                      y={y - (isMax ? 14 : 10)}
                      textAnchor="middle"
                      fontSize="9"
                      fill={isMax ? "#f59e0b" : "#64748b"}
                      fontWeight={isMax ? "bold" : "normal"}
                      pointerEvents="none"
                    >
                      {formatYValue(d.value)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* X Axis Labels */}
            {xScale.ticks(6).map((v, i) => (
              <text
                key={`x-${i}`}
                x={xScale(v)}
                y={boundsHeight + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {v}
              </text>
            ))}

            {/* Y Axis Labels */}
            {yScale.ticks(5).map((v, i) => (
              <text
                key={`y-${i}`}
                x={-8}
                y={yScale(v) + 4}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
              >
                {formatYValue(v)}
              </text>
            ))}

            {/* Axis Titles */}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 42}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              fontWeight="500"
            >
              {xAxisLabel}
            </text>

            <text
              transform={`rotate(-90) translate(${-boundsHeight / 2}, -55)`}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
              fontWeight="500"
            >
              {yAxisLabel || `${chartLabel} Anomaly`}
            </text>
          </g>
        </svg>

        {/* Tooltip */}
        {tooltipData && !isLineHovered && (
          <div
            style={{
              position: 'fixed',
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 99999,
              pointerEvents: 'none',
              minWidth: '140px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: lineColor }}></div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#334155' }}>
                {selectedCountry} • {tooltipData.year}
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              {formatTooltipValue(tooltipData.value)}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
              {chartLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
