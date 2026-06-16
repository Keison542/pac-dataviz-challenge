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
  selectedCountry = "Selected Country",
  xAxisLabel = "Year",
  yAxisLabel,
  title,
}: LineChartProps) => {
  const [isClient, setIsClient] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const boundsWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const boundsHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; year: number; value: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isLineHovered, setIsLineHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ALL HOOKS MUST BE CALLED IN THE SAME ORDER EVERY TIME
  // Move all useMemo BEFORE any conditional returns

  // Safety check for data - ALWAYS define this useMemo
  const safeData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data.filter(d => d && typeof d.year === 'number' && typeof d.value === 'number' && !isNaN(d.value));
  }, [data]);

  const hasData = safeData.length > 0;

  // Process climate driver data - ALWAYS defined
  const processedData = useMemo(() => {
    if (!hasData) return [];
    return [...safeData]
      .sort((a, b) => a.year - b.year);
  }, [safeData, hasData]);

  // Calculate statistics - ALWAYS defined
  const stats = useMemo(() => {
    if (processedData.length === 0) {
      return {
        percentChange: 0,
        trendDirection: "stable" as const,
        maxValue: 0,
        maxYear: null,
        minValue: 0,
        minYear: null,
        averageValue: 0,
        minDataYear: null,
        maxDataYear: null,
      };
    }

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
    const minDataYear = Math.min(...processedData.map(d => d.year));
    const maxDataYear = Math.max(...processedData.map(d => d.year));

    return {
      percentChange,
      trendDirection,
      maxValue,
      maxYear,
      minValue,
      minYear,
      averageValue,
      minDataYear,
      maxDataYear,
    };
  }, [processedData]);

  // Generate x-axis ticks - ALWAYS defined
  const xAxisTicks = useMemo(() => {
    if (processedData.length === 0) return [];
    const yearsArray = processedData.map(d => d.year);
    const maxTicks = Math.max(5, Math.min(10, Math.floor(boundsWidth / 70)));
    const step = Math.ceil(yearsArray.length / maxTicks);
    return yearsArray.filter((_, i) => i % step === 0);
  }, [processedData, boundsWidth]);

  // Generate y-axis ticks - ALWAYS defined
  const yAxisTicks = useMemo(() => {
    if (processedData.length === 0) return [0, 0.25, 0.5, 0.75, 1];
    const maxValueY = Math.max(...processedData.map(d => Math.abs(d.value)), 1);
    const ticks: number[] = [];
    const step = maxValueY / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(i * step);
    }
    return ticks;
  }, [processedData]);

  // Scales - ALWAYS defined (with fallback domains)
  const yScale = useMemo(() => {
    if (processedData.length === 0) {
      return scaleLinear().domain([0, 1]).range([boundsHeight, 0]);
    }
    const values = processedData.map(d => d.value);
    const minValueAll = Math.min(0, ...values);
    const maxValueAll = Math.max(...values);
    const domain = [minValueAll * 0.95, Math.max(maxValueAll * 1.08, 0.01)];
    return scaleLinear().domain(domain).range([boundsHeight, 0]);
  }, [processedData, boundsHeight]);

  const xScale = useMemo(() => {
    if (processedData.length === 0) {
      return scaleLinear().domain([2000, 2020]).range([0, boundsWidth]);
    }
    const years = processedData.map(d => d.year);
    const minDataYear = Math.min(...years);
    const maxDataYear = Math.max(...years);
    const domain = [minDataYear, Math.max(maxDataYear, minDataYear + 1)];
    return scaleLinear().domain(domain).range([0, boundsWidth]);
  }, [processedData, boundsWidth]);

  // Color functions - ALWAYS defined
  const getLineColor = useMemo(() => {
    if (stats.percentChange > 0) return "#e11d48";
    if (stats.percentChange < 0) return "#0891b2";
    return "#06b6d4";
  }, [stats.percentChange]);

  const getGradientStart = useMemo(() => {
    if (stats.percentChange > 0) return "#f43f5e";
    if (stats.percentChange < 0) return "#22d3ee";
    return "#67e8f9";
  }, [stats.percentChange]);

  const getGradientEnd = useMemo(() => {
    if (stats.percentChange > 0) return "#e11d48";
    if (stats.percentChange < 0) return "#0891b2";
    return "#06b6d4";
  }, [stats.percentChange]);

  const lineColor = getLineColor;
  const chartLabel = getChartLabel(dataType);
  const unit = getUnit(dataType);

  // Effects
  useEffect(() => {
    setIsClient(true);
    setIsMounted(true);
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasData) return;
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(timer);
  }, [hasData]);

  // Handlers
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

  const formatValue = (value: number) => {
    return `${value.toFixed(2)}${unit}`;
  };

  // Line builder - ALWAYS defined
  const lineBuilder = useMemo(() => {
    return line<any>()
      .x(d => xScale(d.year))
      .y(d => yScale(d.value))
      .curve(curveMonotoneX);
  }, [xScale, yScale]);

  const areaBuilder = useMemo(() => {
    return area<any>()
      .x(d => xScale(d.year))
      .y0(boundsHeight)
      .y1(d => yScale(d.value))
      .curve(curveMonotoneX);
  }, [xScale, yScale, boundsHeight]);

  // NOW we can have conditional returns (after all hooks)
  if (!isClient || !isMounted) {
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

  if (width <= 0 || height <= 0) {
    return null;
  }

  if (!hasData || processedData.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30">📊</div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Climate Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No {chartLabel.toLowerCase()} data available for {selectedCountry}
          </p>
        </div>
      </div>
    );
  }

  const linePath = lineBuilder(processedData);
  const areaPath = areaBuilder(processedData);

  return (
    <div className="w-full font-sans">
      {/* Stats Cards */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-cyan-50 rounded-lg border border-cyan-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="text-xl font-bold text-cyan-700">{stats.averageValue.toFixed(2)}{unit}</div>
          <div className="text-xs text-slate-500 mt-1">Average</div>
          <div className="text-[10px] text-slate-400">{selectedCountry}</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="text-xl font-bold text-amber-700">{stats.maxValue.toFixed(2)}{unit}</div>
          <div className="text-xs text-slate-500 mt-1">Peak Year</div>
          <div className="text-[11px] text-amber-600 font-medium">{stats.maxYear || '—'}</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className="text-xl font-bold text-blue-700">{stats.minValue.toFixed(2)}{unit}</div>
          <div className="text-xs text-slate-500 mt-1">Lowest Year</div>
          <div className="text-[11px] text-blue-600 font-medium">{stats.minYear || '—'}</div>
        </div>
        <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
          <div className={`text-xl font-bold ${stats.percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.percentChange > 0 ? `+${stats.percentChange.toFixed(1)}%` : `${stats.percentChange.toFixed(1)}%`}
          </div>
          <div className="text-xs text-slate-500 mt-1">Overall Trend</div>
          <div className="text-[11px] text-slate-400">{stats.minDataYear} → {stats.maxDataYear}</div>
        </div>
      </div>

      {/* Insight Text */}
      {stats.minDataYear && stats.maxDataYear && (
        <div className="mb-5 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">
            For <span className="font-semibold text-cyan-700">{selectedCountry}</span>, {chartLabel.toLowerCase()} has shown a{' '}
            <span className={`font-semibold ${stats.percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.trendDirection} trend of {Math.abs(stats.percentChange).toFixed(1)}%
            </span> over the recorded period ({stats.minDataYear} - {stats.maxDataYear}). 
            The highest value was <span className="font-semibold text-amber-600">{stats.maxValue.toFixed(2)}{unit}</span> recorded in {stats.maxYear},
            while the lowest was <span className="font-semibold text-blue-600">{stats.minValue.toFixed(2)}{unit}</span> in {stats.minYear}.
          </p>
        </div>
      )}

      {/* Chart */}
      <div className="relative">
        <svg 
          width={width} 
          height={height} 
          className="overflow-visible"
          style={{ cursor: isLineHovered ? 'pointer' : 'default' }}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={getGradientStart} stopOpacity="0.25" />
              <stop offset="100%" stopColor={getGradientEnd} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={getGradientStart} />
              <stop offset="100%" stopColor={getGradientEnd} />
            </linearGradient>
          </defs>

          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Grid lines */}
            {yAxisTicks.map((v, i) => (
              <line
                key={`grid-y-${i}`}
                x1={0}
                x2={boundsWidth}
                y1={yScale(v)}
                y2={yScale(v)}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {xAxisTicks.map((year, i) => (
              <line
                key={`grid-x-${i}`}
                x1={xScale(year)}
                x2={xScale(year)}
                y1={0}
                y2={boundsHeight}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Zero line */}
            <line
              x1={0}
              x2={boundsWidth}
              y1={yScale(0)}
              y2={yScale(0)}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />

            {/* Area under curve */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#areaGradient)"
                opacity={animate ? 1 : 0}
                style={{ transition: "opacity 1s ease-out" }}
              />
            )}

            {/* Main line */}
            {linePath && (
              <LineItem
                path={linePath}
                color="url(#lineGradient)"
                strokeWidth={3.5}
                opacity={animate ? 1 : 0}
                onHover={handleLineHover}
              />
            )}

            {/* Data points */}
            {processedData.map((d, i) => {
              const x = xScale(d.year);
              const y = yScale(d.value);
              const isHovered = tooltipData?.year === d.year;
              const isMax = d.value === stats.maxValue && stats.maxValue !== 0;
              const isMin = d.value === stats.minValue && stats.minValue !== 0;
              const pointRadius = isHovered ? 10 : (isMax || isMin ? 9 : 5);
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
                      r={pointRadius + 3}
                      fill="none"
                      stroke={pointColor}
                      strokeWidth="1.5"
                      opacity="0.3"
                    />
                  )}
                  
                  <circle
                    cx={x}
                    cy={y}
                    r={pointRadius}
                    fill={pointColor}
                    stroke="#fff"
                    strokeWidth={2.5}
                  />
                  
                  {showLabel && (
                    <text
                      x={x}
                      y={y - (isMax ? 22 : 15)}
                      textAnchor="middle"
                      fontSize={isMax ? "11" : "10"}
                      fill={pointColor}
                      fontWeight={isMax ? "800" : "600"}
                      pointerEvents="none"
                    >
                      {formatValue(d.value)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* X Axis Labels */}
            {xAxisTicks.map((year, i) => (
              <g key={`x-axis-${i}`}>
                <line
                  x1={xScale(year)}
                  y1={boundsHeight}
                  x2={xScale(year)}
                  y2={boundsHeight + 5}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={xScale(year)}
                  y={boundsHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#475569"
                  className="select-none"
                >
                  {year}
                </text>
              </g>
            ))}

            {/* Y Axis Labels */}
            {yAxisTicks.map((v, i) => (
              <g key={`y-axis-${i}`}>
                <line
                  x1={-5}
                  y1={yScale(v)}
                  x2={0}
                  y2={yScale(v)}
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text
                  x={-12}
                  y={yScale(v) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#475569"
                  fontWeight="500"
                  className="select-none"
                >
                  {formatValue(v)}
                </text>
              </g>
            ))}

            {/* Axis Titles */}
            <text 
              x={boundsWidth / 2} 
              y={boundsHeight + 48} 
              textAnchor="middle" 
              fontSize="12" 
              fill="#64748b" 
              fontWeight="500"
            >
              {xAxisLabel}
            </text>
            
            <text 
              transform={`rotate(-90) translate(${-boundsHeight / 2}, -70)`}
              textAnchor="middle" 
              fontSize="12" 
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
              padding: '10px 14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 99999,
              pointerEvents: 'none',
              minWidth: '160px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: lineColor }}></div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                {selectedCountry} • {tooltipData.year}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {formatValue(tooltipData.value)}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
              {chartLabel.toLowerCase()} anomaly
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
