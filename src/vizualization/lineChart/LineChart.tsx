"use client";

import { DisasterLossRecord } from "@/climatedata/economic_consequence/direct_disaster_economic_loss";
import { AffectedPeopleRecord } from "@/climatedata/human_consequence/number_of_persons_affected";
import { scaleLinear } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { LineItem } from "./LineItem";
import { InteractionData } from "./types/interaction";

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
  valueFormatter,
}: LineChartProps) => {
  const [isClient, setIsClient] = useState(false);
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; year: number; value: number; category: string } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isLineHovered, setIsLineHovered] = useState(false);
  const [animate, setAnimate] = useState(false);
  
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

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
      category: d.category,
    });
    
    if (setHoveredDataPoint) {
      setHoveredDataPoint({
        x: mouseX,
        y: mouseY,
        label: `${selectedCountry || "Unknown"} • ${d.year}`,
        value: d.value,
      });
    }
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setTooltipData(null);
      if (setHoveredDataPoint) {
        setHoveredDataPoint(null);
      }
    }, 100);
  };

  const handleLineHover = (hovered: boolean) => {
    if (hovered) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      setIsLineHovered(true);
      setTooltipData(null);
      if (setHoveredDataPoint) {
        setHoveredDataPoint(null);
      }
    } else {
      setIsLineHovered(false);
    }
  };

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
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No data available for {selectedCountry || "the selected country"}
          </p>
        </div>
      </div>
    );
  }

  // Get the label for the chart based on dataType
  const getChartLabel = () => {
    switch (dataType) {
      case "surfaceTempAnomaly": return "surface temperature";
      case "seaSurfaceTempAnomaly": return "sea surface temperature";
      case "precipitationAnomaly": return "rainfall";
      case "seaLevelAnomaly": return "sea level";
      case "greenhouseGasEmission": return "greenhouse gas emissions";
      case "cropYield": return "crop yield";
      case "livestockYield": return "livestock yield";
      case "tourismArrivals": return "tourist arrivals";
      default: return "this indicator";
    }
  };

  return (
    <div className="w-full">
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg" style={{ backgroundColor: percentChange > 0 ? '#fef2f2' : '#ecfeff' }}>
          <div className="text-lg font-bold" style={{ color: lineColor }}>
            {percentChange > 0 ? `+${percentChange.toFixed(1)}%` : `${percentChange.toFixed(1)}%`}
          </div>
          <div className="text-xs text-slate-500">overall change</div>
          <div className="text-[10px] text-slate-400">{trendDirection} trend</div>
          {selectedCountry && <div className="text-[9px] text-slate-400 mt-1">{selectedCountry}</div>}
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

      {/* Insight Text - NOW WITH COUNTRY NAME MENTIONED like Bubble Chart */}
      <div className="mb-5 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          {selectedCountry ? (
            <>
              For <span className="font-semibold" style={{ color: lineColor }}>{selectedCountry}</span>, {getChartLabel()} has shown a{' '}
              <span className={`font-semibold ${percentChange > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {trendDirection} trend of {Math.abs(percentChange).toFixed(1)}%
              </span> over the recorded period. 
              The highest value was recorded in <span className="font-semibold text-amber-600">{maxYear}</span> 
              (<span className="font-semibold text-amber-600">{valueFormatter ? valueFormatter(maxValue) : formatNumber(maxValue)}</span>),
              while the lowest was in <span className="font-semibold text-blue-600">{minYear}</span>
              (<span className="font-semibold text-blue-600">{valueFormatter ? valueFormatter(minValue) : formatNumber(minValue)}</span>).
            </>
          ) : (
            <>
              Over the recorded period, {getChartLabel()} has shown a {trendDirection} trend of {Math.abs(percentChange).toFixed(1)}%. 
              The highest value was recorded in {maxYear} 
              ({valueFormatter ? valueFormatter(maxValue) : formatNumber(maxValue)}),
              while the lowest was in {minYear}
              ({valueFormatter ? valueFormatter(minValue) : formatNumber(minValue)}).
            </>
          )}
        </p>
      </div>
      
      <div className="relative" style={{ width, height }}>
        <svg 
          ref={svgRef}
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

            <line
              x1={0} x2={boundsWidth}
              y1={yScale(0)} y2={yScale(0)}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />

            {isClimateData && (
              <path
                d={areaBuilder(processedData) || ""}
                fill="url(#areaGradient)"
                opacity={animate ? 1 : 0}
                style={{ transition: "opacity 1s ease-out" }}
              />
            )}

            <LineItem
              path={lineBuilder(processedData) || ""}
              color="url(#lineGradient)"
              strokeWidth={isClimateData ? 3.5 : 3}
              opacity={animate ? 1 : 0}
              onHover={handleLineHover}
            />

            {processedData.map((d, i) => {
              const x = xScale(d.year);
              const y = yScale(d.value);
              const isHovered = tooltipData?.year === d.year;
              const isMax = d.value === maxValue;
              const isMin = d.value === minValue;
              const pointRadius = isHovered ? 8 : (isMax || isMin ? 6 : 4.5);
              const pointColor = isMax ? "#f59e0b" : isMin ? "#3b82f6" : lineColor;

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
                  
                  {(isMax || isMin || i === 0 || i === processedData.length - 1) && !isHovered && (
                    <text
                      x={x}
                      y={y - (isMax ? 14 : 10)}
                      textAnchor="middle"
                      fontSize="9"
                      fill={isMax ? "#f59e0b" : "#64748b"}
                      fontWeight={isMax ? "bold" : "normal"}
                      pointerEvents="none"
                    >
                      {valueFormatter ? valueFormatter(d.value) : formatNumber(d.value)}
                    </text>
                  )}
                </g>
              );
            })}

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
                {selectedCountry || "Selected"} • {tooltipData.year}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {valueFormatter ? valueFormatter(tooltipData.value) : formatNumber(tooltipData.value)}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
              {isClimateData ? "anomaly value" : "value"}
            </div>
            {tooltipData.category !== "Value" && (
              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '6px', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                {tooltipData.category}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
