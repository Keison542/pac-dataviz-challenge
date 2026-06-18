"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { line, curveMonotoneX } from "d3-shape";
import { LineItem } from "@/vizualization/lineChart/LineItem";

const MARGIN = { top: 50, right: 40, bottom: 90, left: 100 };

export type UnifiedDatum = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  width?: number;
  height?: number;
  data: UnifiedDatum[];
  selectedCountry?: string;
  setSelectedCountry?: (c: string) => void;
  highlightMode?: "economic" | "human" | "system";
  className?: string;
  title?: string;
  subtitle?: string;
};

export const TrendLine = ({
  width: propWidth,
  height: propHeight,
  data,
  selectedCountry,
  setSelectedCountry,
  highlightMode,
  className = "",
  title = "Livelihood Pressure Curve",
  subtitle = "Aggregated impact trend across years",
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<UnifiedDatum | null>(null);

  // ─── Responsive sizing ───
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 600;
        const height = propHeight || Math.min(rect.width * 0.6, 400);
        setDimensions({ width, height });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

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

  // ─── Responsive font size ───
  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.6;
    if (width < 600) return base * 0.8;
    if (width < 800) return base * 0.9;
    return base;
  }, [width]);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // ─── Aggregate by year ───
  const trendData = useMemo(() => {
    const map = new Map<number, number>();

    data.forEach((d) => {
      map.set(d.year, (map.get(d.year) || 0) + d.value);
    });

    return Array.from(map.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
  }, [data]);

  const maxValue = useMemo(
    () => Math.max(...trendData.map((d) => d.value), 1),
    [trendData]
  );

  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([
          trendData[0]?.year ?? 0,
          trendData.at(-1)?.year ?? 1,
        ])
        .range([0, boundsWidth]),
    [trendData, boundsWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([boundsHeight, 0]),
    [maxValue, boundsHeight]
  );

  const linePath = useMemo(() => {
    return (
      line<{ year: number; value: number }>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.value))
        .curve(curveMonotoneX)(trendData) || ""
    );
  }, [trendData, xScale, yScale]);

  const fontSize = getFontSize(11);
  const titleFontSize = getFontSize(14);
  const subtitleFontSize = getFontSize(12);

  if (!trendData.length || !width || !height) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  const format = (v: number) =>
    v >= 1e6
      ? `${(v / 1e6).toFixed(1)}M`
      : v >= 1e3
      ? `${(v / 1e3).toFixed(0)}K`
      : v.toString();

  // ─── Dynamic tick count ───
  const tickCount = Math.max(3, Math.min(8, Math.floor(width / 100)));

  return (
    <div ref={containerRef} className={`w-full font-sans flex flex-col items-center ${className}`}>
      {/* ─── HEADER ─── */}
      <div className="mb-4 text-center max-w-xl mx-auto px-4">
        <div 
          className="font-semibold text-slate-900"
          style={{ fontSize: titleFontSize }}
        >
          {title}
        </div>
        {subtitle && (
          <p 
            className="text-slate-600 mt-1"
            style={{ fontSize: subtitleFontSize }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* ─── CHART ─── */}
      <div className="relative w-full overflow-x-auto">
        <svg 
          width={width} 
          height={height} 
          className="block"
          viewBox={width && height ? `0 0 ${width} ${height}` : undefined}
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Subtle baseline */}
            <line
              x1={0}
              x2={boundsWidth}
              y1={yScale(0)}
              y2={yScale(0)}
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />

            {/* LINE */}
            <LineItem
              path={linePath}
              color="#0ea5e9"
              strokeWidth={Math.max(2, Math.min(4, width / 200))}
              opacity={0.95}
              onHover={() => {}}
            />

            {/* POINTS */}
            {trendData.map((d, i) => {
              const isActive = hovered?.year === d.year;

              return (
                <circle
                  key={`point-${i}`}
                  cx={xScale(d.year)}
                  cy={yScale(d.value)}
                  r={isActive ? Math.max(6, width / 80) : Math.max(3, width / 150)}
                  fill={isActive ? "#0284c7" : "#38bdf8"}
                  opacity={isActive ? 1 : 0.6}
                  onMouseEnter={() => setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                  className="cursor-pointer transition-all duration-200"
                />
              );
            })}

            {/* X-AXIS TICKS */}
            {trendData
              .filter((_, i) => {
                const step = Math.max(1, Math.floor(trendData.length / tickCount));
                return i % step === 0 || i === trendData.length - 1;
              })
              .map((d, i) => {
                const xPos = xScale(d.year);
                if (xPos < 10 || xPos > boundsWidth - 10) return null;
                
                return (
                  <text
                    key={`x-tick-${i}`}
                    x={xPos}
                    y={boundsHeight + 25}
                    textAnchor="middle"
                    fontSize={fontSize * 0.85}
                    fill="#6b7280"
                  >
                    {d.year}
                  </text>
                );
              })}

            {/* Y-AXIS TICKS */}
            {Array.from({ length: 5 }, (_, i) => (maxValue / 4) * i).map((v, i) => {
              const yPos = yScale(v);
              if (yPos < 5 || yPos > boundsHeight - 5) return null;
              
              return (
                <g key={`y-tick-${i}`}>
                  <line
                    x1={0}
                    x2={boundsWidth}
                    y1={yPos}
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth={0.5}
                  />
                  <text
                    x={-8}
                    y={yPos + fontSize * 0.35}
                    textAnchor="end"
                    fontSize={fontSize * 0.8}
                    fill="#94a3b8"
                  >
                    {format(v)}
                  </text>
                </g>
              );
            })}

            {/* AXIS LABELS */}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 55}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#374151"
            >
              Year
            </text>

            <text
              x={-60}
              y={boundsHeight / 2}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#374151"
              transform={`rotate(-90, -60, ${boundsHeight / 2})`}
            >
              Impact Level
            </text>
          </g>
        </svg>

        {/* ─── TOOLTIP ─── */}
        {hovered && (
          <div 
            className="absolute bg-white border border-slate-200 shadow-lg rounded-lg p-2 sm:p-3 pointer-events-none z-10"
            style={{
              right: Math.max(10, width / 2 - 100),
              top: Math.min(10, height - 100),
              maxWidth: Math.min(180, width - 40),
              fontSize: getFontSize(12),
            }}
          >
            <div 
              className="font-semibold text-slate-900"
              style={{ fontSize: fontSize * 1.1 }}
            >
              {hovered.year}
            </div>
            <div 
              className="font-bold text-blue-600"
              style={{ fontSize: fontSize * 1.3 }}
            >
              {format(hovered.value)}
            </div>
            <div 
              className="text-slate-500"
              style={{ fontSize: fontSize * 0.8 }}
            >
              recorded impact trend
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
