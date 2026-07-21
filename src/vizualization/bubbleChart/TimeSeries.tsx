"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { line, curveMonotoneX } from "d3-shape";

type DataPoint = {
  year: number;
  cropYield: number;
  livestockYield: number;
  touristArrivals: number;
};

type Props = {
  width?: number;
  height?: number;
  data: DataPoint[];
  selectedCountry: string;
  className?: string;
};

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    color: "#1a5276",
    icon: "🌾",
    unit: "tonnes",
    description: "Agricultural output and food security",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    color: "#e74c3c",
    icon: "🐄",
    unit: "value",
    description: "Household assets and economic resilience",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    color: "#27ae60",
    icon: "✈️",
    unit: "count",
    description: "Tourism revenue and economic diversity",
  },
];

export function TimeSeriesDashboard({
  width: propWidth,
  height: propHeight,
  data,
  selectedCountry,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // ─── Responsive Resize ───
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 600;
        const height = propHeight || Math.min(rect.width * 0.4, 300);
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [propWidth, propHeight]);

  const { width, height } = dimensions;

  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.5;
    if (width < 600) return base * 0.65;
    if (width < 768) return base * 0.8;
    if (width < 1024) return base * 0.9;
    return base;
  }, [width]);

  const format = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `${(v / 1_000).toFixed(0)}K`
      : v.toFixed(1);

  // ─── Calculate trend for a metric ───
  const calculateTrend = useCallback((values: number[]) => {
    if (values.length < 2) return 0;
    const first = values[0];
    const last = values[values.length - 1];
    if (first === 0) return 0;
    return ((last - first) / first) * 100;
  }, []);

  // ─── Render individual metric card ───
  const renderMetricCard = (metric: typeof METRICS[0]) => {
    const values = data.map((d) => d[metric.key as keyof DataPoint] as number || 0);
    const maxVal = Math.max(...values) * 1.15 || 1;
    const trend = calculateTrend(values);

    // Mini chart dimensions
    const cardWidth = width > 0 ? Math.min(width / 3 - 16, 300) : 280;
    const cardHeight = height > 0 ? height : 180;
    const margin = { top: 10, right: 10, bottom: 30, left: 35 };
    const chartWidth = cardWidth - margin.left - margin.right;
    const chartHeight = cardHeight - margin.top - margin.bottom - 50;

    // Scales for mini chart
    const years = data.map((d) => d.year);
    const xScale = scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, chartWidth]);

    const yScale = scaleLinear()
      .domain([0, maxVal])
      .range([chartHeight, 0])
      .nice();

    // Line path
    const lineGen = line<DataPoint>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d[metric.key as keyof DataPoint] as number || 0))
      .curve(curveMonotoneX);

    const path = lineGen(data) || "";

    // Latest value
    const latestValue = values[values.length - 1] || 0;
    const latestYear = years[years.length - 1];

    // Trend indicator
    const trendColor = trend > 5 ? "#27ae60" : trend < -5 ? "#e74c3c" : "#f39c12";
    const trendArrow = trend > 5 ? "↑" : trend < -5 ? "↓" : "→";

    return (
      <div
        key={metric.key}
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200"
        style={{
          width: cardWidth,
          minWidth: 200,
          flex: "1 1 auto",
        }}
      >
        <div className="p-4">
          {/* ─── Header ─── */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{metric.icon}</span>
                <h4 className="text-sm font-semibold text-slate-800">
                  {metric.label}
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{metric.description}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-800">
                {format(latestValue)}
              </div>
              <div className="text-xs text-slate-400">{metric.unit}</div>
            </div>
          </div>

          {/* ─── Mini Chart ─── */}
          <div className="relative" style={{ height: chartHeight + 10 }}>
            <svg
              width={cardWidth}
              height={chartHeight + 30}
              className="block"
              style={{ maxWidth: '100%', height: 'auto' }}
            >
              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* ─── Grid Lines ─── */}
                {[0, 0.33, 0.66, 1].map((pos, i) => {
                  const yPos = pos * chartHeight;
                  return (
                    <line
                      key={`grid-${i}`}
                      x1={0}
                      x2={chartWidth}
                      y1={yPos}
                      y2={yPos}
                      stroke="#e8ecf0"
                      strokeWidth={0.5}
                      strokeDasharray={i > 0 ? "3,3" : "none"}
                    />
                  );
                })}

                {/* ─── Area Fill ─── */}
                <path
                  d={path}
                  fill="none"
                  stroke={metric.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* ─── Area Underline ─── */}
                <path
                  d={`${path} L ${xScale(latestYear)} ${chartHeight} L ${xScale(years[0])} ${chartHeight} Z`}
                  fill={metric.color}
                  opacity={0.08}
                />

                {/* ─── End Dot ─── */}
                <circle
                  cx={xScale(latestYear)}
                  cy={yScale(latestValue)}
                  r={4}
                  fill={metric.color}
                  stroke="white"
                  strokeWidth={2}
                />

                {/* ─── Trend Label ─── */}
                <text
                  x={chartWidth - 4}
                  y={-4}
                  textAnchor="end"
                  fontSize={10}
                  fill={trendColor}
                  fontWeight="600"
                >
                  {trendArrow} {Math.abs(trend).toFixed(1)}%
                </text>
              </g>
            </svg>
          </div>

          {/* ─── Footer: Year range and change ─── */}
          <div className="flex justify-between text-xs text-slate-400 mt-1 pt-1 border-t border-slate-50">
            <span>{years[0]} – {latestYear}</span>
            <span className="text-slate-600">
              Min: {format(Math.min(...values))} | Max: {format(Math.max(...values))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ─── Loading ───
  if (!data.length || !width) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400 text-sm">Loading chart...</p>
        </div>
      </div>
    );
  }

  const fontSize = getFontSize(12);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6">
        {/* ─── HEADER ─── */}
        <div className="mb-6 text-center">
          <h3 className="text-xl sm:text-2xl font-normal text-slate-800">
            Individual Trends
          </h3>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto mt-1">
            Tracking food production, livelihood assets, and income diversification across the Pacific
          </p>
        </div>

        {/* ─── CARDS GRID ─── */}
        <div className="flex flex-wrap gap-4 justify-center">
          {METRICS.map((metric) => renderMetricCard(metric))}
        </div>

        {/* ─── FOOTNOTE ─── */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Fig 5: Individual trends in food production, livelihood assets, and income diversification across the Pacific
        </p>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
