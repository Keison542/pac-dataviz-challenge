"use client";

import { scaleLinear } from "d3-scale";
import { line, curveCardinal, area } from "d3-shape";
import { useMemo, useState } from "react";

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
    label: "Crop Yield",
    unit: "t/ha",
    color: "#10b981",
    lightColor: "#6ee7b7",
    icon: "🌾",
    format: (v: number) => v.toFixed(1),
    formatCompact: (v: number) => v.toFixed(1),
  },
  {
    key: "livestockYield",
    label: "Livestock",
    unit: "tons",
    color: "#f59e0b",
    lightColor: "#fcd34d",
    icon: "🐄",
    format: (v: number) => v.toLocaleString(),
    formatCompact: (v: number) =>
      v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString(),
  },
  {
    key: "touristArrivals",
    label: "Tourist Arrivals",
    unit: "",
    color: "#14b8a6",
    lightColor: "#5eead4",
    icon: "✈️",
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
  title = "Climate & Socioeconomic Trends",
  insight = "Track trends over time.",
}: Props) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
    new Set(METRICS.map((m) => m.key))
  );

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // ✅ CRITICAL FIX: remove undefined/null entries
  const safeData = useMemo(
    () => (Array.isArray(data) ? data.filter(Boolean) : []),
    [data]
  );

  const toggleMetric = (key: string) => {
    const next = new Set(visibleMetrics);
    next.has(key) ? next.delete(key) : next.add(key);
    setVisibleMetrics(next);
  };

  const seriesData = useMemo(() => {
    return METRICS.map((metric) => {
      const values = safeData
        .map((d) => d?.[metric.key as keyof DataPoint])
        .filter((v): v is number => typeof v === "number" && !isNaN(v));

      if (!values.length) {
        return {
          ...metric,
          values: [],
          total: 0,
          average: 0,
          max: 0,
          maxYear: 0,
          min: 0,
          minYear: 0,
          growthRate: 0,
        };
      }

      const total = values.reduce((a, b) => a + b, 0);
      const average = total / values.length;

      let max = -Infinity,
        min = Infinity;
      let maxIndex = 0,
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

      const maxYear = safeData[maxIndex]?.year ?? 0;
      const minYear = safeData[minIndex]?.year ?? 0;

      const first = values[0] ?? 0;
      const last = values[values.length - 1] ?? 0;
      const growthRate = first ? ((last - first) / first) * 100 : 0;

      return {
        ...metric,
        values,
        total,
        average,
        max,
        min,
        maxYear,
        minYear,
        growthRate,
      };
    });
  }, [safeData]);

  const xScale = useMemo(() => {
    const years = safeData.map((d) => d?.year).filter(Boolean) as number[];

    if (!years.length) return () => 0;

    return scaleLinear()
      .domain([Math.min(...years), Math.max(...years)])
      .range([0, boundsWidth]);
  }, [safeData, boundsWidth]);

  const yScale = useMemo(() => {
    let maxValue = 0;

    safeData.forEach((d) => {
      if (!d) return;
      METRICS.forEach((m) => {
        if (visibleMetrics.has(m.key)) {
          const v = d[m.key as keyof DataPoint] as number;
          if (typeof v === "number" && v > maxValue) maxValue = v;
        }
      });
    });

    return scaleLinear()
      .domain([0, maxValue * 1.1 || 1])
      .range([boundsHeight, 0])
      .nice();
  }, [safeData, boundsHeight, visibleMetrics]);

  const linePaths = useMemo(() => {
    const paths: Record<string, string> = {};

    METRICS.forEach((m) => {
      if (!visibleMetrics.has(m.key)) return;

      const gen = line<DataPoint>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d[m.key as keyof DataPoint] as number))
        .curve(curveCardinal.tension(0.7));

      paths[m.key] = gen(safeData as any) || "";
    });

    return paths;
  }, [safeData, xScale, yScale, visibleMetrics]);

  const areaPaths = useMemo(() => {
    const paths: Record<string, string> = {};

    METRICS.forEach((m) => {
      if (!visibleMetrics.has(m.key)) return;

      const gen = area<DataPoint>()
        .x((d) => xScale(d.year))
        .y0(boundsHeight)
        .y1((d) => yScale(d[m.key as keyof DataPoint] as number))
        .curve(curveCardinal.tension(0.7));

      paths[m.key] = gen(safeData as any) || "";
    });

    return paths;
  }, [safeData, xScale, yScale, boundsHeight, visibleMetrics]);

  if (!safeData.length) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>

      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {METRICS.map((m) =>
            visibleMetrics.has(m.key) ? (
              <path
                key={m.key}
                d={linePaths[m.key]}
                fill="none"
                stroke={m.color}
                strokeWidth={2}
              />
            ) : null
          )}
        </g>
      </svg>
    </div>
  );
}

// ❌ REMOVED: default export (this was breaking imports/build consistency)
// export default TimeSeriesDashboard;