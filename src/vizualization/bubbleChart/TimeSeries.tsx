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
    unit: "kg/ha",
    description: "Agricultural output",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    color: "#e74c3c",
    icon: "🐄",
    unit: "kg/animal",
    description: "Household assets",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    color: "#27ae60",
    icon: "✈️",
    unit: "count",
    description: "Tourism revenue",
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

  const [tooltip, setTooltip] = useState<{
    metric: string;
    year: number;
    value: number;
    x: number;
    y: number;
    color: string;
    label: string;
    cardIndex: number;
  } | null>(null);

  // ─── Responsive Resize ───
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 900;
        const height = propHeight || Math.min(rect.width * 0.35, 280);
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

  const format = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `${(v / 1_000).toFixed(0)}K`
      : v.toFixed(1);

  // ─── Calculate trend ───
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
    if (!ticks.includes(min)) ticks.unshift(min);
    if (!ticks.includes(max)) ticks.push(max);
    return ticks;
  }, []);

  if (!data.length || !width) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400 text-sm">Loading chart...</p>
        </div>
      </div>
    );
  }

  // ─── Calculate card dimensions ───
  const gap = 16;
  const totalGap = gap * 2;
  const cardWidth = Math.max((width - totalGap) / 3, 180);
  const cardHeight = height > 0 ? height : 220;

  const years = data.map((d) => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // ─── Render each metric chart ───
  const renderMetricChart = (metric: typeof METRICS[0], index: number) => {
    const values = data.map((d) => d[metric.key as keyof DataPoint] as number || 0);
    const maxVal = Math.max(...values) * 1.15 || 1;
    const trend = calculateTrend(values);

    const margin = { top: 8, right: 8, bottom: 25, left: 32 };
    const chartWidth = cardWidth - margin.left - margin.right;
    const chartHeight = cardHeight - margin.top - margin.bottom - 60;

    const xScale = scaleLinear()
      .domain([minYear, maxYear])
      .range([0, chartWidth]);

    const yScale = scaleLinear()
      .domain([0, maxVal])
      .range([chartHeight, 0])
      .nice();

    const xTicks = getYearTicks(years);

    const lineGen = line<DataPoint>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d[metric.key as keyof DataPoint] as number || 0))
      .curve(curveMonotoneX);

    const path = lineGen(data) || "";

    const latestValue = values[values.length - 1] || 0;
    const latestYear = years[years.length - 1];

    const trendColor = trend > 5 ? "#27ae60" : trend < -5 ? "#e74c3c" : "#f39c12";
    const trendArrow = trend > 5 ? "↑" : trend < -5 ? "↓" : "→";

    // ─── Mouse handlers ───
    const handleMouseMove = (e: React.MouseEvent<SVGGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect();
      if (!svgRect) return;

      const mouseX = e.clientX - svgRect.left - margin.left;
      const mouseY = e.clientY - svgRect.top - margin.top;

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

      if (mouseX >= -10 && mouseX <= chartWidth + 10 && mouseY >= -10 && mouseY <= chartHeight + 10) {
        setTooltip({
          metric: metric.label,
          year: closestYear,
          value: value,
          x: xPos + margin.left,
          y: yPos + margin.top,
          color: metric.color,
          label: metric.label,
          cardIndex: index,
        });
      } else {
        setTooltip(null);
      }
    };

    const handleMouseLeave = () => {
      if (tooltip?.cardIndex === index) {
        setTooltip(null);
      }
    };

    return (
      <div
        key={metric.key}
        className="flex-shrink-0"
        style={{
          width: cardWidth,
          minWidth: 150,
        }}
        onMouseLeave={handleMouseLeave}
      >
        <div className="h-full flex flex-col">
          {/* ─── Header ─── */}
          <div className="flex items-start justify-between mb-1 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{metric.icon}</span>
              <h4 className="text-xs font-semibold text-slate-800 leading-tight">
                {metric.label}
              </h4>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800 leading-tight">
                {format(latestValue)}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">{metric.unit}</div>
            </div>
          </div>

          {/* ─── Chart ─── */}
          <div className="flex-1 relative" style={{ minHeight: chartHeight + 10 }}>
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
                {/* Grid */}
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

                {/* X-axis ticks every 10 years */}
                {xTicks.map((year, i) => {
                  const xPos = xScale(year);
                  if (xPos < 5 || xPos > chartWidth - 5) return null;
                  return (
                    <g key={`x-tick-${i}`}>
                      <line
                        x1={xPos}
                        y1={chartHeight}
                        x2={xPos}
                        y2={chartHeight + 4}
                        stroke="#94a3b8"
                        strokeWidth={0.5}
                      />
                      <text
                        x={xPos}
                        y={chartHeight + 13}
                        textAnchor="middle"
                        fontSize={7}
                        fill="#94a3b8"
                      >
                        {year}
                      </text>
                    </g>
                  );
                })}

                {/* Line */}
                <path
                  d={path}
                  fill="none"
                  stroke={metric.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Area fill */}
                <path
                  d={`${path} L ${xScale(latestYear)} ${chartHeight} L ${xScale(years[0])} ${chartHeight} Z`}
                  fill={metric.color}
                  opacity={0.06}
                />

                {/* End dot */}
                <circle
                  cx={xScale(latestYear)}
                  cy={yScale(latestValue)}
                  r={3.5}
                  fill={metric.color}
                  stroke="white"
                  strokeWidth={1.5}
                />

                {/* Trend label */}
                <text
                  x={chartWidth - 4}
                  y={-2}
                  textAnchor="end"
                  fontSize={9}
                  fill={trendColor}
                  fontWeight="600"
                >
                  {trendArrow} {Math.abs(trend).toFixed(1)}%
                </text>

                {/* In-chart tooltip */}
                {tooltip && tooltip.cardIndex === index && (
                  <g>
                    <line
                      x1={tooltip.x - margin.left}
                      y1={0}
                      x2={tooltip.x - margin.left}
                      y2={chartHeight}
                      stroke={metric.color}
                      strokeWidth={1}
                      strokeDasharray="4,4"
                      opacity={0.4}
                    />
                    <circle
                      cx={tooltip.x - margin.left}
                      cy={tooltip.y - margin.top}
                      r={4.5}
                      fill={metric.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                    <text
                      x={tooltip.x - margin.left}
                      y={tooltip.y - margin.top - 7}
                      textAnchor="middle"
                      fontSize={8}
                      fill={metric.color}
                      fontWeight="600"
                    >
                      {format(tooltip.value)}
                    </text>
                    <text
                      x={tooltip.x - margin.left}
                      y={chartHeight + 20}
                      textAnchor="middle"
                      fontSize={7}
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

          {/* Footer */}
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 pt-0.5 border-t border-slate-50 px-1">
            <span>{minYear}–{maxYear}</span>
            <span className="text-slate-500">
              {format(Math.min(...values))} – {format(Math.max(...values))}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
        {/* ─── HEADER ─── */}
        <div className="mb-4 text-center">
          <h3 className="text-lg sm:text-xl font-normal text-slate-800">
            Individual Trends
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl mx-auto mt-0.5">
            Food production, livelihood assets, and income diversification across the Pacific
          </p>
        </div>

        {/* ─── THREE CHARTS IN ONE ROW ─── */}
        <div className="flex gap-4 justify-center items-stretch">
          {METRICS.map((metric, index) => renderMetricChart(metric, index))}
        </div>

        {/* ─── TOOLTIP ─── */}
        {tooltip && (
          <div
            className="fixed rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-lg pointer-events-none z-50"
            style={{
              left: Math.min(
                tooltip.x + 16,
                window.innerWidth - 160
              ),
              top: Math.min(
                tooltip.y - 35,
                window.innerHeight - 80
              ),
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-0.5 rounded-full"
                style={{ background: tooltip.color, height: 2 }}
              />
              <span className="font-medium text-slate-800 text-[11px]">
                {tooltip.metric}
              </span>
            </div>
            <div className="text-slate-400 text-[9px]">{tooltip.year}</div>
            <div className="font-semibold text-slate-800 text-sm">
              {format(tooltip.value)}
            </div>
          </div>
        )}

        {/* ─── FOOTNOTE ─── */}
        <p className="text-center text-[10px] text-slate-400 mt-4">
          Fig 5: Individual trends in food production (kg/ha), livelihood assets (kg/animal), and income diversification
        </p>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
