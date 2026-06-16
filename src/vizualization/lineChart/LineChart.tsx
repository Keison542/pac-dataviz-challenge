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

  // Safety check for data
  const safeData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return data.filter(d => d && typeof d.year === 'number' && typeof d.value === 'number' && !isNaN(d.value));
  }, [data]);

  const hasData = safeData.length > 0;

  // Process climate driver data
  const processedData = useMemo(() => {
    if (!hasData) return [];
    return [...safeData]
      .sort((a, b) => a.year - b.year);
  }, [safeData, hasData]);

  // Calculate statistics
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

  // Generate x-axis ticks
  const xAxisTicks = useMemo(() => {
    if (processedData.length === 0) return [];
    const yearsArray = processedData.map(d => d.year);
    const maxTicks = Math.max(5, Math.min(8, Math.floor(boundsWidth / 70)));
    const step = Math.ceil(yearsArray.length / maxTicks);
    return yearsArray.filter((_, i) => i % step === 0);
  }, [processedData, boundsWidth]);

  // Generate y-axis ticks - CLEANER with fewer ticks
  const yAxisTicks = useMemo(() => {
    if (processedData.length === 0) return [0, 0.25, 0.5, 0.75, 1];
    
    const values = processedData.map(d => d.value);
    const minVal = Math.min(0, ...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal;
    
    // Aim for 4-6 ticks total
    let targetTicks = 5;
    const roughStep = range / (targetTicks - 1);
    
    // Round the step to a nice number
    let step;
    if (dataType === "seaLevelAnomaly") {
      // Sea level: round to 0.01 or 0.005
      const stepSize = Math.pow(10, Math.floor(Math.log10(roughStep)));
      step = Math.max(stepSize, 0.01);
      if (roughStep / step > 2.5) step *= 2;
    } else if (dataType === "surfaceTempAnomaly" || dataType === "seaSurfaceTempAnomaly") {
      // Temperature: round to 0.2 or 0.5
      step = Math.max(Math.round(roughStep / 0.2) * 0.2, 0.2);
    } else {
      // Rainfall: round to 10 or 20
      const stepSize = Math.pow(10, Math.floor(Math.log10(roughStep)));
      step = Math.max(stepSize, 10);
    }
    
    // Generate ticks from min to max
    const ticks: number[] = [];
    let start = Math.floor(minVal / step) * step;
    // Ensure we don't have too many ticks
    let count = 0;
    while (start <= maxVal + step && count < 8) {
      const tickValue = Number(start.toFixed(4));
      if (tickValue >= minVal - step/2 && tickValue <= maxVal + step/2) {
        ticks.push(tickValue);
      }
      start += step;
      count++;
    }
    
    // If no ticks, provide defaults
    if (ticks.length < 2) {
      return [minVal, maxVal];
    }
    
    return ticks;
  }, [processedData, dataType]);

  // Scales - FIXED y-scale with cleaner domain
  const yScale = useMemo(() => {
    if (processedData.length === 0) {
      return scaleLinear().domain([0, 1]).range([boundsHeight, 0]);
    }
    const values = processedData.map(d => d.value);
    const minValueAll = Math.min(0, ...values);
    const maxValueAll = Math.max(...values);
    
    // Add small padding (5%)
    const range = maxValueAll - minValueAll;
    const padding = Math.max(range * 0.05, 0.01);
    
    const domainMin = minValueAll - padding;
    const domainMax = maxValueAll + padding;
    
    return scaleLinear()
      .domain([domainMin, domainMax])
      .range([boundsHeight, 0]);
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

  // Color functions
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

  // Format value with appropriate decimal places
  const formatValue = (value: number) => {
    if (dataType === "seaLevelAnomaly") {
      return `${value.toFixed(2)}${unit}`;
    }
    return `${value.toFixed(2)}${unit}`;
  };

  // Format tick value
  const formatTickValue = (value: number) => {
    if (dataType === "seaLevelAnomaly") {
      return value.toFixed(2);
    }
    return value.toFixed(1);
  };

  // Line builder
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

  // Conditional returns (after all hooks)
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
          <div className="text-4xl mb-3 opacity-30"></div>
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
          <p className="text-sm text-slate-700 leading-relaxed">
            For {selectedCountry}, {chartLabel.toLowerCase()} has shown a{' '}
            
              {stats.trendDirection} trend of {Math.abs(stats.percentChange).toFixed(1)}%
             over the recorded period ({stats.minDataYear} - {stats.maxDataYear}). 
            The highest value was {stats.maxValue.toFixed(2)}{unit} recorded in {stats.maxYear},
            while the lowest was {stats.minValue.toFixed(2)}{unit} in {stats.minYear}.
          </p>
        
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

            {/* Data points - NO LABELS SHOWN, only circles */}
            {processedData.map((d, i) => {
              const x = xScale(d.year);
              const y = yScale(d.value);
              const isHovered = tooltipData?.year === d.year;
              const isMax = d.value === stats.maxValue && stats.maxValue !== 0;
              const isMin = d.value === stats.minValue && stats.minValue !== 0;
              const pointRadius = isHovered ? 10 : (isMax || isMin ? 7 : 5);
              const pointColor = isMax ? "#f59e0b" : isMin ? "#3b82f6" : lineColor;

              return (
                <g 
                  key={i}
                  onMouseEnter={(e) => handleMouseEnter(e, d, x, y)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer ring for hover effect */}
                  {isHovered && !isLineHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={pointRadius + 4}
                      fill="none"
                      stroke={pointColor}
                      strokeWidth="2"
                      opacity="0.3"
                    />
                  )}
                  
                  {/* Main circle - slightly larger for max/min points but NO LABELS */}
                  <circle
                    cx={x}
                    cy={y}
                    r={pointRadius}
                    fill={pointColor}
                    stroke="#fff"
                    strokeWidth={2.5}
                    opacity={isLineHovered && !isHovered ? 0.4 : 1}
                  />
                  
                  {/* NO TEXT LABELS - Values only shown in tooltip on hover */}
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
                  {formatTickValue(v)}{unit}
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

        {/* Tooltip - ONLY shows on hover */}
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
        )}
      </div>
    </div>
  );
};
