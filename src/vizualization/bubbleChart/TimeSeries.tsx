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
  insight?: string;
  className?: string;
};

const MARGIN = { top: 70, right: 130, bottom: 100, left: 100 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    unit: "t/ha",
    color: "#4f6dc0",
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    unit: "tons",
    color: "#f59e0b",
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    unit: "",
    color: "#14b8a6",
  },
];

export function TimeSeriesDashboard({
  width: propWidth,
  height: propHeight,
  data,
  selectedCountry,
  title = "Livelihood & Economic Resilience Trends",
  insight,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const toggleMetric = useCallback((key: string) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  // ─── Responsive font sizes ───
  const getFontSize = useCallback((base: number) => {
    if (width < 400) return base * 0.6;
    if (width < 600) return base * 0.8;
    if (width < 800) return base * 0.9;
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

  const xTicks = useMemo(() => {
    const years = data.map((d) => d.year);
    const min = Math.min(...years);
    const max = Math.max(...years);

    const ticks: number[] = [];
    const step = Math.max(1, Math.floor((max - min) / 6));
    for (let y = min; y <= max; y += step) ticks.push(y);
    if (ticks[ticks.length - 1] !== max) ticks.push(max);

    return ticks;
  }, [data]);

  const yTicks = useMemo(() => {
    const max = yScale.domain()[1];
    return Array.from({ length: 5 }, (_, i) => (max / 4) * i);
  }, [yScale]);

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
  const titleFontSize = getFontSize(14);
  const legendFontSize = getFontSize(11);

  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center ${className}`}>
      {/* ─── HEADER ─── */}
      <div className="mb-4 text-center w-full px-4">
        <h2 
          className="font-semibold text-slate-700"
          style={{ fontSize: titleFontSize }}
        >
          {title}
        </h2>
        {insight && (
          <p 
            className="text-slate-500 mt-1"
            style={{ fontSize: fontSize * 0.85 }}
          >
            {insight}
          </p>
        )}
      </div>

      {/* ─── LEGEND ─── */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 justify-center px-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className="px-2 sm:px-3 py-1 rounded-full border transition-all"
            style={{
              fontSize: legendFontSize,
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
      <div className="relative w-full overflow-x-auto">
        <svg 
          width={width} 
          height={height} 
          className="block"
          viewBox={width && height ? `0 0 ${width} ${height}` : undefined}
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* GRID */}
            {yTicks.map((v, i) => (
              <line
                key={`grid-y-${i}`}
                x1={0}
                x2={boundsWidth}
                y1={yScale(v)}
                y2={yScale(v)}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth={0.5}
              />
            ))}

            {xTicks.map((x, i) => (
              <line
                key={`grid-x-${i}`}
                x1={xScale(x)}
                x2={xScale(x)}
                y1={0}
                y2={boundsHeight}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth={0.5}
              />
            ))}

            {/* LINES */}
            {METRICS.map((m) =>
              visibleMetrics.has(m.key) ? (
                <LineItem
                  key={m.key}
                  path={linePaths[m.key]}
                  color={m.color}
                  strokeWidth={Math.max(1.5, Math.min(3, width / 200))}
                  opacity={0.9}
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
                const pointRadius = Math.max(2.5, Math.min(5, width / 150));

                return (
                  <circle
                    key={`${m.key}-${d.year}`}
                    cx={x}
                    cy={y}
                    r={pointRadius}
                    fill={m.color}
                    stroke="#fff"
                    strokeWidth={Math.max(1, Math.min(2, width / 400))}
                    opacity={0.8}
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
                    className="cursor-pointer"
                  />
                );
              })
            )}

            {/* AXIS LABELS */}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 40}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#64748b"
            >
              Year
            </text>

            <text
              transform="rotate(-90)"
              x={-boundsHeight / 2}
              y={-50}
              textAnchor="middle"
              fontSize={fontSize}
              fill="#64748b"
            >
              Value
            </text>

            {/* X-AXIS TICK LABELS */}
            {xTicks.map((x, i) => {
              const xPos = xScale(x);
              // Skip if too close to edge
              if (xPos < 10 || xPos > boundsWidth - 10) return null;
              
              return (
                <text
                  key={`x-label-${i}`}
                  x={xPos}
                  y={boundsHeight + 20}
                  textAnchor="middle"
                  fontSize={fontSize * 0.8}
                  fill="#94a3b8"
                >
                  {x}
                </text>
              );
            })}

            {/* Y-AXIS TICK LABELS */}
            {yTicks.map((v, i) => {
              const yPos = yScale(v);
              if (yPos < 10 || yPos > boundsHeight - 10) return null;
              
              return (
                <text
                  key={`y-label-${i}`}
                  x={-8}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize={fontSize * 0.8}
                  fill="#94a3b8"
                >
                  {format(v)}
                </text>
              );
            })}
          </g>
        </svg>

        {/* ─── TOOLTIP ─── */}
        {hoveredPoint && (
          <div
            className="absolute bg-white border shadow-lg rounded-lg p-2 sm:p-3 text-xs sm:text-sm pointer-events-none z-10"
            style={{
              left: Math.min(
                hoveredPoint.x + MARGIN.left + 20,
                width - 150
              ),
              top: Math.min(
                hoveredPoint.y + MARGIN.top + 20,
                height - 80
              ),
              maxWidth: Math.min(200, width - 40),
            }}
          >
            <div className="font-semibold" style={{ color: "#0f172a" }}>
              {hoveredPoint.metric}
            </div>
            <div className="text-slate-500">{hoveredPoint.year}</div>
            <div className="text-sm sm:text-base font-bold text-slate-800">
              {format(hoveredPoint.value)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
