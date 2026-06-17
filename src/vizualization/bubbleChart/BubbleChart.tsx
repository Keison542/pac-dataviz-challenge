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

  const countries = useMemo(() => Array.from(new Set(data.map(d => d.country))), [data]);
  const years = useMemo(() => Array.from(new Set(data.map(d => d.year))), [data]);

  const maxValue = Math.max(...data.map(d => d.value), 1);

  const x = scaleBand().domain(years).range([0, width]).padding(0.3);
  const y = scaleBand().domain(countries).range([0, height]).padding(0.3);
  const r = scaleSqrt().domain([0, maxValue]).range([4, 40]);

  return (
    <div className="w-full relative">

      <div className="mb-3">
        <div className="text-sm font-semibold">
          Livelihood shocks are uneven
        </div>
        <div className="text-xs text-slate-500">
          Bubble size = impact severity
        </div>
      </div>

      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {data.map((d, i) => (
            <circle
              key={i}
              cx={x(d.year) ?? 0}
              cy={y(d.country) ?? 0}
              r={r(d.value)}
              fill="#ef4444"
              opacity={0.75}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}

          {/* AXIS LABELS */}
          <text x={width / 2} y={height + 40} textAnchor="middle" fontSize={11} fill="#64748b">
            Year
          </text>

          <text
            transform="rotate(-90)"
            x={-height / 2}
            y={-100}
            textAnchor="middle"
            fontSize={11}
            fill="#64748b"
          >
            Countries
          </text>

        </g>
      </svg>

      {/* TOOLTIP */}
      {hovered && (
        <div className="text-xs text-slate-600 mt-2">
          {hovered.country} ({hovered.year}) → {hovered.value} impacted
        </div>
      )}
    </div>
  );
}
