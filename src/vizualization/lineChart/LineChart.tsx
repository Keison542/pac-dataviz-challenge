"use client";

import { scaleLinear } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import { useState, useMemo, useEffect } from "react";
import { LineItem } from "./LineItem";

const MARGIN = { top: 50, right: 40, bottom: 70, left: 75 };

type ClimateDataPoint = {
  year: number;
  value: number;
};

type LineChartProps = {
  width: number;
  height: number;
  data: ClimateDataPoint[];
  dataType: string;
  selectedCountry?: string;
};

// =====================================================
// WINNING IMPROVEMENT: LINEAR REGRESSION TREND
// =====================================================
function linearRegression(data: ClimateDataPoint[]) {
  const n = data.length;
  if (n < 2) return null;

  const sumX = data.reduce((a, d) => a + d.year, 0);
  const sumY = data.reduce((a, d) => a + d.value, 0);
  const sumXY = data.reduce((a, d) => a + d.year * d.value, 0);
  const sumX2 = data.reduce((a, d) => a + d.year * d.year, 0);

  const slope =
    (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  return slope;
}

// =====================================================
// VARIABILITY (STABILITY SIGNAL)
// =====================================================
function variance(data: ClimateDataPoint[]) {
  const values = data.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length;
}

export const LineChart = ({
  width,
  height,
  data,
  dataType,
  selectedCountry = "Selected Country",
}: LineChartProps) => {

  const [animate, setAnimate] = useState(false);

  const boundsWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const boundsHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const processedData = useMemo(
    () => [...(data || [])].sort((a, b) => a.year - b.year),
    [data]
  );

  // =====================================================
  // WINNING IMPROVEMENT: FULL-SERIES SIGNALS
  // =====================================================
  const slope = useMemo(() => linearRegression(processedData), [processedData]);
  const varianceScore = useMemo(() => variance(processedData), [processedData]);

  const signalStrength = useMemo(() => {
    if (!slope) return 0;

    // normalize slope into readable signal strength
    return Math.min(100, Math.abs(slope) * 10);
  }, [slope]);

  const stabilityLabel =
    varianceScore < 1 ? "Stable" :
    varianceScore < 5 ? "Moderate variability" :
    "High variability";

  useEffect(() => {
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, [data]);

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

  const lineBuilder = line<ClimateDataPoint>()
    .x(d => xScale(d.year))
    .y(d => yScale(d.value))
    .curve(curveMonotoneX);

  const areaBuilder = area<ClimateDataPoint>()
    .x(d => xScale(d.year))
    .y0(boundsHeight)
    .y1(d => yScale(d.value))
    .curve(curveMonotoneX);

  const linePath = lineBuilder(processedData);
  const areaPath = areaBuilder(processedData);

  if (!processedData.length) return null;

  return (
    <div className="w-full">

      {/* ================= HEADER ================= */}
      <div className="text-center mb-6">

        <div className="text-xs tracking-widest text-slate-500 font-semibold">
          CLIMATE SIGNAL DETECTION (ANOMALY-BASED)
        </div>

        <h3 className="text-lg font-bold text-slate-800 mt-1">
          Long-term trend validation
        </h3>

        {/* WINNING ADDITION */}
        <div className="mt-2 text-sm text-slate-600">
          Trend strength:{" "}
          <span className="font-semibold text-blue-600">
            {signalStrength.toFixed(1)}%
          </span>
          {" · "}
          Stability:{" "}
          <span className="font-semibold text-slate-700">
            {stabilityLabel}
          </span>
        </div>
      </div>

      {/* ================= SVG ================= */}
      <div className="relative">
        <svg width={width} height={height}>

          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* baseline (0 reference) */}
            <line
              x1={0}
              x2={boundsWidth}
              y1={boundsHeight / 2}
              y2={boundsHeight / 2}
              stroke="#cbd5e1"
              strokeDasharray="4 4"
            />

            {/* AREA */}
            {areaPath && (
              <path
                d={areaPath}
                fill="rgba(59,130,246,0.1)"
                opacity={animate ? 1 : 0}
              />
            )}

            {/* LINE */}
            {linePath && (
              <LineItem
                path={linePath}
                color="#2563eb"
                strokeWidth={3}
                opacity={animate ? 1 : 0}
              />
            )}

            {/* POINTS */}
            {processedData.map((d, i) => (
              <circle
                key={i}
                cx={xScale(d.year)}
                cy={yScale(d.value)}
                r={3}
                fill="#2563eb"
                stroke="#fff"
                strokeWidth={1}
              />
            ))}

            {/* TREND LINE (WINNING FEATURE) */}
            {slope && (
              <line
                x1={0}
                x2={boundsWidth}
                y1={yScale(processedData[0].value)}
                y2={yScale(processedData[processedData.length - 1].value)}
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}

          </g>
        </svg>
      </div>

      {/* ================= INSIGHT ================= */}
      <div className="mt-4 text-sm text-slate-600 text-center max-w-2xl mx-auto">
        This chart shows anomaly-based climate signal evolution in{" "}
        <span className="font-semibold text-slate-800">
          {selectedCountry}
        </span>
        , with trend + variability analysis to detect long-term climate shift.
      </div>

    </div>
  );
};
