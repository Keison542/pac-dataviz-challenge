"use client";

import { scaleLinear, scaleBand } from "d3-scale";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";

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

const MARGIN = { top: 40, right: 40, bottom: 70, left: 80 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    color: "#2c3e50",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    color: "#c0392b",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    color: "#27ae60",
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

  const [hoveredBar, setHoveredBar] = useState<{
    year: number;
    metric: string;
    value: number;
    x: number;
    y: number;
    width: number;
    height: number;
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
      return { top: 30, right: 10, bottom: 50, left: 60 };
    }
    if (width < 600) {
      return { top: 35, right: 15, bottom: 55, left: 70 };
    }
    if (width < 768) {
      return { top: 38, right: 20, bottom: 60, left: 75 };
    }
    return { ...MARGIN, left: 80 };
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

  // Filter data to only visible metrics
  const visibleMetricsList = useMemo(() => {
    return METRICS.filter((m) => visibleMetrics.has(m.key));
  }, [visibleMetrics]);

  // Calculate stacked values for each year
  const stackedData = useMemo(() => {
    return data.map((d) => {
      let cumulative = 0;
      const stack: Record<string, { value: number; cumulative: number }> = {};
      
      visibleMetricsList.forEach((metric) => {
        const value = d[metric.key as keyof DataPoint] as number || 0;
        cumulative += value;
        stack[metric.key] = { value, cumulative };
      });
      
      return {
        year: d.year,
        total: cumulative,
        stack,
      };
    });
  }, [data, visibleMetricsList]);

  // Calculate max value for Y scale
  const maxValue = useMemo(() => {
    let maxVal = 0;
    stackedData.forEach((d) => {
      maxVal = Math.max(maxVal, d.total);
    });
    return maxVal * 1.15 || 1;
  }, [stackedData]);

  // X scale - band for bars
  const xScale = useMemo(() => {
    const years = data.map((d) => d.year);
    return scaleBand()
      .domain(years.map(String))
      .range([0, boundsWidth])
      .padding(0.2);
  }, [data, boundsWidth]);

  // Y scale
  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxValue])
      .range([boundsHeight, 0])
      .nice();
  }, [maxValue, boundsHeight]);

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
  const barWidth = xScale.bandwidth();

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

              {/* ─── STACKED BARS ─── */}
              {stackedData.map((d) => {
                const xPos = xScale(String(d.year));
                if (xPos === undefined) return null;

                let cumulativeHeight = 0;
                const bars = visibleMetricsList.map((metric) => {
                  const stackData = d.stack[metric.key];
                  if (!stackData) return null;
                  
                  const value = stackData.value;
                  const cumulative = stackData.cumulative;
                  
                  const barHeight = yScale(0) - yScale(value);
                  const yPos = yScale(cumulative);
                  
                  const isHovered = hoveredBar?.year === d.year && hoveredBar?.metric === metric.label;
                  
                  return {
                    key: metric.key,
                    label: metric.label,
                    color: metric.color,
                    value,
                    x: xPos,
                    y: yPos,
                    height: barHeight,
                    width: barWidth,
                    isHovered,
                  };
                }).filter((b) => b !== null) as {
                  key: string;
                  label: string;
                  color: string;
                  value: number;
                  x: number;
                  y: number;
                  height: number;
                  width: number;
                  isHovered: boolean;
                }[];

                // Render each bar segment
                return bars.map((bar, i) => {
                  // Only show bar if height is visible
                  if (bar.height < 1) return null;
                  
                  return (
                    <rect
                      key={`${d.year}-${bar.key}`}
                      x={bar.x}
                      y={bar.y}
                      width={bar.width}
                      height={bar.height}
                      fill={bar.color}
                      opacity={bar.isHovered ? 1 : 0.85}
                      stroke={bar.isHovered ? "#ffffff" : "none"}
                      strokeWidth={bar.isHovered ? 2 : 0}
                      rx={1}
                      onMouseEnter={() => {
                        setHoveredBar({
                          year: d.year,
                          metric: bar.label,
                          value: bar.value,
                          x: bar.x + bar.width / 2,
                          y: bar.y,
                          width: bar.width,
                          height: bar.height,
                        });
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="cursor-pointer transition-opacity duration-200"
                    />
                  );
                });
              })}

              {/* ─── X AXIS ─── */}
              {xTicks.map((x, i) => {
                const xPos = xScale(String(x));
                if (xPos === undefined || xPos < 5 || xPos > boundsWidth - 5) return null;
                
                return (
                  <text
                    key={`x-label-${i}`}
                    x={xPos + barWidth / 2}
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

              {/* ─── Y AXIS VALUES ─── */}
              {yTicks.map((v, i) => {
                const yPos = yScale(v);
                if (yPos < 5 || yPos > boundsHeight - 5) return null;
                return (
                  <text
                    key={`y-label-${i}`}
                    x={-8}
                    y={yPos + 3}
                    textAnchor="end"
                    fontSize={Math.max(7, fontSize * 0.65)}
                    fill="#94a3b8"
                  >
                    {format(v)}
                  </text>
                );
              })}

              {/* ─── Y-AXIS LABEL ─── */}
              <text
                transform={`rotate(-90, ${-(responsiveMargin.left - 20)}, ${boundsHeight / 2})`}
                x={-(boundsHeight / 2)}
                y={-(responsiveMargin.left - 20)}
                textAnchor="middle"
                fontSize={Math.max(10, fontSize * 0.75)}
                fill="#64748b"
                fontWeight="500"
              >
                Combined Value
              </text>
            </g>
          </svg>

          <p className="mx-auto max-w-3xl text-center text-slate-600 leading-relaxed"> 
            Fig 5: Stacked trends in food production, livelihood assets, and income diversification
            across the Pacific.
          </p>

          {/* ─── TOOLTIP ─── */}
          {hoveredBar && !isMobile && (
            <div
              className="absolute rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg pointer-events-none"
              style={{
                left: Math.min(
                  hoveredBar.x + responsiveMargin.left + 12,
                  width - 160
                ),
                top: Math.min(
                  hoveredBar.y + responsiveMargin.top - 60,
                  height - 100
                ),
              }}
            >
              <div className="flex items-center gap-2">
                <span 
                  className="w-4 h-0.5 rounded-full"
                  style={{ 
                    background: METRICS.find(m => m.label === hoveredBar.metric)?.color,
                    height: 2,
                  }}
                />
                <span className="font-medium text-slate-800">
                  {hoveredBar.metric}
                </span>
              </div>
              <div className="text-slate-500 text-[10px]">{hoveredBar.year}</div>
              <div className="font-semibold text-slate-800">
                {format(hoveredBar.value)}
              </div>
            </div>
          )}

          {/* ─── MOBILE TOOLTIP ─── */}
          {hoveredBar && isMobile && (
            <div className="mt-3 text-center bg-white border border-slate-200 rounded-lg p-2 mx-2">
              <div className="flex items-center justify-center gap-2">
                <span 
                  className="w-4 h-0.5 rounded-full"
                  style={{ 
                    background: METRICS.find(m => m.label === hoveredBar.metric)?.color,
                    height: 2,
                  }}
                />
                <span className="font-medium text-xs text-slate-800">{hoveredBar.metric}</span>
              </div>
              <div className="text-xs text-slate-500">{hoveredBar.year}</div>
              <div className="text-sm font-semibold text-slate-800">
                {format(hoveredBar.value)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
