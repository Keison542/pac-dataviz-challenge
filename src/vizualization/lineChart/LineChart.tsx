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
            {minYear || "—
