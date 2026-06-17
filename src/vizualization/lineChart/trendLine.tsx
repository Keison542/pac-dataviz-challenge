"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { line, curveCardinal } from "d3-shape";
import { LineItem } from "@/vizualization/lineChart/LineItem";

const MARGIN = { top: 60, right: 60, bottom: 100, left: 120 };

export type UnifiedDatum = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  width: number;
  height: number;
  data: UnifiedDatum[];
  dataType: string;
  selectedCountry?: string;
  setSelectedCountry: (c: string) => void;
  highlightedYear?: number;
  stackBy?: "year" | "country";
  title?: string;
  insight?: string;
};

export const TrendLine = ({
  width,
  height,
  data,
  dataType,
  selectedCountry,
  setSelectedCountry,
  highlightedYear,
  stackBy = "year",
  insight = "This trend shows how climate-related disruptions have affected livelihoods over time.",
}: Props) => {
  const [isClient, setIsClient] = useState(false);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    value: number;
    year: number;
  } | null>(null);

  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isLineHovered, setIsLineHovered] = useState(false);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const trendData = useMemo(() => {
    const map = new Map<number, number>();
    data.forEach((d) => {
      const key = d.year;
      map.set(key, (map.get(key) ?? 0) + (d.value || 0));
    });

    return Array.from(map.entries())
      .map(([year, total]) => ({ year, total }))
      .sort((a, b) => a.year - b.year);
  }, [data]);

  const totalImpact = useMemo(
    () => data.reduce((sum, d) => sum + (d.value || 0), 0),
    [data]
  );

  const averageImpact =
    trendData.length > 0 ? totalImpact / trendData.length : 0;

  const worstYear = trendData.reduce(
    (worst, cur) =>
      cur.total > (worst?.total ?? 0) ? cur : worst,
    trendData[0]
  );

  const bestYear = trendData.reduce(
    (best, cur) =>
      cur.total < (best?.total ?? Infinity) ? cur : best,
    trendData[0]
  );

  const growthRate = useMemo(() => {
    if (trendData.length < 2) return 0;
    const first = trendData[0].total;
    const last = trendData[trendData.length - 1].total;
    return first === 0 ? 0 : ((last - first) / first) * 100;
  }, [trendData]);

  const formatCompact = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return v.toString();
  };

  const formatTick = (v: number) => formatCompact(v);

  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([
          trendData[0]?.year ?? 0,
          trendData[trendData.length - 1]?.year ?? 1,
        ])
        .range([0, boundsWidth]),
    [trendData, boundsWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([
          0,
          Math.max(...trendData.map((d) => d.total), 1) * 1.1,
        ])
        .range([boundsHeight, 0]),
    [trendData, boundsHeight]
  );

  const linePath = useMemo(() => {
    if (!trendData.length) return "";
    return (
      line<{ year: number; total: number }>()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.total))
        .curve(curveCardinal)(trendData) || ""
    );
  }, [trendData, xScale, yScale]);

  const areaPath = useMemo(() => {
    if (!trendData.length) return "";
    const lineGen = line<{ year: number; total: number }>()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.total))
      .curve(curveCardinal);

    const path = lineGen(trendData);
    if (!path) return "";

    const first = trendData[0];
    const last = trendData[trendData.length - 1];

    return `${path} L ${xScale(last.year)} ${boundsHeight} L ${xScale(
      first.year
    )} ${boundsHeight} Z`;
  }, [trendData, xScale, yScale, boundsHeight]);

  const xAxisTicks = useMemo(() => {
    const years = trendData.map((d) => d.year);
    const step = Math.ceil(years.length / 6);
    return years.filter((_, i) => i % step === 0);
  }, [trendData]);

  const yAxisTicks = useMemo(() => {
    const maxValue = Math.max(...trendData.map((d) => d.total), 1);
    const step = maxValue / 4;
    return Array.from({ length: 5 }, (_, i) => i * step);
  }, [trendData]);

  const handlePointEnter = (
    event: React.MouseEvent,
    year: number,
    value: number
  ) => {
    const rect = svgRef.current?.getBoundingClientRect();
    setTooltipPosition({
      x: event.clientX + 15,
      y: event.clientY - 55,
    });

    setHoveredPoint({
      x: 0,
      y: 0,
      value,
      year,
    });
  };

  const handlePointLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredPoint(null);
    }, 120);
  };

  if (!isClient || !trendData.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border bg-white"
        style={{ width, height }}
      >
        <p className="text-sm text-slate-500">No livelihood data available</p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">

      {/* LIVELIHOOD IMPACT STATS */}
      <div className="mb-4 grid grid-cols-4 gap-3">

        <div className="p-3 bg-cyan-50 rounded-lg border">
          <div className="text-xl font-bold text-cyan-700">
            {formatTick(totalImpact)}
          </div>
          <div className="text-xs text-slate-500">
            Total livelihood impact (proxy)
          </div>
        </div>

        <div className="p-3 bg-emerald-50 rounded-lg border">
          <div className="text-xl font-bold text-emerald-700">
            {formatTick(averageImpact)}
          </div>
          <div className="text-xs text-slate-500">
            Average annual disruption
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg border">
          <div className="text-xl font-bold text-amber-700">
            {worstYear?.year}
          </div>
          <div className="text-xs text-slate-500">
            Most severe year
          </div>
          <div className="text-[11px] text-amber-600">
            {formatCompact(worstYear?.total || 0)}
          </div>
        </div>

        <div className="p-3 bg-indigo-50 rounded-lg border">
          <div
            className={`text-xl font-bold ${
              growthRate > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {growthRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">
            Change in livelihood pressure
          </div>
        </div>

      </div>

      {/* INSIGHT */}
      <p className="text-sm text-slate-700 mb-4">
        Over this period ({trendData[0]?.year}–{trendData.at(-1)?.year}),
        livelihood-related disruption has shifted by{" "}
        {Math.abs(growthRate).toFixed(1)}%. The dataset shows cumulative
        impact of {formatTick(totalImpact)} with an annual average of{" "}
        {formatTick(averageImpact)}. The most affected year was{" "}
        {worstYear?.year}, while the least affected year was{" "}
        {bestYear?.year}.
      </p>

      {/* CHART */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="overflow-visible"
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* AREA */}
            <path d={areaPath} fill="#06b6d4" opacity={0.2} />

            {/* LINE */}
            <LineItem
              path={linePath}
              color="#06b6d4"
              opacity={0.9}
              strokeWidth={3}
              onHover={setIsLineHovered}
            />

            {/* POINTS */}
            {trendData.map((d, i) => {
              const x = xScale(d.year);
              const y = yScale(d.total);

              return (
                <g
                  key={i}
                  onMouseEnter={(e) =>
                    handlePointEnter(e, d.year, d.total)
                  }
                  onMouseLeave={handlePointLeave}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    fill="#06b6d4"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                </g>
              );
            })}

            {/* AXIS */}
            {xAxisTicks.map((year, i) => (
              <text
                key={i}
                x={xScale(year)}
                y={boundsHeight + 20}
                textAnchor="middle"
                fontSize={11}
                fill="#64748b"
              >
                {year}
              </text>
            ))}

            {yAxisTicks.map((v, i) => (
              <text
                key={i}
                x={-10}
                y={yScale(v)}
                textAnchor="end"
                fontSize={11}
                fill="#64748b"
              >
                {formatTick(v)}
              </text>
            ))}

          </g>
        </svg>

        {/* TOOLTIP */}
        {hoveredPoint && (
          <div
            style={{
              position: "fixed",
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              background: "#fff",
              border: "1px solid #e2e8f0",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          >
            <div className="font-semibold">
              Year {hoveredPoint.year}
            </div>
            <div className="text-slate-700">
              Impact: {formatTick(hoveredPoint.value)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
