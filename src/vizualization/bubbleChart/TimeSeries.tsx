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

const MARGIN = { top: 70, right: 130, bottom: 100, left: 120 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    unit: "t/ha",
    color: "#475569",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    unit: "tons",
    color: "#94a3b8",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    unit: "",
    color: "#cbd5e1",
  },
];

export function TimeSeriesDashboard({
  width: propWidth,
  height: propHeight,
  data,
  selectedCountry,
  subtitle,
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
        const height = propHeight || Math.min(rect.width * 0.6, 500);
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
      return { top: 50, right: 20, bottom: 70, left: 70 };
    }
    if (width < 600) {
      return { top: 60, right: 30, bottom: 80, left: 85 };
    }
    if (width < 768) {
      return { top: 65, right: 40, bottom: 90, left: 95 };
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
    if (width < 400) return base * 0.55;
    if (width < 600) return base * 0.7;
    if (width < 768) return base * 0.85;
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

  const yScale = useMemo(() => {
    return scaleBand()
      .domain(metricRows)
      .range([0, boundsHeight])
      .padding(0.4);
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

    const maxRadius = width < 500 ? 18 : width < 768 ? 22 : 28;
    return scaleSqrt()
      .domain([0, maxValue || 1])
      .range([3, maxRadius]);
  }, [data, visibleMetrics, width]);

  // ─── Dynamic ticks ───
  const xTicks = useMemo(() => {
    const years = data.map((d) => d.year);
    const min = Math.min(...years);
    const max = Math.max(...years);
    
    const maxTicks = width < 500 ? 3 : width < 768 ? 4 : 6;
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
        <div className="mb-5 text-center">
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Larger circles indicate periods where livelihood
            systems carried greater economic importance or
            production value. Patterns reveal how resilience
            shifted across food production, livelihood assets
            and tourism.
          </p>
        </div>

        {/* ─── LEGEND ─── */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border transition-all text-[10px] sm:text-xs"
              style={{
                borderColor: visibleMetrics.has(m.key) ? m.color : "#e2e8f0",
                color: visibleMetrics.has(m.key) ? m.color : "#94a3b8",
                background: visibleMetrics.has(m.key) ? m.color + "10" : "white",
              }}
            >
              <span className="whitespace-nowrap">{m.label}</span>
            </button>
          ))}
        </div>

        {/* ─── CHART ─── */}
        <div className="relative w-full overflow-hidden">
          <svg 
            width={width} 
            height={height} 
            className="block"
            viewBox={width && height ? `0 0 ${width} ${height}` : undefined}
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            <g transform={`translate(${responsiveMargin.left},${responsiveMargin.top})`}>
              {/* GRID - Horizontal lines for each metric row */}
              {metricRows.map((row) => {
                const yPos = yScale(row) ?? 0;
                return (
                  <line
                    key={`grid-${row}`}
                    x1={0}
                    x2={boundsWidth}
                    y1={yPos + yScale.bandwidth() / 2}
                    y2={yPos + yScale.bandwidth() / 2}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* GRID - Vertical lines for years */}
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
              {data.flatMap((d) =>
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

                  return (
                    <circle
                      key={`${metric.key}-${d.year}`}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill={metric.color}
                      opacity={isActive ? 0.95 : 0.65}
                      stroke={isActive ? "#0f172a" : "white"}
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
                      className={!isTouchDevice ? "cursor-pointer transition-all" : ""}
                      style={{
                        transition: 'all 0.2s ease',
                      }}
                    />
                  );
                })
              )}

              {/* ─── X-AXIS LABEL ─── */}
              <text
                x={boundsWidth / 2}
                y={boundsHeight + (width < 500 ? 30 : 40)}
                textAnchor="middle"
                fontSize={fontSize * 0.85}
                fill="#94a3b8"
              >
                Year
              </text>

              {/* ─── Y-AXIS LABEL ─── */}
              <text
                transform="rotate(-90)"
                x={-boundsHeight / 2}
                y={-(width < 500 ? 50 : 65)}
                textAnchor="middle"
                fontSize={fontSize * 0.85}
                fill="#94a3b8"
              >
                Livelihood Dimension
              </text>

              {/* ─── X-AXIS TICK LABELS ─── */}
              {xTicks.map((x, i) => {
                const xPos = xScale(x);
                if (xPos < 5 || xPos > boundsWidth - 5) return null;
                
                return (
                  <text
                    key={`x-label-${i}`}
                    x={xPos}
                    y={boundsHeight + (width < 500 ? 18 : 20)}
                    textAnchor="middle"
                    fontSize={Math.max(7, fontSize * 0.7)}
                    fill="#94a3b8"
                  >
                    {x}
                  </text>
                );
              })}

              {/* ─── Y-AXIS TICK LABELS ─── */}
              {metricRows.map((metric) => {
                const yPos = yScale(metric) ?? 0;
                return (
                  <text
                    key={`y-label-${metric}`}
                    x={-10}
                    y={yPos + yScale.bandwidth() / 2 + 4}
                    textAnchor="end"
                    fontSize={Math.max(7, fontSize * 0.8)}
                    fill="#475569"
                    fontWeight="500"
                  >
                    {metric}
                  </text>
                );
              })}
            </g>
          </svg>

          {/* ─── TOOLTIP ─── */}
          {hoveredPoint && !isMobile && (
            <div
              className="absolute rounded border border-slate-200 bg-white p-2 sm:p-3 text-xs shadow-sm pointer-events-none z-10"
              style={{
                left: Math.min(
                  hoveredPoint.x + responsiveMargin.left + 10,
                  width - 160
                ),
                top: Math.min(
                  hoveredPoint.y + responsiveMargin.top + 10,
                  height - 80
                ),
                maxWidth: Math.min(180, width - 40),
              }}
            >
              <div className="font-medium text-slate-900">
                {hoveredPoint.metric}
              </div>
              <div className="text-slate-500">{hoveredPoint.year}</div>
              <div className="text-sm font-medium text-slate-800">
                {format(hoveredPoint.value)}
              </div>
            </div>
          )}

          {/* ─── MOBILE TOOLTIP ─── */}
          {hoveredPoint && isMobile && (
            <div className="mt-2 text-center bg-white border border-slate-200 rounded p-2 mx-2">
              <div className="font-medium text-xs text-slate-900">{hoveredPoint.metric}</div>
              <div className="text-xs text-slate-500">{hoveredPoint.year}</div>
              <div className="text-sm font-medium text-slate-800">
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
