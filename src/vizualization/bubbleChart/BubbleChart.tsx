"use client";

import { scaleBand, scaleLinear, scaleSqrt } from "d3-scale";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { animated, useSpring } from "@react-spring/web";

type DataPoint = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  width: number;
  height: number;
  data: DataPoint[];
  title?: string;
  insight?: string;
};

const MARGIN = {
  top: 50,
  right: 40,
  bottom: 110,
  left: 150,
};

/**
 * Animated bubble emphasizing human impact (livelihood disruption)
 */
const AnimatedBubble = ({
  cx,
  cy,
  r,
  fill,
  fillOpacity,
  stroke,
  strokeWidth,
  isLargest,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: any) => {
  const springProps = useSpring({
    r: isHovered ? r + 5 : r,
    fillOpacity: isHovered ? 0.95 : fillOpacity,
    strokeWidth: isHovered ? 3 : strokeWidth,
    config: { tension: 200, friction: 20 },
  });

  const glowSpring = useSpring({
    opacity: isHovered ? 0.35 : 0,
    config: { tension: 200, friction: 20 },
  });

  return (
    <>
      {/* Highlight for largest livelihood disruption event */}
      {isLargest && !isHovered && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 5}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          opacity="0.25"
        />
      )}

      {/* Hover glow */}
      {isHovered && (
        <animated.circle
          cx={cx}
          cy={cy}
          r={r + 10}
          fill={fill}
          opacity={glowSpring.opacity}
          style={{ filter: "blur(6px)" }}
        />
      )}

      <animated.circle
        cx={cx}
        cy={cy}
        r={springProps.r}
        fill={fill}
        fillOpacity={springProps.fillOpacity}
        stroke={stroke}
        strokeWidth={springProps.strokeWidth}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="cursor-pointer transition-all duration-200"
      />
    </>
  );
};

export function BubbleChart({ width, height, data }: Props) {
  const [hovered, setHovered] = useState<DataPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  useEffect(() => setIsClient(true), []);

  const countries = useMemo(
    () => Array.from(new Set(data.map((d) => d.country))).sort(),
    [data]
  );

  const years = useMemo(
    () => Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b),
    [data]
  );

  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data]
  );

  const totalAffected = useMemo(
    () => data.reduce((s, d) => s + d.value, 0),
    [data]
  );

  const largestEvent = useMemo(() => {
    return data.reduce((max, d) => (d.value > max.value ? d : max), data[0]);
  }, [data]);

  const worstYear = useMemo(() => {
    const map = new Map<number, number>();
    data.forEach((d) => {
      map.set(d.year, (map.get(d.year) || 0) + d.value);
    });

    let best = { year: 0, total: 0 };
    map.forEach((total, year) => {
      if (total > best.total) best = { year, total };
    });

    return best;
  }, [data]);

  const xScale = useMemo(
    () =>
      scaleBand<number>()
        .domain(years)
        .range([0, boundsWidth])
        .padding(0.25),
    [years, boundsWidth]
  );

  const yScale = useMemo(
    () =>
      scaleBand<string>()
        .domain(countries)
        .range([0, boundsHeight])
        .padding(0.35),
    [countries, boundsHeight]
  );

  const radiusScale = useMemo(
    () => scaleSqrt().domain([0, maxValue]).range([4, 42]),
    [maxValue]
  );

  /**
   * Human impact severity scale (livelihood framing)
   */
  const colorScale = (value: number) => {
    const ratio = value / maxValue;

    if (ratio > 0.8) return "#b91c1c"; // catastrophic livelihood loss
    if (ratio > 0.5) return "#ef4444"; // severe displacement
    if (ratio > 0.3) return "#f97316"; // major disruption
    return "#f59e0b"; // moderate/localized impact
  };

  const formatNumber = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toString();
  };

  const handleBubbleHover = useCallback(
    (event: React.MouseEvent, point: DataPoint | null) => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

      if (point) {
        setTooltipPosition({
          x: event.clientX + 15,
          y: event.clientY - 40,
        });
        setHovered(point);
      } else {
        hoverTimerRef.current = setTimeout(() => setHovered(null), 80);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center border rounded-xl bg-white"
        style={{ width, height }}>
        Loading chart...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center border rounded-xl bg-white"
        style={{ width, height }}>
        No livelihood impact data available
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* 👇 LIVELIHOOD-FOCUSED SUMMARY */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="p-2 bg-rose-50 rounded-lg text-center">
          <div className="text-lg font-bold text-rose-700">
            {formatNumber(totalAffected)}
          </div>
          <div className="text-xs text-slate-500">
            people impacted across region
          </div>
        </div>

        <div className="p-2 bg-orange-50 rounded-lg text-center">
          <div className="text-lg font-bold text-orange-700">
            {formatNumber(largestEvent?.value || 0)}
          </div>
          <div className="text-xs text-slate-500">
            worst single livelihood shock
          </div>
          <div className="text-[10px] text-slate-400">
            {largestEvent?.country}, {largestEvent?.year}
          </div>
        </div>

        <div className="p-2 bg-amber-50 rounded-lg text-center">
          <div className="text-lg font-bold text-amber-700">
            {worstYear.year || "—"}
          </div>
          <div className="text-xs text-slate-500">
            most disrupted year
          </div>
          <div className="text-[10px] text-slate-400">
            {formatNumber(worstYear.total)} affected
          </div>
        </div>
      </div>

      {/* INSIGHT */}
      <p className="text-sm text-slate-700 leading-relaxed mb-4">
        This view highlights how disasters translate into real livelihood disruption across countries and years.
        The most severe impact was recorded in {largestEvent?.country} ({largestEvent?.year}),
        affecting {formatNumber(largestEvent?.value || 0)} people.
      </p>

      {/* LEGEND */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-500">Bubble size = people affected</span>
        <span className="text-slate-500">Color = severity of livelihood disruption</span>
      </div>

      {/* CHART */}
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

            {/* GRID */}
            {years.map((year) => {
              const x = (xScale(year) ?? 0) + xScale.bandwidth() / 2;
              return (
                <line
                  key={year}
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={boundsHeight}
                  stroke="#eef2f7"
                />
              );
            })}

            {countries.map((c) => {
              const y = (yScale(c) ?? 0) + yScale.bandwidth() / 2;
              return (
                <line
                  key={c}
                  x1={0}
                  x2={boundsWidth}
                  y1={y}
                  y2={y}
                  stroke="#f1f5f9"
                />
              );
            })}

            {/* BUBBLES */}
            {data.map((d, i) => {
              const cx = (xScale(d.year) ?? 0) + xScale.bandwidth() / 2;
              const cy = (yScale(d.country) ?? 0) + yScale.bandwidth() / 2;

              const r = radiusScale(d.value);
              const isLargest = d === largestEvent;
              const isHovered = hovered === d;

              return (
                <AnimatedBubble
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={colorScale(d.value)}
                  fillOpacity={0.85}
                  stroke="#fff"
                  strokeWidth={isLargest ? 2.5 : 1}
                  isLargest={isLargest}
                  isHovered={isHovered}
                  onMouseEnter={(e: React.MouseEvent) =>
                    handleBubbleHover(e, d)
                  }
                  onMouseLeave={(e: React.MouseEvent) =>
                    handleBubbleHover(e, null)
                  }
                />
              );
            })}

          </g>
        </svg>

        {/* TOOLTIP */}
        {hovered && (
          <div
            style={{
              position: "fixed",
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              background: "white",
              border: "1px solid #e2e8f0",
              padding: "10px 12px",
              borderRadius: 8,
              boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
              minWidth: 160,
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: 11, color: "#475569" }}>
              {hovered.country} • {hovered.year}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {formatNumber(hovered.value)}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>
              people affected → livelihood disruption
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
