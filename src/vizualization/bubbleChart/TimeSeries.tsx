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
    yAxisLabel: "kg/ha",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    color: "#e74c3c",
    yAxisLabel: "kg/animal",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    color: "#27ae60",
    yAxisLabel: "count",
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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 900;
        const height = propHeight || Math.min(rect.width * 0.35, 280);
        setDimensions({ width, height });
        setIsMobile(width < 640);
        setIsTablet(width >= 640 && width < 1024);
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

  const getYearTicks = useCallback((years: number[]) => {
    const min = Math.min(...years);
    const max = Math.max(...years);
    
    let tickCount = 5;
    if (isMobile) tickCount = 3;
    else if (isTablet) tickCount = 4;
    
    const step = Math.max(1, Math.floor((max - min) / tickCount));
    const roundedStep = Math.ceil(step / 5) * 5;
    
    const ticks: number[] = [];
    for (let y = Math.ceil(min / roundedStep) * roundedStep; y <= max; y += roundedStep) {
      ticks.push(y);
    }
    if (!ticks.includes(min)) ticks.unshift(min);
    if (!ticks.includes(max)) ticks.push(max);
    return ticks;
  }, [isMobile, isTablet]);

  if (!data.length || !width) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const gap = isMobile ? 8 : 16;
  const totalGap = gap * 2;
  
  let cardsPerRow = 3;
  if (isMobile) cardsPerRow = 1;
  else if (isTablet) cardsPerRow = 2;
  
  const cardWidth = Math.max((width - totalGap) / cardsPerRow, isMobile ? 280 : 180);
  const cardHeight = height > 0 ? height : (isMobile ? 250 : 220);

  const years = data.map((d) => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const renderMetricChart = (metric: typeof METRICS[0], index: number) => {
    const values = data.map((d) => d[metric.key as keyof DataPoint] as number || 0);
    const maxVal = Math.max(...values) * 1.15 || 1;

    const margin = isMobile 
      ? { top: 12, right: 4, bottom: 25, left: 38 }
      : { top: 20, right: 8, bottom: 30, left: 48 };
    
    const chartWidth = cardWidth - margin.left - margin.right;
    const chartHeight = cardHeight - margin.top - margin.bottom - (isMobile ? 30 : 40);

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

    return (
      <div
        key={metric.key}
        className="flex-shrink-0"
        style={{
          width: cardWidth,
          minWidth: isMobile ? 280 : 150,
          maxWidth: isMobile ? '100%' : undefined,
        }}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-start justify-between mb-1 px-1">
            <div className="flex items-center gap-1.5">
              <h4 className={`text-${isMobile ? '10' : '12'}px font-semibold text-slate-800 leading-tight`}>
                {metric.label}
              </h4>
            </div>
          </div>

          <div className="flex-1 relative" style={{ minHeight: chartHeight + 10 }}>
            <svg
              width={cardWidth}
              height={chartHeight + (isMobile ? 30 : 40)}
              className="block"
              style={{ maxWidth: '100%', height: 'auto' }}
            >
              <g transform={`translate(${margin.left},${margin.top})`}>
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => {
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

                {/* X-axis ticks */}
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
                        y={chartHeight + (isMobile ? 12 : 14)}
                        textAnchor="middle"
                        fontSize={isMobile ? 6 : 7}
                        fill="#94a3b8"
                      >
                        {year}
                      </text>
                    </g>
                  );
                })}

                {/* Y-axis labels */}
                {yScale.ticks(isMobile ? 3 : 4).map((v, i) => {
                  const yPos = yScale(v);
                  if (yPos < 5 || yPos > chartHeight - 5) return null;
                  return (
                    <text
                      key={`y-tick-${i}`}
                      x={-6}
                      y={yPos + 2}
                      textAnchor="end"
                      fontSize={isMobile ? 6 : 7}
                      fill="#94a3b8"
                    >
                      {format(v)}
                    </text>
                  );
                })}

                {/* Y-axis unit label */}
                <text
                  x={-10}
                  y={-6}
                  textAnchor="end"
                  fontSize={isMobile ? 6 : 7}
                  fill="#94a3b8"
                >
                  {metric.yAxisLabel}
                </text>

                {/* Line */}
                <path
                  d={path}
                  fill="none"
                  stroke={metric.color}
                  strokeWidth={isMobile ? 2.5 : 2}
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
                  r={isMobile ? 4 : 3.5}
                  fill={metric.color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
        <div className="mb-4 text-center">
          <p className={`text-${isMobile ? 'xs' : 'sm'} text-slate-500 max-w-2xl mx-auto`}>
            Food production, livelihood assets, and income diversification across the Pacific
          </p>
        </div>

        <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-${isMobile ? '2' : '4'} justify-center items-stretch`}>
          {METRICS.map((metric, index) => renderMetricChart(metric, index))}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-4">
          Fig 5: Individual trends in food production (kg/ha), livelihood assets (kg/animal), and income diversification
        </p>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
