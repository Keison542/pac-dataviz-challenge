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

const MARGIN = { top: 40, right: 40, bottom: 70, left: 60 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    color: "#2c3e50",
    yAxisLabel: "Food Production (tonnes)", // Added
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    color: "#c0392b",
    yAxisLabel: "Livelihood Assets (value)", // Added
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    color: "#27ae60",
    yAxisLabel: "Tourist Arrivals (count)", // Added
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

  const [hoveredPoint, setHoveredPoint] = useState<{
    metric: string;
    year: number;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(METRICS.map((m) => m.key))
  );

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 600;
        const height = propHeight || Math.min(rect.width * 0.5, 380);
        setDimensions({ width, height });
        setIsMobile(width < 768);
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

  const responsiveMargin = useMemo(() => {
    if (width < 400) {
      return { top: 30, right: 10, bottom: 50, left: 40 };
    }
    if (width < 600) {
      return { top: 35, right: 15, bottom: 55, left: 48 };
    }
    if (width < 768) {
      return { top: 38, right: 20, bottom: 60, left: 52 };
    }
    return MARGIN;
  }, [width]);

  const boundsWidth = width - responsiveMargin.left - responsiveMargin.right;
  const boundsHeight = height - responsiveMargin.top - responsiveMargin.bottom;

  const toggleMetric = useCallback((key: string) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.5;
    if (width < 600) return base * 0.65;
    if (width < 768) return base * 0.8;
    if (width < 1024) return base * 0.9;
    return base;
  }, [width]);

  const maxValue = useMemo(() => {
    let maxVal = 0;
    data.forEach((d) => {
      METRICS.forEach((m) => {
        if (visibleMetrics.has(m.key)) {
          maxVal = Math.max(maxVal, d[m.key as keyof DataPoint] as number || 0);
        }
      });
    });
    return maxVal * 1.15 || 1;
  }, [data, visibleMetrics]);

  const xScale = useMemo(() => {
    const years = data.map((d) => d.year);
    return scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, boundsWidth]);
  }, [data, boundsWidth]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxValue])
      .range([boundsHeight, 0])
      .nice();
  }, [maxValue, boundsHeight]);

  const linePaths = useMemo(() => {
    const paths: Record<string, string> = {};

    METRICS.forEach((m) => {
      if (!visibleMetrics.has(m.key)) return;

      const lineGen = line<DataPoint>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d[m.key as keyof DataPoint] as number || 0))
        .curve(curveMonotoneX);

      paths[m.key] = lineGen(data) || "";
    });

    return paths;
  }, [data, xScale, yScale, visibleMetrics]);

  const xTicks = useMemo(() => {
    const years = data.map((d) => d.year);
    const min = Math.min(...years);
    const max = Math.max(...years);
    
    const maxTicks = width < 500 ? 4 : width < 768 ? 5 : 8;
    const step = Math.max(1, Math.floor((max - min) / maxTicks));
    
    const ticks: number[] = [];
    for (let y = min; y <= max; y += step) ticks.push(y);
    if (ticks[ticks.length - 1] !== max) ticks.push(max);

    return ticks;
  }, [data, width]);

  const yTicks = useMemo(() => {
    const count = width < 500 ? 3 : 5;
    const step = maxValue / count;
    return Array.from({ length: count + 1 }, (_, i) => i * step);
  }, [maxValue, width]);

  const format = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `${(v / 1_000).toFixed(0)}K`
      : v.toFixed(1);

  // Determine which metric is being hovered to show its label
  const activeMetricLabel = useMemo(() => {
    if (!hoveredPoint) return "Value";
    const metric = METRICS.find(m => m.label === hoveredPoint.metric);
    return metric?.yAxisLabel || "Value";
  }, [hoveredPoint]);

  if (!data.length || !width || !height) {
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
    <div ref={containerRef} className={`w-full flex flex-col items-center ${className}`}>
      <div className="w-full max-w-4xl px-3 sm:px-6">
        {/* ─── HEADER ─── */}
        <div className="mb-5 text-center">
          <h3 className="text-lg sm:text-xl font-normal text-slate-800">
            Structural system shift
          </h3>
        </div>

        {/* ─── LEGEND ─── */}
        <div className="flex flex-wrap gap-4 mb-4 justify-center">
          {METRICS.map((m) => {
            const isVisible = visibleMetrics.has(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className="flex items-center gap-2 text-xs transition-opacity duration-200 hover:opacity-70"
                style={{
                  opacity: isVisible ? 1 : 0.3,
                }}
              >
                <span 
                  className="w-6 h-0.5 rounded-full"
                  style={{ 
                    background: m.color,
                    height: 2,
                  }}
                />
                <span className="text-slate-600">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── CHART ─── */}
        <div className="relative w-full">
          <svg 
            width={width} 
            height={height} 
            className="block"
            viewBox={width && height ? `0 0 ${width} ${height}` : undefined}
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <g transform={`translate(${responsiveMargin.left},${responsiveMargin.top})`}>
              {/* ─── GRID ─── */}
              {yTicks.map((v, i) => {
                const yPos = yScale(v);
                if (yPos < 5 || yPos > boundsHeight - 5) return null;
                return (
                  <line
                    key={`grid-y-${i}`}
                    x1={0}
                    x2={boundsWidth}
                    y1={yPos}
                    y2={yPos}
                    stroke="#e8ecf0"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* ─── LINES ─── */}
              {METRICS.map((m) => {
                if (!visibleMetrics.has(m.key)) return null;
                const path = linePaths[m.key];
                if (!path) return null;

                const isHovered = hoveredPoint?.metric === m.label;

                return (
                  <path
                    key={`line-${m.key}`}
                    d={path}
                    fill="none"
                    stroke={m.color}
                    strokeWidth={isHovered ? 3 : 2}
                    opacity={isHovered ? 1 : 0.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onMouseEnter={() => {
                      const lastPoint = data[data.length - 1];
                      setHoveredPoint({
                        metric: m.label,
                        year: lastPoint.year,
                        value: lastPoint[m.key as keyof DataPoint] as number || 0,
                        x: xScale(lastPoint.year),
                        y: yScale(lastPoint[m.key as keyof DataPoint] as number || 0),
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  />
                );
              })}

              {/* ─── END LABELS ─── */}
              {METRICS.map((m) => {
                if (!visibleMetrics.has(m.key)) return null;
                const lastPoint = data[data.length - 1];
                const value = lastPoint[m.key as keyof DataPoint] as number || 0;
                if (value === 0) return null;

                const x = xScale(lastPoint.year) + 6;
                const y = yScale(value);

                const isHovered = hoveredPoint?.metric === m.label;

                return (
                  <text
                    key={`end-label-${m.key}`}
                    x={x}
                    y={y + 3}
                    fontSize={Math.max(9, fontSize * 0.75)}
                    fill={m.color}
                    fontWeight={isHovered ? "600" : "400"}
                    opacity={isHovered ? 1 : 0.6}
                    className="transition-opacity duration-200"
                  >
                    {format(value)}
                  </text>
                );
              })}

              {/* ─── X AXIS ─── */}
              {xTicks.map((x, i) => {
                const xPos = xScale(x);
                if (xPos < 5 || xPos > boundsWidth - 5) return null;
                
                return (
                  <text
                    key={`x-label-${i}`}
                    x={xPos}
                    y={boundsHeight + 18}
                    textAnchor="middle"
                    fontSize={Math.max(8, fontSize * 0.7)}
                    fill="#94a3b8"
                  >
                    {x}
                  </text>
                );
              })}

              <text
                x={boundsWidth / 2}
                y={boundsHeight + 40}
                textAnchor="middle"
                fontSize={fontSize * 0.7}
                fill="#94a3b8"
                className="uppercase tracking-wider"
              >
                Year
              </text>

              {/* ─── Y AXIS ─── */}
              {yTicks.map((v, i) => {
                const yPos = yScale(v);
                if (yPos < 5 || yPos > boundsHeight - 5) return null;
                return (
                  <text
                    key={`y-label-${i}`}
                    x={-6}
                    y={yPos + 3}
                    textAnchor="end"
                    fontSize={Math.max(7, fontSize * 0.65)}
                    fill="#94a3b8"
                  >
                    {format(v)}
                  </text>
                );
              })}

              {/* ─── DYNAMIC Y-AXIS LABEL ─── */}
              <text
                transform="rotate(-90)"
                x={-boundsHeight / 2}
                y={-(responsiveMargin.left - 12)}
                textAnchor="middle"
                fontSize={fontSize * 0.7}
                fill="#94a3b8"
                className="uppercase tracking-wider transition-opacity duration-300"
                style={{
                  opacity: hoveredPoint ? 1 : 0.7,
                }}
              >
                {activeMetricLabel}
              </text>
            </g>
          </svg>

          <p className="mx-auto max-w-3xl text-center text-slate-600 leading-relaxed"> 
            Fig 5: Long-term trends in food production, livelihood assets, and income diversification
            across the Pacific.
          </p>

          {/* ─── TOOLTIP ─── */}
          {hoveredPoint && !isMobile && (
            <div
              className="absolute rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg pointer-events-none"
              style={{
                left: Math.min(
                  hoveredPoint.x + responsiveMargin.left + 12,
                  width - 140
                ),
                top: Math.min(
                  hoveredPoint.y + responsiveMargin.top - 40,
                  height - 80
                ),
              }}
            >
              <div className="flex items-center gap-2">
                <span 
                  className="w-4 h-0.5 rounded-full"
                  style={{ 
                    background: METRICS.find(m => m.label === hoveredPoint.metric)?.color,
                    height: 2,
                  }}
                />
                <span className="font-medium text-slate-800">
                  {hoveredPoint.metric}
                </span>
              </div>
              <div className="text-slate-500 text-[10px]">{hoveredPoint.year}</div>
              <div className="font-semibold text-slate-800">
                {format(hoveredPoint.value)}
              </div>
            </div>
          )}

          {/* ─── MOBILE TOOLTIP ─── */}
          {hoveredPoint && isMobile && (
            <div className="mt-3 text-center bg-white border border-slate-200 rounded-lg p-2 mx-2">
              <div className="flex items-center justify-center gap-2">
                <span 
                  className="w-4 h-0.5 rounded-full"
                  style={{ 
                    background: METRICS.find(m => m.label === hoveredPoint.metric)?.color,
                    height: 2,
                  }}
                />
                <span className="font-medium text-xs text-slate-800">{hoveredPoint.metric}</span>
              </div>
              <div className="text-xs text-slate-500">{hoveredPoint.year}</div>
              <div className="text-sm font-semibold text-slate-800">
                {format(hoveredPoint.value)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
