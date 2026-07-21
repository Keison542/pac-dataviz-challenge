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

  // ─── Tooltip State ───
  const [tooltip, setTooltip] = useState<{
    metric: string;
    year: number;
    value: number;
    x: number;
    y: number;
    color: string;
    label: string;
  } | null>(null);

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

  // ─── Get x-ticks every 10 years ───
  const getYearTicks = useCallback((years: number[]) => {
    const min = Math.min(...years);
    const max = Math.max(...years);
    const ticks: number[] = [];
    for (let y = Math.ceil(min / 10) * 10; y <= max; y += 10) {
      ticks.push(y);
    }
    // Ensure first and last are included
    if (!ticks.includes(min)) ticks.unshift(min);
    if (!ticks.includes(max)) ticks.push(max);
    return ticks;
  }, []);

  // ─── Render individual metric card ───
  const renderMetricCard = (metric: typeof METRICS[0]) => {
    const values = data.map((d) => d[metric.key as keyof DataPoint] as number || 0);
    const maxVal = Math.max(...values) * 1.15 || 1;
    const trend = calculateTrend(values);

    // Mini chart dimensions
    const cardWidth = width > 0 ? Math.min(width / 3 - 16, 320) : 280;
    const cardHeight = height > 0 ? height : 200;
    const margin = { top: 10, right: 10, bottom: 30, left: 40 };
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

    // Get x-ticks every 10 years
    const xTicks = getYearTicks(years);

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

    // ─── Mouse handlers for tooltip ───
    const handleMouseMove = (e: React.MouseEvent<SVGGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
      if (!svgRect) return;

      const mouseX = e.clientX - svgRect.left - margin.left;
      const mouseY = e.clientY - svgRect.top - margin.top;

      // Find closest year
      let closestYear = years[0];
      let closestDist = Infinity;
      years.forEach((year) => {
        const xPos = xScale(year);
        const dist = Math.abs(mouseX - xPos);
        if (dist < closestDist) {
          closestDist = dist;
          closestYear = year;
        }
      });

      const value = data.find((d) => d.year === closestYear)?.[metric.key as keyof DataPoint] as number || 0;
      const xPos = xScale(closestYear);
      const yPos = yScale(value);

      // Only show tooltip if within chart bounds
      if (mouseX >= 0 && mouseX <= chartWidth && mouseY >= 0 && mouseY <= chartHeight) {
        setTooltip({
          metric: metric.label,
          year: closestYear,
          value: value,
          x: xPos + margin.left,
          y: yPos + margin.top,
          color: metric.color,
          label: metric.label,
        });
      } else {
        setTooltip(null);
      }
    };

    const handleMouseLeave = () => {
      setTooltip(null);
    };

    return (
      <div
        key={metric.key}
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200"
        style={{
          width: cardWidth,
          minWidth: 200,
          flex: "1 1 auto",
        }}
        onMouseLeave={() => setTooltip(null)}
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
          <div className="relative" style={{ height: chartHeight + 30 }}>
            <svg
              width={cardWidth}
              height={chartHeight + 30}
              className="block"
              style={{ maxWidth: '100%', height: 'auto' }}
            >
              <g
                transform={`translate(${margin.left},${margin.top})`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer' }}
              >
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

                {/* ─── X-Axis Ticks (every 10 years) ─── */}
                {xTicks.map((year, i) => {
                  const xPos = xScale(year);
                  const isFirst = i === 0;
                  const isLast = i === xTicks.length - 1;
                  // Skip if too close to edges
                  if (xPos < 5 || xPos > chartWidth - 5) return null;

                  return (
                    <g key={`x-tick-${i}`}>
                      <line
                        x1={xPos}
                        y1={chartHeight}
                        x2={xPos}
                        y2={chartHeight + 5}
                        stroke="#94a3b8"
                        strokeWidth={0.5}
                      />
                      <text
                        x={xPos}
                        y={chartHeight + 16}
                        textAnchor="middle"
                        fontSize={8}
                        fill="#94a3b8"
                      >
                        {year}
                      </text>
                    </g>
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

                {/* ─── In-chart Tooltip ─── */}
                {tooltip && tooltip.metric === metric.label && (
                  <g>
                    {/* Vertical line */}
                    <line
                      x1={tooltip.x - margin.left}
                      y1={0}
                      x2={tooltip.x - margin.left}
                      y2={chartHeight}
                      stroke={metric.color}
                      strokeWidth={1}
                      strokeDasharray="4,4"
                      opacity={0.5}
                    />
                    {/* Point dot */}
                    <circle
                      cx={tooltip.x - margin.left}
                      cy={tooltip.y - margin.top}
                      r={5}
                      fill={metric.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                    {/* Value label near point */}
                    <text
                      x={tooltip.x - margin.left}
                      y={tooltip.y - margin.top - 8}
                      textAnchor="middle"
                      fontSize={9}
                      fill={metric.color}
                      fontWeight="600"
                    >
                      {format(tooltip.value)}
                    </text>
                    {/* Year label */}
                    <text
                      x={tooltip.x - margin.left}
                      y={chartHeight + 22}
                      textAnchor="middle"
                      fontSize={8}
                      fill={metric.color}
                      fontWeight="600"
                    >
                      {tooltip.year}
                    </text>
                  </g>
                )}
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

        {/* ─── TOOLTIP ─── */}
        {tooltip && (
          <div
            className="fixed rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg pointer-events-none z-50"
            style={{
              left: Math.min(
                tooltip.x + 20,
                window.innerWidth - 180
              ),
              top: Math.min(
                tooltip.y - 40,
                window.innerHeight - 100
              ),
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-0.5 rounded-full"
                style={{ background: tooltip.color, height: 2 }}
              />
              <span className="font-medium text-slate-800">
                {tooltip.metric}
              </span>
            </div>
            <div className="text-slate-500 text-[10px]">{tooltip.year}</div>
            <div className="font-semibold text-slate-800">
              {format(tooltip.value)}
            </div>
          </div>
        )}

        {/* ─── FOOTNOTE ─── */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Fig 5: Individual trends in food production, livelihood assets, and income diversification across the Pacific
        </p>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
