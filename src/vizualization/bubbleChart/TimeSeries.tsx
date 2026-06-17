// src/dataviz/bubbleChart/TimeSeries.tsx
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
    subLabel: "Crop yield stability",
    unit: "t/ha",
    color: "#10b981",
    lightColor: "#6ee7b7",
    format: (v: number) => v.toFixed(1),
    formatCompact: (v: number) => v.toFixed(1),
  },
  {
    key: "livestockYield",
    label: "Livelihood Assets",
    subLabel: "Livestock economy",
    unit: "tons",
    color: "#f59e0b",
    lightColor: "#fcd34d",
    format: (v: number) => v.toLocaleString(),
    formatCompact: (v: number) =>
      v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString(),
  },
  {
    key: "touristArrivals",
    label: "Income Diversification",
    subLabel: "Tourism-driven income",
    unit: "",
    color: "#14b8a6",
    lightColor: "#5eead4",
    format: (v: number) =>
      v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString(),
    formatCompact: (v: number) =>
      v >= 1_000_000
        ? `${(v / 1_000_000).toFixed(1)}M`
        : v >= 1000
        ? `${(v / 1000).toFixed(0)}K`
        : v.toString(),
  },
];

export function TimeSeriesDashboard({
  width,
  height,
  data,
  selectedCountry,
  title = "Livelihood & Economic Resilience Trends",
  insight = "This view shows how food systems, livelihood assets, and income diversification evolve over time under environmental and economic pressure.",
}: Props) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    metric: string;
    year: number;
    value: number;
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

  const seriesData = useMemo(() => {
    return METRICS.map((metric) => {
      const values = data.map((d) => d[metric.key as keyof DataPoint] as number);

      const total = values.reduce((a, b) => a + b, 0);
      const average = values.length ? total / values.length : 0;

      let max = -Infinity,
        min = Infinity,
        maxIndex = 0,
        minIndex = 0;

      values.forEach((v, i) => {
        if (v > max) {
          max = v;
          maxIndex = i;
        }
        if (v < min) {
          min = v;
          minIndex = i;
        }
      });

      const first = values[0] || 0;
      const last = values[values.length - 1] || 0;
      const growthRate = first ? ((last - first) / first) * 100 : 0;

      return {
        ...metric,
        values,
        total,
        average,
        max: max === -Infinity ? 0 : max,
        min: min === Infinity ? 0 : min,
        maxYear: data[maxIndex]?.year,
        minYear: data[minIndex]?.year,
        growthRate,
      };
    });
  }, [data]);

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

  const linePaths = useMemo(() => {
    const paths: Record<string, string> = {};
    METRICS.forEach((metric) => {
      if (!visibleMetrics.has(metric.key)) return;

      const gen = line<DataPoint>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d[metric.key as keyof DataPoint] as number))
        .curve(curveCardinal.tension(0.7));

      paths[metric.key] = gen(data) || "";
    });
    return paths;
  }, [data, xScale, yScale, visibleMetrics]);

  const areaPaths = useMemo(() => {
    const paths: Record<string, string> = {};
    METRICS.forEach((metric) => {
      if (!visibleMetrics.has(metric.key)) return;

      const gen = area<DataPoint>()
        .x((d) => xScale(d.year))
        .y0(boundsHeight)
        .y1((d) => d[metric.key as keyof DataPoint] as number)
        .curve(curveCardinal.tension(0.7));

      paths[metric.key] = gen(data) || "";
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

  if (!data.length) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <p className="text-slate-400">No livelihood data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* Narrative Header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <p className="text-xs text-slate-500 mt-1">{insight}</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {seriesData.map((m) => (
          <div
            key={m.key}
            className="p-2 rounded-lg bg-slate-50 border hover:shadow-md transition"
            style={{ borderColor: m.color + "30" }}
          >
            <div className="text-sm font-bold" style={{ color: m.color }}>
              {format(m.total)} {m.unit}
            </div>
            <div className="text-[11px] text-slate-600">{m.label}</div>
            <div className="text-[10px] text-slate-400">
              Avg: {format(m.average)} | Growth: {m.growthRate.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
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

      {/* Chart */}
      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {/* Grid */}
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

          {/* Areas */}
          {METRICS.map((m) =>
            visibleMetrics.has(m.key) ? (
              <path
                key={m.key}
                d={areaPaths[m.key]}
                fill={m.color}
                opacity={0.08}
              />
            ) : null
          )}

          {/* Lines */}
          {METRICS.map((m) =>
            visibleMetrics.has(m.key) ? (
              <LineItem
                key={m.key}
                path={linePaths[m.key]}
                color={m.color}
                strokeWidth={2.5}
                opacity={0.9}
                onHover={(h) => setHoveredMetric(h ? m.key : null)}
              />
            ) : null
          )}

          {/* Points */}
          {data.map((d) =>
            METRICS.map((m) => {
              if (!visibleMetrics.has(m.key)) return null;

              const v = d[m.key as keyof DataPoint] as number;
              const cx = xScale(d.year);
              const cy = yScale(v);

              return (
                <circle
                  key={`${m.key}-${d.year}`}
                  cx={cx}
                  cy={cy}
                  r={hoveredMetric === m.key ? 6 : 3}
                  fill={m.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            })
          )}

          {/* Axis */}
          {xTicks.map((x, i) => (
            <text
              key={i}
              x={xScale(x)}
              y={boundsHeight + 20}
              textAnchor="middle"
              fontSize={10}
              fill="#64748b"
            >
              {x}
            </text>
          ))}

          {yTicks.map((v, i) => (
            <text
              key={i}
              x={-10}
              y={yScale(v)}
              textAnchor="end"
              fontSize={10}
              fill="#64748b"
            >
              {format(v)}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default TimeSeriesDashboard;
