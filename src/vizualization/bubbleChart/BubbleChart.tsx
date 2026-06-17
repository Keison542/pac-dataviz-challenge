"use client";

import { scaleBand, scaleSqrt } from "d3-scale";
import { useMemo, useState } from "react";

type DataPoint = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  width: number;
  height: number;
  data: DataPoint[];
};

const MARGIN = { top: 40, right: 20, bottom: 80, left: 140 };

export function BubbleChart({ width, height, data }: Props) {
  const [hovered, setHovered] = useState<DataPoint | null>(null);

  const countries = useMemo(
    () => Array.from(new Set(data.map((d) => d.country))),
    [data]
  );

  const years = useMemo(
    () => Array.from(new Set(data.map((d) => d.year))),
    [data]
  );

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const x = scaleBand().domain(years).range([0, width]).padding(0.3);
  const y = scaleBand().domain(countries).range([0, height]).padding(0.3);
  const r = scaleSqrt().domain([0, maxValue]).range([4, 40]);

  const color = (v: number) => {
    const p = v / maxValue;
    if (p > 0.8) return "#b91c1c";
    if (p > 0.5) return "#ef4444";
    if (p > 0.3) return "#f97316";
    return "#f59e0b";
  };

  const worst = data.reduce((a, b) => (b.value > a.value ? b : a));

  return (
    <div className="w-full">

      <div className="mb-3">
        <div className="text-sm font-semibold">
          Livelihood shocks are uneven and clustered
        </div>
        <div className="text-xs text-slate-500">
          Each bubble = disruption event
        </div>
      </div>

      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {data.map((d, i) => {
            const cx = x(d.year) ?? 0;
            const cy = y(d.country) ?? 0;

            const isWorst = d === worst;

            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r(d.value)}
                fill={color(d.value)}
                opacity={0.85}
                stroke={isWorst ? "#111827" : "#fff"}
                strokeWidth={isWorst ? 2 : 1}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

        </g>
      </svg>

      {hovered && (
        <div className="text-xs text-slate-600 mt-2">
          {hovered.country} ({hovered.year}) → {hovered.value} people impacted
        </div>
      )}
    </div>
  );
}
