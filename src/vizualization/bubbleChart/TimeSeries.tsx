"use client";

import { scaleLinear } from "d3-scale";
import { line, curveCardinal, area } from "d3-shape";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { LineItem } from "@/vizualization/lineChart/LineItem";

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

const MARGIN = { top: 70, right: 130, bottom: 100, left: 100 };

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
  // title = "Livelihood & Economic Resilience Trends",
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
      return { top: 50, right: 20, bottom: 70, left: 60 };
    }
    if (width < 600) {
      return { top: 60, right: 30, bottom: 80, left: 75 };
    }
    if (width < 768) {
      return { top: 65, right: 40, bottom: 90, left: 85 };
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

  // ─── Scales ───
  const xScale = useMemo(() => {
    const years = data.map((d) => d.year);
    return scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, boundsWidth]);
  }, [data, boundsWidth]);

  const yScale = useMemo(() => {
    let maxValue = 0;

    data.forEach((d) => {
      METRICS.forEach((m) => {
        if (visibleMetrics.has(m.key)) {
          maxValue = Math.max(maxValue, d[m.key as keyof DataPoint] as number);
        }
      });
    });

    return scaleLinear()
      .domain([0, maxValue * 1.1 || 1])
      .range([boundsHeight, 0])
      .nice();
  }, [data, boundsHeight, visibleMetrics]);

  // ─── Paths ───
  const linePaths = useMemo(() => {
    const paths: Record<string, string> = {};

    METRICS.forEach((m) => {
      if (!visibleMetrics.has(m.key)) return;

      const gen = line<DataPoint>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d[m.key as keyof DataPoint] as number))
        .curve(curveCardinal.tension(0.7));

      paths[m.key] = gen(data) || "";
    });

    return paths;
  }, [data, xScale, yScale, visibleMetrics]);

  const areaPaths = useMemo(() => {
    const paths: Record<string, string> = {};

    METRICS.forEach((m) => {
      if (!visibleMetrics.has(m.key)) return;

      const gen = area<DataPoint>()
        .x((d) => xScale(d.year))
        .y0(boundsHeight)
        .y1((d) => d[m.key as keyof DataPoint] as number)
        .curve(curveCardinal.tension(0.7));

      paths[m.key] = gen(data) || "";
    });

    return paths;
  }, [data, xScale, yScale, boundsHeight, visibleMetrics]);

  // ─── Dynamic ticks based on available space ───
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

  const yTicks = useMemo(() => {
    const max = yScale.domain()[1];
    const count = width < 500 ? 3 : 5;
    return Array.from({ length: count }, (_, i) => (max / (count - 1)) * i);
  }, [yScale, width]);

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
  const titleFontSize = getFontSize(16);
  const legendFontSize = getFontSize(11);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center ${className}`}>
      <div className="w-full max-w-4xl px-2 sm:px-4">
        {/* ─── HEADER ─── */}
        <div className="mb-5 text-center">
          {/* <h3 
            className="font-medium text-slate-800"
            style={{ fontSize: titleFontSize }}
          >
            {title}
          </h3> */}
          {subtitle && (
            <p 
              className="text-slate-500 mt-1"
              style={{ fontSize: fontSize * 0.85 }}
            >
              {subtitle}
            </p>
          )}
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
              {/* GRID */}
              {yTicks.map((v, i) => (
                <line
                  key={`grid-y-${i}`}
                  x1={0}
                  x2={boundsWidth}
                  y1={yScale(v)}
                  y2={yScale(v)}
                  stroke="#f1f5f9"
                  strokeDasharray="4 4"
                  strokeWidth={0.5}
                />
              ))}

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

              {/* LINES */}
              {METRICS.map((m) =>
                visibleMetrics.has(m.key) ? (
                  <LineItem
                    key={m.key}
                    path={linePaths[m.key]}
                    color={m.color}
                    strokeWidth={Math.max(1.5, Math.min(2.5, width / 200))}
                    opacity={0.8}
                    onHover={() => {}}
                  />
                ) : null
              )}

              {/* POINTS */}
              {data.map((d) =>
                METRICS.map((m) => {
                  if (!visibleMetrics.has(m.key)) return null;

                  const v = d[m.key as keyof DataPoint] as number;
                  const x = xScale(d.year);
                  const y = yScale(v);
                  const isActive = hoveredPoint?.metric === m.label && hoveredPoint?.year === d.year;
                  const pointRadius = isActive 
                    ? Math.max(4, Math.min(6, width / 120))
                    : Math.max(2, Math.min(3.5, width / 180));

                  return (
                    <circle
                      key={`${m.key}-${d.year}`}
                      cx={x}
                      cy={y}
                      r={pointRadius}
                      fill={isActive ? m.color : m.color}
                      stroke="#fff"
                      strokeWidth={isActive ? 2 : 1.5}
                      opacity={isActive ? 1 : 0.5}
                      onMouseEnter={() =>
                        setHoveredPoint({
                          metric: m.label,
                          year: d.year,
                          value: v,
                          x,
                          y,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                      className={!isTouchDevice ? "cursor-pointer" : ""}
                    />
                  );
                })
              )}

              {/* AXIS LABELS */}
              <text
                x={boundsWidth / 2}
                y={boundsHeight + (width < 500 ? 30 : 40)}
                textAnchor="middle"
                fontSize={fontSize * 0.85}
                fill="#94a3b8"
              >
                Year
              </text>

              <text
                transform="rotate(-90)"
                x={-boundsHeight / 2}
                y={-(width < 500 ? 35 : 50)}
                textAnchor="middle"
                fontSize={fontSize * 0.85}
                fill="#94a3b8"
              >
                Value
              </text>

              {/* X-AXIS TICK LABELS */}
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

              {/* Y-AXIS TICK LABELS */}
              {yTicks.map((v, i) => {
                const yPos = yScale(v);
                if (yPos < 5 || yPos > boundsHeight - 5) return null;
                
                return (
                  <text
                    key={`y-label-${i}`}
                    x={-6}
                    y={yPos + 3}
                    textAnchor="end"
                    fontSize={Math.max(7, fontSize * 0.7)}
                    fill="#94a3b8"
                  >
                    {format(v)}
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
