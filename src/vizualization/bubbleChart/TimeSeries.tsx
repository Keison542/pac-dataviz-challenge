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

const MARGIN = { top: 60, right: 40, bottom: 80, left: 170 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    unit: "t/ha",
    color: "#1a1a2e",
    lightColor: "#e8e8ee",
    darkColor: "#0f0f1a",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    unit: "tons",
    color: "#4a4a6a",
    lightColor: "#e0e0e8",
    darkColor: "#2a2a4a",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    unit: "",
    color: "#94a3b8",
    lightColor: "#eef0f3",
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
      return { top: 35, right: 10, bottom: 55, left: 100 };
    }
    if (width < 600) {
      return { top: 40, right: 15, bottom: 65, left: 120 };
    }
    if (width < 768) {
      return { top: 45, right: 20, bottom: 70, left: 140 };
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

  const yScale = useMemo(() => {
    return scaleBand()
      .domain(metricRows)
      .range([0, boundsHeight])
      .padding(0.5);
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

    const maxRadius = Math.min(
      width < 500 ? 18 : width < 768 ? 22 : 28,
      yScale.bandwidth() * 0.4
    );
    return scaleSqrt()
      .domain([0, maxValue || 1])
      .range([4, Math.max(6, maxRadius)]);
  }, [data, visibleMetrics, width, yScale]);

  // ─── Dynamic ticks ───
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
          <p className="text-slate-400 text-sm">Loading chart...</p>
        </div>
      </div>
    );
  }

  const fontSize = getFontSize(12);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center ${className}`}>
      <div className="w-full max-w-5xl px-3 sm:px-6">
        {/* ─── NARRATIVE HEADER ─── */}
        <div className="mb-6 text-center">
          <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-500 tracking-wider uppercase mb-2">
            Pacific Climate Resilience
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-light text-slate-800 tracking-tight">
            Structural System <span className="font-semibold text-slate-900">Shift</span>
          </h3>
          <div className="w-12 h-0.5 bg-slate-300 mx-auto mt-3 mb-3" />
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Long-term socioeconomic indicators reveal how climate pressure gradually reshapes
            national economic structures and adaptive capacity across the Pacific.
          </p>
          <p className="text-[11px] text-slate-400 max-w-2xl mx-auto leading-relaxed mt-2">
            <span className="font-medium text-slate-500">↕ Circle size</span> represents economic importance or production value.
            <span className="hidden sm:inline"> Patterns reveal how resilience shifted across food production, livelihood assets and tourism.</span>
          </p>
        </div>

        {/* ─── LEGEND ─── */}
        <div className="flex flex-wrap gap-3 mb-5 justify-center">
          {METRICS.map((m) => {
            const isVisible = visibleMetrics.has(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className="group flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-all duration-200 text-[10px] sm:text-xs font-medium hover:scale-105 active:scale-95"
                style={{
                  borderColor: isVisible ? m.color : "#e2e8f0",
                  color: isVisible ? m.color : "#94a3b8",
                  background: isVisible ? "white" : "#f8fafc",
                  boxShadow: isVisible ? `0 2px 8px ${m.color}15` : 'none',
                }}
              >
                <span 
                  className="w-3 h-3 rounded-full transition-all duration-200"
                  style={{ 
                    background: m.color,
                    opacity: isVisible ? 1 : 0.3,
                    transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                  }}
                />
                <span className="whitespace-nowrap">{m.label}</span>
                {isVisible && (
                  <span className="text-[8px] opacity-50">●</span>
                )}
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
            <defs>
              {/* Gradient for the chart background */}
              <linearGradient id="chartBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fafbfc" stopOpacity="1" />
                <stop offset="100%" stopColor="#f1f4f8" stopOpacity="1" />
              </linearGradient>
              {/* Glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width={width} height={height} fill="url(#chartBg)" rx={8} />

            <g transform={`translate(${responsiveMargin.left},${responsiveMargin.top})`}>
              {/* ─── SUBTLE BACKGROUND ROWS ─── */}
              {metricRows.map((row, index) => {
                const yPos = yScale(row) ?? 0;
                const metric = METRICS.find(m => m.label === row);
                return (
                  <rect
                    key={`bg-${row}`}
                    x={0}
                    y={yPos}
                    width={boundsWidth}
                    height={yScale.bandwidth()}
                    fill={metric?.lightColor || (index % 2 === 0 ? "#f8fafc" : "transparent")}
                    rx={4}
                    opacity={0.5}
                  />
                );
              })}

              {/* ─── HORIZONTAL GRID LINES ─── */}
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

              {/* ─── VERTICAL GRID LINES ─── */}
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
                    strokeDasharray="3 4"
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* ─── CONNECTING LINES ─── */}
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
                    strokeWidth={2}
                    strokeOpacity={0.12}
                    strokeDasharray="4 4"
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

                  const metricConfig = METRICS.find(m => m.label === metric.label);
                  const color = metricConfig?.color || '#94a3b8';

                  return (
                    <g key={`${metric.key}-${d.year}`}>
                      {/* Outer glow ring */}
                      {isActive && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius + 8}
                          fill="none"
                          stroke={color}
                          strokeWidth={1}
                          opacity={0.15}
                        />
                      )}
                      {/* Shadow */}
                      <circle
                        cx={cx + 1}
                        cy={cy + 2}
                        r={radius}
                        fill="black"
                        opacity={0.06}
                      />
                      {/* Main circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={color}
                        opacity={isActive ? 0.95 : 0.7}
                        stroke="white"
                        strokeWidth={isActive ? 2.5 : 1.5}
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
                        className={!isTouchDevice ? "cursor-pointer transition-all duration-200" : ""}
                        style={{
                          filter: isActive ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' : 'none',
                          transform: isActive ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: `${cx}px ${cy}px`,
                        }}
                      />
                      {/* Value label inside bubble if large enough */}
                      {radius > 14 && (
                        <text
                          x={cx}
                          y={cy + 3}
                          textAnchor="middle"
                          fontSize={Math.min(9, radius * 0.4)}
                          fill="white"
                          fontWeight="600"
                          opacity={0.9}
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
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
                    y={boundsHeight + 22}
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
                y={boundsHeight + 48}
                textAnchor="middle"
                fontSize={fontSize * 0.75}
                fill="#94a3b8"
                letterSpacing="0.12em"
                className="uppercase font-medium"
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
                    x={-16}
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
                y={-(responsiveMargin.left - 15)}
                textAnchor="middle"
                fontSize={fontSize * 0.75}
                fill="#94a3b8"
                letterSpacing="0.12em"
                className="uppercase font-medium"
              >
                Livelihood Dimension
              </text>
            </g>
          </svg>

          {/* ─── TOOLTIP ─── */}
          {hoveredPoint && !isMobile && (
            <div
              className="absolute rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm p-3.5 text-xs shadow-xl pointer-events-none z-10 transition-all duration-150"
              style={{
                left: Math.min(
                  hoveredPoint.x + responsiveMargin.left + 16,
                  width - 180
                ),
                top: Math.min(
                  hoveredPoint.y + responsiveMargin.top - 10,
                  height - 100
                ),
                maxWidth: Math.min(200, width - 40),
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ 
                    background: METRICS.find(m => m.label === hoveredPoint.metric)?.color || '#94a3b8'
                  }}
                />
                <span className="font-semibold text-slate-900 text-sm">
                  {hoveredPoint.metric}
                </span>
              </div>
              <div className="text-slate-500 text-[10px] font-medium tracking-wide">
                {hoveredPoint.year}
              </div>
              <div className="text-base font-bold text-slate-800 mt-1">
                {format(hoveredPoint.value)}
              </div>
            </div>
          )}

          {/* ─── MOBILE TOOLTIP ─── */}
          {hoveredPoint && isMobile && (
            <div className="mt-3 text-center bg-white border border-slate-200 rounded-xl p-3 mx-2 shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ 
                    background: METRICS.find(m => m.label === hoveredPoint.metric)?.color || '#94a3b8'
                  }}
                />
                <span className="font-semibold text-xs text-slate-900">{hoveredPoint.metric}</span>
              </div>
              <div className="text-xs text-slate-500">{hoveredPoint.year}</div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {format(hoveredPoint.value)}
              </div>
            </div>
          )}
        </div>

        {/* ─── FOOTER NOTE ─── */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-400 tracking-wide">
            Hover over bubbles for details · Click legend to toggle dimensions
          </p>
        </div>
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
