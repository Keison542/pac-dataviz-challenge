"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { area, curveMonotoneX } from "d3-shape";

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

const MARGIN = { top: 40, right: 50, bottom: 70, left: 70 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    color: "#1a5276",
    yAxisLabel: "Food Production (tonnes)",
    fillOpacity: 0.75,
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    color: "#e74c3c",
    yAxisLabel: "Livelihood Assets (value)",
    fillOpacity: 0.7,
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    color: "#27ae60",
    yAxisLabel: "Tourist Arrivals (count)",
    fillOpacity: 0.65,
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

  const [hoveredArea, setHoveredArea] = useState<{
    metric: string;
    year: number;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(METRICS.map((m) => m.key))
  );

  // ─── Responsive Resize ───
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

  const responsiveMargin = useMemo(() => {
    if (width < 400) return { top: 30, right: 10, bottom: 50, left: 50 };
    if (width < 600) return { top: 35, right: 15, bottom: 55, left: 60 };
    if (width < 768) return { top: 38, right: 20, bottom: 60, left: 65 };
    return MARGIN;
  }, [width]);

  const boundsWidth = width - responsiveMargin.left - responsiveMargin.right;
  const boundsHeight = height - responsiveMargin.top - responsiveMargin.bottom;

  // ─── Toggle Metric Visibility ───
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

  // ─── Sort metrics for consistent stacking ───
  const sortedMetrics = useMemo(() => {
    return [...METRICS].sort((a, b) => a.key.localeCompare(b.key));
  }, []);

  // ─── Calculate Stacked Values ───
  const stackedData = useMemo(() => {
    return data.map((d) => {
      let cumulative = 0;
      const stack: Record<string, { value: number; cumulative: number }> = {};
      
      sortedMetrics.forEach((metric) => {
        if (visibleMetrics.has(metric.key)) {
          const value = d[metric.key as keyof DataPoint] as number || 0;
          cumulative += value;
          stack[metric.key] = { value, cumulative };
        }
      });
      
      return {
        year: d.year,
        total: cumulative,
        stack,
      };
    });
  }, [data, sortedMetrics, visibleMetrics]);

  // ─── Calculate Max Value ───
  const maxValue = useMemo(() => {
    let maxVal = 0;
    stackedData.forEach((d) => {
      maxVal = Math.max(maxVal, d.total);
    });
    return maxVal * 1.15 || 1;
  }, [stackedData]);

  // ─── Scales ───
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

  // ─── Area Paths ───
  const areaPaths = useMemo(() => {
    const paths: Record<string, { fill: string; stroke: string }> = {};

    sortedMetrics.forEach((metric) => {
      if (!visibleMetrics.has(metric.key)) return;

      // Get the cumulative values for this metric
      const metricData = stackedData.map((d) => ({
        year: d.year,
        value: d.stack[metric.key]?.cumulative || 0,
        bottom: d.stack[metric.key]
          ? d.stack[metric.key].cumulative - d.stack[metric.key].value
          : 0,
      }));

      const areaGen = area<{ year: number; value: number; bottom: number }>()
        .x((d) => xScale(d.year))
        .y0((d) => yScale(d.bottom))
        .y1((d) => yScale(d.value))
        .curve(curveMonotoneX);

      const path = areaGen(metricData) || "";

      // Also generate a stroke path for the top line
      const lineGen = area<{ year: number; value: number; bottom: number }>()
        .x((d) => xScale(d.year))
        .y1((d) => yScale(d.value))
        .curve(curveMonotoneX);

      const strokePath = lineGen(metricData) || "";

      paths[metric.key] = { fill: path, stroke: strokePath };
    });

    return paths;
  }, [stackedData, xScale, yScale, visibleMetrics, sortedMetrics]);

  // ─── Ticks ───
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

  // ─── Formatter ───
  const format = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `${(v / 1_000).toFixed(0)}K`
      : v.toFixed(1);

  // ─── Active Y-Axis Label ───
  const activeMetricLabel = useMemo(() => {
    if (hoveredArea) {
      const metric = METRICS.find(m => m.label === hoveredArea.metric);
      return metric?.yAxisLabel || "Combined Value";
    }
    const visibleKeys = Array.from(visibleMetrics);
    if (visibleKeys.length === 1) {
      const metric = METRICS.find(m => m.key === visibleKeys[0]);
      return metric?.yAxisLabel || "Combined Value";
    }
    return "Combined Value";
  }, [hoveredArea, visibleMetrics]);

  // ─── Get Year Data for Hover ───
  const getYearData = useCallback((year: number) => {
    const yearData = stackedData.find((d) => d.year === year);
    if (!yearData) return null;

    const result: { metric: string; value: number; color: string }[] = [];
    sortedMetrics.forEach((metric) => {
      if (visibleMetrics.has(metric.key) && yearData.stack[metric.key]) {
        result.push({
          metric: metric.label,
          value: yearData.stack[metric.key].value,
          color: metric.color,
        });
      }
    });
    return result;
  }, [stackedData, sortedMetrics, visibleMetrics]);

  // ─── Loading ───
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
            Structural system shift (Stacked)
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
                  style={{ background: m.color, height: 2 }}
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

              {/* ─── AREAS ─── */}
              {sortedMetrics.map((metric) => {
                if (!visibleMetrics.has(metric.key)) return null;
                const paths = areaPaths[metric.key];
                if (!paths || !paths.fill) return null;

                const isHovered = hoveredArea?.metric === metric.label;

                return (
                  <g key={`area-${metric.key}`}>
                    {/* Fill area */}
                    <path
                      d={paths.fill}
                      fill={metric.color}
                      opacity={isHovered ? 1 : metric.fillOpacity || 0.7}
                      stroke="none"
                      className="transition-opacity duration-200"
                    />
                    {/* Top line */}
                    <path
                      d={paths.stroke}
                      fill="none"
                      stroke={metric.color}
                      strokeWidth={isHovered ? 3 : 1.5}
                      opacity={isHovered ? 1 : 0.6}
                      className="transition-opacity duration-200"
                    />
                  </g>
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
                className="transition-opacity duration-300"
              >
                {activeMetricLabel}
              </text>

              {/* ─── HOVER TARGET (Invisible rects over chart) ─── */}
              {data.map((d) => {
                const xPos = xScale(d.year);
                if (xPos === undefined) return null;

                // Find the topmost visible metric at this year
                let topMetric: string | null = null;
                let topValue = 0;
                let topColor = "";

                sortedMetrics.forEach((metric) => {
                  if (visibleMetrics.has(metric.key)) {
                    const val = d[metric.key as keyof DataPoint] as number || 0;
                    if (val > 0) {
                      const cumulative = stackedData.find(sd => sd.year === d.year)?.stack[metric.key]?.cumulative || 0;
                      if (cumulative > topValue) {
                        topValue = cumulative;
                        topMetric = metric.label;
                        topColor = metric.color;
                      }
                    }
                  }
                });

                if (!topMetric) return null;

                return (
                  <rect
                    key={`hover-${d.year}`}
                    x={xPos - 15}
                    y={0}
                    width={30}
                    height={boundsHeight}
                    fill="transparent"
                    onMouseEnter={() => {
                      const yearData = getYearData(d.year);
                      if (yearData) {
                        setHoveredArea({
                          metric: topMetric,
                          year: d.year,
                          value: topValue,
                          x: xPos,
                          y: yScale(topValue),
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredArea(null)}
                    className="cursor-pointer"
                  />
                );
              })}
            </g>
          </svg>

          {/* ─── CAPTION ─── */}
          <p className="mx-auto max-w-3xl text-center text-slate-600 text-sm leading-relaxed mt-2">
            Fig 5: Stacked area trends in food production, livelihood assets, and income diversification
            across the Pacific.
          </p>

          {/* ─── TOOLTIP ─── */}
          {hoveredArea && !isMobile && (
            <div
              className="absolute rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg pointer-events-none z-10"
              style={{
                left: Math.min(
                  hoveredArea.x + responsiveMargin.left + 12,
                  width - 180
                ),
                top: Math.min(
                  hoveredArea.y + responsiveMargin.top - 80,
                  height - 120
                ),
              }}
            >
              <div className="font-medium text-slate-800 mb-1">
                {hoveredArea.year}
              </div>
              {getYearData(hoveredArea.year)?.map((item) => (
                <div key={item.metric} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-0.5 rounded-full"
                      style={{ background: item.color, height: 2 }}
                    />
                    <span className="text-slate-600">{item.metric}</span>
                  </div>
                  <span className="font-medium text-slate-800">
                    {format(item.value)}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-100 mt-1 pt-1 flex justify-between">
                <span className="text-slate-600 font-medium">Total</span>
                <span className="font-semibold text-slate-800">
                  {format(hoveredArea.value)}
                </span>
              </div>
            </div>
          )}

          {/* ─── MOBILE TOOLTIP ─── */}
          {hoveredArea && isMobile && (
            <div className="mt-3 text-center bg-white border border-slate-200 rounded-lg p-3 mx-2">
              <div className="font-medium text-slate-800 mb-1">
                {hoveredArea.year}
              </div>
              {getYearData(hoveredArea.year)?.map((item) => (
                <div key={item.metric} className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-0.5 rounded-full"
                      style={{ background: item.color, height: 2 }}
                    />
                    <span className="text-slate-600">{item.metric}</span>
                  </div>
                  <span className="font-medium text-slate-800">
                    {format(item.value)}
                  </span>
                </div>
              ))}
              <div className="border-t border-slate-100 mt-1 pt-1 flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Total</span>
                <span className="font-semibold text-slate-800">
                  {format(hoveredArea.value)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
