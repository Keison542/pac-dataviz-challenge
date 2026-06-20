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

const MARGIN = { top: 60, right: 60, bottom: 80, left: 140 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    unit: "t/ha",
    color: "#1a1a2e",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    unit: "tons",
    color: "#4a4a6a",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    unit: "",
    color: "#94a3b8",
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
      return { top: 40, right: 20, bottom: 60, left: 90 };
    }
    if (width < 600) {
      return { top: 50, right: 30, bottom: 70, left: 110 };
    }
    if (width < 768) {
      return { top: 55, right: 40, bottom: 75, left: 120 };
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

  // Y-scale with more padding between rows
  const yScale = useMemo(() => {
    return scaleBand()
      .domain(metricRows)
      .range([0, boundsHeight])
      .padding(0.5); // Increased padding for more breathing room
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

    // Smaller max radius to prevent crowding
    const maxRadius = width < 500 ? 14 : width < 768 ? 18 : 22;
    return scaleSqrt()
      .domain([0, maxValue || 1])
      .range([2, maxRadius]);
  }, [data, visibleMetrics, width]);

  // ─── Dynamic ticks ───
  const xTicks = useMemo(() => {
    const years = data.map((d) => d.year);
    const min = Math.min(...years);
    const max = Math.max(...years);
    
    // Fewer ticks to reduce crowding
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
  const legendFontSize = getFontSize(11);
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
        <div className="flex flex-wrap gap-3 mb-4 justify-center">
          {METRICS.map((m) => {
            const isVisible = visibleMetrics.has(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[10px] sm:text-xs"
                style={{
                  borderColor: isVisible ? m.color : "#e2e8f0",
                  color: isVisible ? m.color : "#94a3b8",
                  background: isVisible ? "white" : "#f8fafc",
                }}
              >
                <span 
                  className="w-2 h-2 rounded-full"
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
                    fill={isEven ? "#fafafa" : "transparent"}
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

              {/* ─── GRID - Vertical lines ─── */}
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
                    strokeDasharray="4 4"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* ─── BUBBLES ─── */}
              {data.map((d) =>
                METRICS.map((metric) => {
                  if (!visibleMetrics.has(metric.key)) return null;

                  const value = d[metric.key as keyof DataPoint] as number;
                  // Skip zero values to reduce clutter
                  if (value === 0) return null;

                  const cx = xScale(d.year);
                  const cy = (yScale(metric.label) ?? 0) + yScale.bandwidth() / 2;

                  const isActive =
                    hoveredPoint?.metric === metric.label &&
                    hoveredPoint?.year === d.year;

                  const radius = radiusScale(value);
                  
                  // Only render if radius is big enough to see
                  if (radius < 1.5) return null;

                  return (
                    <circle
                      key={`${metric.key}-${d.year}`}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={metric.color}
                      opacity={isActive ? 1 : 0.5}
                      stroke={isActive ? "#0f172a" : "white"}
                      strokeWidth={isActive ? 2 : 0.5}
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
                        transition: 'all 0.15s ease',
                        filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none',
                      }}
                    />
                  );
                })
              )}

              {/* ─── X-AXIS TICK LABELS ─── */}
              {xTicks.map((x, i) => {
                const xPos = xScale(x);
                if (xPos < 5 || xPos > boundsWidth - 5) return null;
                
                // Highlight the most recent year
                const isLastYear = i === xTicks.length - 1;
                
                return (
                  <text
                    key={`x-label-${i}`}
                    x={xPos}
                    y={boundsHeight + 20}
                    textAnchor="middle"
                    fontSize={Math.max(8, fontSize * 0.75)}
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
                y={boundsHeight + 42}
                textAnchor="middle"
                fontSize={fontSize * 0.7}
                fill="#94a3b8"
                letterSpacing="0.05em"
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
                    x={-12}
                    y={yPos + yScale.bandwidth() / 2 + 4}
                    textAnchor="end"
                    fontSize={Math.max(8, fontSize * 0.8)}
                    fill="#475569"
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
                y={-(responsiveMargin.left - 15)}
                textAnchor="middle"
                fontSize={fontSize * 0.7}
                fill="#94a3b8"
                letterSpacing="0.05em"
                className="uppercase"
              >
                Livelihood Dimension
              </text>
            </g>
          </svg>

          {/* ─── TOOLTIP ─── */}
          {hoveredPoint && !isMobile && (
            <div
              className="absolute rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3 text-xs shadow-lg pointer-events-none z-10"
              style={{
                left: Math.min(
                  hoveredPoint.x + responsiveMargin.left + 12,
                  width - 160
                ),
                top: Math.min(
                  hoveredPoint.y + responsiveMargin.top - 10,
                  height - 80
                ),
                maxWidth: Math.min(180, width - 40),
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
            <div className="mt-3 text-center bg-white border border-slate-200 rounded-lg p-2.5 mx-2 shadow-sm">
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
