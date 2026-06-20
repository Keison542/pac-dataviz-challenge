"use client";

import { scaleLinear, scaleBand, scaleSqrt } from "d3-scale";
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
  title?: string;
  subtitle?: string;
  className?: string;
};

const MARGIN = { top: 50, right: 50, bottom: 70, left: 160 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    unit: "t/ha",
    color: "#1a1a2e",
    darkColor: "#0f0f1a",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    unit: "tons",
    color: "#4a4a6a",
    darkColor: "#2a2a4a",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    unit: "",
    color: "#94a3b8",
    darkColor: "#64748b",
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

  // ─── Responsive sizing ───
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = propWidth || rect.width || 600;
        const height = propHeight || Math.min(rect.width * 0.55, 480);
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

  // ─── Responsive margins ───
  const responsiveMargin = useMemo(() => {
    if (width < 400) {
      return { top: 40, right: 15, bottom: 50, left: 100 };
    }
    if (width < 600) {
      return { top: 45, right: 20, bottom: 60, left: 120 };
    }
    if (width < 768) {
      return { top: 48, right: 30, bottom: 65, left: 135 };
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

  // ─── Responsive font sizes ───
  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.5;
    if (width < 600) return base * 0.65;
    if (width < 768) return base * 0.8;
    if (width < 1024) return base * 0.9;
    return base;
  }, [width]);

  // ─── Metric rows for Y-axis ───
  const metricRows = useMemo(
    () => METRICS.filter((m) => visibleMetrics.has(m.key)).map((m) => m.label),
    [visibleMetrics]
  );

  // ─── Scales ───
  const xScale = useMemo(() => {
    const years = data.map((d) => d.year);
    return scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, boundsWidth]);
  }, [data, boundsWidth]);

  // Y-scale with good padding
  const yScale = useMemo(() => {
    return scaleBand()
      .domain(metricRows)
      .range([0, boundsHeight])
      .padding(0.45);
  }, [metricRows, boundsHeight]);

  // ─── Bubble radius scale ───
  const radiusScale = useMemo(() => {
    let maxValue = 0;

    data.forEach((d) => {
      METRICS.forEach((m) => {
        if (visibleMetrics.has(m.key)) {
          maxValue = Math.max(
            maxValue,
            d[m.key as keyof DataPoint] as number
          );
        }
      });
    });

    const maxRadius = width < 500 ? 16 : width < 768 ? 20 : 26;
    return scaleSqrt()
      .domain([0, maxValue || 1])
      .range([3, maxRadius]);
  }, [data, visibleMetrics, width]);

  // ─── Dynamic ticks ───
  const xTicks = useMemo(() => {
    const years = data.map((d) => d.year);
    const min = Math.min(...years);
    const max = Math.max(...years);
    
    const maxTicks = width < 500 ? 4 : width < 768 ? 5 : 7;
    const step = Math.max(1, Math.floor((max - min) / maxTicks));
    
    const ticks: number[] = [];
    for (let y = min; y <= max; y += step) ticks.push(y);
    if (ticks[ticks.length - 1] !== max) ticks.push(max);

    return ticks;
  }, [data, width]);

  const format = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `${(v / 1_000).toFixed(0)}K`
      : v.toFixed(0);

  if (!data.length || !width || !height) {
    return (
      <div ref={containerRef} className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading chart...</p>
        </div>
      </div>
    );
  }

  const fontSize = getFontSize(12);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center ${className}`}>
      <div className="w-full max-w-4xl px-2 sm:px-4">
        {/* ─── NARRATIVE HEADER ─── */}
        <div className="mb-4 text-center">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Structural System Shift
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed mt-1">
            Long-term socioeconomic indicators reveal how climate pressure gradually reshapes
            national economic structures and adaptive capacity.
          </p>
          <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed mt-2">
            Larger circles indicate periods where livelihood systems carried greater economic importance or
            production value. Patterns reveal how resilience shifted across food production, livelihood assets and
            tourism.
          </p>
        </div>

        {/* ─── LEGEND ─── */}
        <div className="flex flex-wrap gap-4 mb-4 justify-center">
          {METRICS.map((m) => {
            const isVisible = visibleMetrics.has(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] sm:text-xs font-medium"
                style={{
                  borderColor: isVisible ? m.color : "#e2e8f0",
                  color: isVisible ? m.color : "#94a3b8",
                  background: isVisible ? "white" : "#f8fafc",
                  boxShadow: isVisible ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ 
                    background: m.color,
                    opacity: isVisible ? 1 : 0.3
                  }}
                />
                <span className="whitespace-nowrap">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── CHART ─── */}
        <div className="relative w-full overflow-visible">
          <svg 
            width={width} 
            height={height} 
            className="block"
            viewBox={width && height ? `0 0 ${width} ${height}` : undefined}
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <g transform={`translate(${responsiveMargin.left},${responsiveMargin.top})`}>
              {/* ─── LIGHT BACKGROUND ROWS ─── */}
              {metricRows.map((row, index) => {
                const yPos = yScale(row) ?? 0;
                const isEven = index % 2 === 0;
                return (
                  <rect
                    key={`bg-${row}`}
                    x={0}
                    y={yPos}
                    width={boundsWidth}
                    height={yScale.bandwidth()}
                    fill={isEven ? "#f8fafc" : "transparent"}
                    rx={2}
                  />
                );
              })}

              {/* ─── GRID - Horizontal lines ─── */}
              {metricRows.map((row) => {
                const yPos = yScale(row) ?? 0;
                return (
                  <line
                    key={`grid-${row}`}
                    x1={0}
                    x2={boundsWidth}
                    y1={yPos + yScale.bandwidth()}
                    y2={yPos + yScale.bandwidth()}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* ─── GRID - Vertical lines (light) ─── */}
              {xTicks.map((x, i) => {
                const xPos = xScale(x);
                if (xPos < 5 || xPos > boundsWidth - 5) return null;
                
                return (
                  <line
                    key={`grid-x-${i}`}
                    x1={xPos}
                    x2={xPos}
                    y1={0}
                    y2={boundsHeight}
                    stroke="#f1f5f9"
                    strokeDasharray="3 3"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* ─── CONNECTING LINES (to show trajectory) ─── */}
              {METRICS.map((metric) => {
                if (!visibleMetrics.has(metric.key)) return null;
                
                const points = data
                  .map((d) => {
                    const value = d[metric.key as keyof DataPoint] as number;
                    if (value === 0) return null;
                    return {
                      x: xScale(d.year),
                      y: (yScale(metric.label) ?? 0) + yScale.bandwidth() / 2,
                      value,
                    };
                  })
                  .filter((p) => p !== null);

                if (points.length < 2) return null;

                const linePath = points
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                  .join(' ');

                return (
                  <path
                    key={`line-${metric.key}`}
                    d={linePath}
                    fill="none"
                    stroke={metric.color}
                    strokeWidth={1.5}
                    strokeOpacity={0.2}
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* ─── BUBBLES ─── */}
              {data.map((d) =>
                METRICS.map((metric) => {
                  if (!visibleMetrics.has(metric.key)) return null;

                  const value = d[metric.key as keyof DataPoint] as number;
                  if (value === 0) return null;

                  const cx = xScale(d.year);
                  const cy = (yScale(metric.label) ?? 0) + yScale.bandwidth() / 2;

                  const isActive =
                    hoveredPoint?.metric === metric.label &&
                    hoveredPoint?.year === d.year;

                  const radius = radiusScale(value);
                  if (radius < 2) return null;

                  // Get the metric color
                  const metricConfig = METRICS.find(m => m.label === metric.label);
                  const color = metricConfig?.color || '#94a3b8';

                  return (
                    <g key={`${metric.key}-${d.year}`}>
                      {/* Glow effect on active */}
                      {isActive && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius + 6}
                          fill={color}
                          opacity={0.08}
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={color}
                        opacity={isActive ? 0.95 : 0.6}
                        stroke="white"
                        strokeWidth={isActive ? 2 : 1}
                        onMouseEnter={() =>
                          setHoveredPoint({
                            metric: metric.label,
                            year: d.year,
                            value,
                            x: cx,
                            y: cy,
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                        className={!isTouchDevice ? "cursor-pointer" : ""}
                        style={{
                          transition: 'all 0.2s ease',
                          filter: isActive ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' : 'none',
                        }}
                      />
                      {/* Value label inside bubble if large enough */}
                      {radius > 12 && (
                        <text
                          x={cx}
                          y={cy + 3}
                          textAnchor="middle"
                          fontSize={Math.min(8, radius * 0.4)}
                          fill="white"
                          fontWeight="500"
                          opacity={0.8}
                        >
                          {format(value)}
                        </text>
                      )}
                    </g>
                  );
                })
              )}

              {/* ─── X-AXIS TICK LABELS ─── */}
              {xTicks.map((x, i) => {
                const xPos = xScale(x);
                if (xPos < 5 || xPos > boundsWidth - 5) return null;
                
                const isLastYear = i === xTicks.length - 1;
                
                return (
                  <text
                    key={`x-label-${i}`}
                    x={xPos}
                    y={boundsHeight + 18}
                    textAnchor="middle"
                    fontSize={Math.max(9, fontSize * 0.8)}
                    fill={isLastYear ? "#1a1a2e" : "#94a3b8"}
                    fontWeight={isLastYear ? "600" : "400"}
                  >
                    {x}
                  </text>
                );
              })}

              {/* ─── X-AXIS LABEL ─── */}
              <text
                x={boundsWidth / 2}
                y={boundsHeight + 40}
                textAnchor="middle"
                fontSize={fontSize * 0.7}
                fill="#94a3b8"
                letterSpacing="0.08em"
                className="uppercase"
              >
                Year
              </text>

              {/* ─── Y-AXIS TICK LABELS ─── */}
              {metricRows.map((metric) => {
                const yPos = yScale(metric) ?? 0;
                const isLast = metric === metricRows[metricRows.length - 1];
                
                return (
                  <text
                    key={`y-label-${metric}`}
                    x={-14}
                    y={yPos + yScale.bandwidth() / 2 + 4}
                    textAnchor="end"
                    fontSize={Math.max(9, fontSize * 0.85)}
                    fill={isLast ? "#1a1a2e" : "#475569"}
                    fontWeight={isLast ? "600" : "500"}
                  >
                    {metric}
                  </text>
                );
              })}

              {/* ─── Y-AXIS LABEL ─── */}
              <text
                transform="rotate(-90)"
                x={-boundsHeight / 2}
                y={-(responsiveMargin.left - 10)}
                textAnchor="middle"
                fontSize={fontSize * 0.7}
                fill="#94a3b8"
                letterSpacing="0.08em"
                className="uppercase"
              >
                Livelihood Dimension
              </text>
            </g>
          </svg>

          {/* ─── TOOLTIP ─── */}
          {hoveredPoint && !isMobile && (
            <div
              className="absolute rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg pointer-events-none z-10"
              style={{
                left: Math.min(
                  hoveredPoint.x + responsiveMargin.left + 14,
                  width - 170
                ),
                top: Math.min(
                  hoveredPoint.y + responsiveMargin.top - 10,
                  height - 90
                ),
                maxWidth: Math.min(190, width - 40),
              }}
            >
              <div className="font-semibold text-slate-900 text-sm">
                {hoveredPoint.metric}
              </div>
              <div className="text-slate-500 text-[10px]">{hoveredPoint.year}</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {format(hoveredPoint.value)}
              </div>
            </div>
          )}

          {/* ─── MOBILE TOOLTIP ─── */}
          {hoveredPoint && isMobile && (
            <div className="mt-3 text-center bg-white border border-slate-200 rounded-lg p-3 mx-2 shadow-sm">
              <div className="font-semibold text-xs text-slate-900">{hoveredPoint.metric}</div>
              <div className="text-xs text-slate-500">{hoveredPoint.year}</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
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
