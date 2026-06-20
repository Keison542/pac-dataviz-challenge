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

const MARGIN = { top: 60, right: 50, bottom: 80, left: 70 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    unit: "t/ha",
    color: "#1a1a2e",
    lightColor: "#e8e8ee",
    gradient: ["#1a1a2e", "#4a4a6a"],
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    unit: "tons",
    color: "#4a4a6a",
    lightColor: "#e0e0e8",
    gradient: ["#4a4a6a", "#7a7a9a"],
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    unit: "",
    color: "#94a3b8",
    lightColor: "#eef0f3",
    gradient: ["#94a3b8", "#c0c8d0"],
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
        const height = propHeight || Math.min(rect.width * 0.55, 420);
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
      return { top: 40, right: 10, bottom: 60, left: 45 };
    }
    if (width < 600) {
      return { top: 45, right: 15, bottom: 65, left: 55 };
    }
    if (width < 768) {
      return { top: 50, right: 20, bottom: 70, left: 60 };
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

  // ─── Find max value for Y axis ───
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

  // ─── Generate line paths ───
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
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center ${className}`}>
      <div className="w-full max-w-4xl px-3 sm:px-6">
        {/* ─── NARRATIVE HEADER ─── */}
        <div className="mb-5 text-center">
          <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-500 tracking-wider uppercase mb-2">
            Pacific Climate Resilience
          </div>
          <h3 className="text-xl sm:text-2xl font-light text-slate-800 tracking-tight">
            Structural System <span className="font-semibold text-slate-900">Shift</span>
          </h3>
          <div className="w-12 h-0.5 bg-slate-300 mx-auto mt-3 mb-3" />
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Long-term trends in food production, livelihood assets, and income diversification
            reveal how climate pressure reshapes Pacific economic structures.
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
                  className="w-3 h-0.5 rounded-full transition-all duration-200"
                  style={{ 
                    background: m.color,
                    opacity: isVisible ? 1 : 0.3,
                    height: isVisible ? 3 : 2,
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
            <defs>
              <linearGradient id="chartBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fafbfc" stopOpacity="1" />
                <stop offset="100%" stopColor="#f1f4f8" stopOpacity="1" />
              </linearGradient>
              {METRICS.map((m) => (
                <linearGradient key={`gradient-${m.key}`} id={`gradient-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={m.color} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={m.color} stopOpacity="0.01" />
                </linearGradient>
              ))}
            </defs>

            <rect width={width} height={height} fill="url(#chartBg)" rx={8} />

            <g transform={`translate(${responsiveMargin.left},${responsiveMargin.top})`}>
              {/* ─── AREAS ─── */}
              {METRICS.map((m) => {
                if (!visibleMetrics.has(m.key)) return null;
                const areaGen = line<DataPoint>()
                  .x((d) => xScale(d.year))
                  .y(() => yScale(0))
                  .curve(curveMonotoneX);
                
                const areaData = data.map((d) => ({
                  ...d,
                  value: d[m.key as keyof DataPoint] as number || 0,
                }));

                const areaPath = areaGen(areaData) || "";
                const linePath = linePaths[m.key] || "";

                if (!linePath) return null;

                return (
                  <path
                    key={`area-${m.key}`}
                    d={`${linePath} L ${xScale(data[data.length - 1].year)} ${yScale(0)} L ${xScale(data[0].year)} ${yScale(0)} Z`}
                    fill={`url(#gradient-${m.key})`}
                    opacity={0.6}
                  />
                );
              })}

              {/* ─── HORIZONTAL GRID LINES ─── */}
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
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    strokeDasharray="4 4"
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
                    strokeWidth={0.5}
                    strokeDasharray="3 4"
                  />
                );
              })}

              {/* ─── LINES ─── */}
              {METRICS.map((m) => {
                if (!visibleMetrics.has(m.key)) return null;
                const path = linePaths[m.key];
                if (!path) return null;

                return (
                  <g key={`line-${m.key}`}>
                    {/* Glow line */}
                    <path
                      d={path}
                      fill="none"
                      stroke={m.color}
                      strokeWidth={4}
                      opacity={0.08}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Main line */}
                    <path
                      d={path}
                      fill="none"
                      stroke={m.color}
                      strokeWidth={2.5}
                      opacity={0.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}

              {/* ─── DOTS ─── */}
              {data.map((d) =>
                METRICS.map((m) => {
                  if (!visibleMetrics.has(m.key)) return null;

                  const value = d[m.key as keyof DataPoint] as number || 0;
                  if (value === 0) return null;

                  const cx = xScale(d.year);
                  const cy = yScale(value);

                  const isActive =
                    hoveredPoint?.metric === m.label &&
                    hoveredPoint?.year === d.year;

                  const dotRadius = isActive ? 7 : width < 500 ? 4 : 5;

                  return (
                    <g key={`${m.key}-${d.year}`}>
                      {/* Outer ring on hover */}
                      {isActive && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={dotRadius + 6}
                          fill="none"
                          stroke={m.color}
                          strokeWidth={1.5}
                          opacity={0.15}
                        />
                      )}
                      {/* Glow on hover */}
                      {isActive && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={dotRadius + 3}
                          fill={m.color}
                          opacity={0.15}
                        />
                      )}
                      {/* Main dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={dotRadius}
                        fill={isActive ? m.color : "white"}
                        stroke={m.color}
                        strokeWidth={isActive ? 2.5 : 2}
                        onMouseEnter={() =>
                          setHoveredPoint({
                            metric: m.label,
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
                          transform: isActive ? 'scale(1.15)' : 'scale(1)',
                          transformOrigin: `${cx}px ${cy}px`,
                        }}
                      />
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
              {yTicks.map((v, i) => {
                const yPos = yScale(v);
                if (yPos < 5 || yPos > boundsHeight - 5) return null;
                return (
                  <text
                    key={`y-label-${i}`}
                    x={-8}
                    y={yPos + 4}
                    textAnchor="end"
                    fontSize={Math.max(8, fontSize * 0.7)}
                    fill="#94a3b8"
                  >
                    {format(v)}
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
                Value
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
                  hoveredPoint.y + responsiveMargin.top - 60,
                  height - 100
                ),
                maxWidth: Math.min(200, width - 40),
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="w-2.5 h-0.5 rounded-full"
                  style={{ 
                    background: METRICS.find(m => m.label === hoveredPoint.metric)?.color || '#94a3b8',
                    height: 3,
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
                  className="w-2.5 h-0.5 rounded-full"
                  style={{ 
                    background: METRICS.find(m => m.label === hoveredPoint.metric)?.color || '#94a3b8',
                    height: 3,
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
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
