"use client";

import { scaleLinear } from "d3-scale";
import { line, curveCardinal, area } from "d3-shape";
import { useMemo, useState, useCallback } from "react";
import { LineItem } from "@/vizualization/lineChart/LineItem";

type DataPoint = {
  year: number;
  cropYield: number;
  livestockYield: number;
  touristArrivals: number;
};

type Props = {
  width: number;
  height: number;
  data: DataPoint[];
  selectedCountry: string;
  title?: string;
  insight?: string;
};

const MARGIN = { top: 70, right: 130, bottom: 100, left: 100 };

const METRICS = [
  {
    key: "cropYield",
    label: "Food Production",
    unit: "t/ha",
    color: "#10b981",
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
  width,
  height,
  data,
  selectedCountry,
  title = "Livelihood & Economic Resilience Trends",
  insight,
}: Props) {

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

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const toggleMetric = useCallback((key: string) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  // =========================
  // SCALE
  // =========================
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

  // =========================
  // PATHS
  // =========================
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
    for (let y = min; y <= max; y += 10) ticks.push(y);

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

  if (!data.length) return null;

  return (
    <div className="w-full flex flex-col items-center">

      {/* =========================
          HEADER
      ========================== */}
      <div className="mb-4 text-center">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <p className="text-xs text-slate-500 mt-1">{insight}</p>
      </div>

      {/* =========================
          LEGEND
      ========================== */}
      <div className="flex gap-2 flex-wrap mb-4">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className="px-2 py-1 text-xs rounded-full border"
            style={{
              borderColor: visibleMetrics.has(m.key) ? m.color : "#e2e8f0",
              color: visibleMetrics.has(m.key) ? m.color : "#94a3b8",
              background: visibleMetrics.has(m.key) ? m.color + "10" : "white",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* =========================
          CHART
      ========================== */}
      <div className="relative">
        <svg width={width} height={height}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* GRID */}
            {yTicks.map((v, i) => (
              <line
                key={i}
                x1={0}
                x2={boundsWidth}
                y1={yScale(v)}
                y2={yScale(v)}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
            ))}

            {xTicks.map((x, i) => (
              <line
                key={i}
                x1={xScale(x)}
                x2={xScale(x)}
                y1={0}
                y2={boundsHeight}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
            ))}

            {/* LINES */}
            {METRICS.map((m) =>
              visibleMetrics.has(m.key) ? (
                <LineItem
                  key={m.key}
                  path={linePaths[m.key]}
                  color={m.color}
                  strokeWidth={2.5}
                  opacity={0.9}
                  onHover={() => {}}
                />
              ) : null
            )}

            {/* POINTS (now interactive tooltip-aware) */}
            {data.map((d) =>
              METRICS.map((m) => {
                if (!visibleMetrics.has(m.key)) return null;

                const v = d[m.key as keyof DataPoint] as number;
                const x = xScale(d.year);
                const y = yScale(v);

                return (
                  <circle
                    key={`${m.key}-${d.year}`}
                    cx={x}
                    cy={y}
                    r={4}
                    fill={m.color}
                    stroke="#fff"
                    strokeWidth={2}
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
                  />
                );
              })
            )}

            {/* AXIS LABELS */}
            <text
              x={boundsWidth / 2}
              y={boundsHeight + 60}
              textAnchor="middle"
              fontSize={12}
              fill="#64748b"
            >
              Year
            </text>

            <text
              transform="rotate(-90)"
              x={-boundsHeight / 2}
              y={-70}
              textAnchor="middle"
              fontSize={12}
              fill="#64748b"
            >
              Value
            </text>

          </g>
        </svg>

        {/* =========================
            TOOLTIP
        ========================== */}
        {hoveredPoint && (
          <div
            className="absolute bg-white border shadow-md rounded p-2 text-xs"
            style={{
              left: hoveredPoint.x + 60,
              top: hoveredPoint.y + 40,
              pointerEvents: "none",
            }}
          >
            <div className="font-semibold">{hoveredPoint.metric}</div>
            <div>{hoveredPoint.year}</div>
            <div className="text-sm font-bold">
              {format(hoveredPoint.value)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeSeriesDashboard;
