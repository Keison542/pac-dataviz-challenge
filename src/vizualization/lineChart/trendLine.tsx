"use client";

import { scaleLinear, scaleSqrt } from "d3-scale";
import { useMemo, useState } from "react";

const MARGIN = { top: 60, right: 60, bottom: 110, left: 110 };

export type UnifiedDatum = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  width: number;
  height: number;
  data: UnifiedDatum[];
  selectedCountry?: string;
  setSelectedCountry: (c: string) => void;
  highlightMode?: "economic" | "human" | "system";
};

export const TrendLine = ({
  width,
  height,
  data,
  selectedCountry,
  setSelectedCountry,
}: Props) => {
  const [hovered, setHovered] = useState<UnifiedDatum | null>(null);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const countries = useMemo(
    () => Array.from(new Set(data.map((d) => d.country))),
    [data]
  );

  const years = useMemo(
    () => Array.from(new Set(data.map((d) => d.year))).sort(),
    [data]
  );

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // X = Year
  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([years[0] ?? 0, years.at(-1) ?? 1])
        .range([0, boundsWidth]),
    [years, boundsWidth]
  );

  // Y = Country
  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, Math.max(countries.length - 1, 1)])
        .range([boundsHeight, 0]),
    [countries, boundsHeight]
  );

  const rScale = useMemo(
    () => scaleSqrt().domain([0, maxValue]).range([3, 28]),
    [maxValue]
  );

  const countryIndex = new Map(countries.map((c, i) => [c, i]));

  if (!data.length) return null;

  return (
    <div className="w-full font-sans">

      {/* HEADER */}
      <div className="mb-4 text-center max-w-xl mx-auto">
        <div className="text-sm font-semibold text-slate-900">
          Livelihood Impact Bubble Map
        </div>

        <p className="text-xs text-slate-700 mt-1">
          Bubble size represents impact severity across countries and years.
        </p>
      </div>

      {/* CHART */}
      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {data.map((d, i) => {
            const x = xScale(d.year);
            const y = yScale(countryIndex.get(d.country) ?? 0);
            const r = rScale(d.value);

            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={r}
                fill="#06b6d4"
                opacity={0.75}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelectedCountry(d.country)}
                style={{ cursor: "pointer" }}
              />
            );
          })}

          {/* X Axis Label */}
          <text
            x={boundsWidth / 2}
            y={boundsHeight + 55}
            textAnchor="middle"
            fontSize={11}
            fill="#374151"
          >
            Year
          </text>

          {/* Y Axis Label */}
          <text
            x={-60}
            y={boundsHeight / 2}
            textAnchor="middle"
            fontSize={11}
            fill="#374151"
            transform={`rotate(-90, -60, ${boundsHeight / 2})`}
          >
            Countries
          </text>

          {/* Country labels */}
          {countries.map((c, i) => (
            <text
              key={c}
              x={-10}
              y={yScale(i)}
              textAnchor="end"
              fontSize={10}
              fill="#4b5563"
            >
              {c}
            </text>
          ))}
        </g>
      </svg>

      {/* TOOLTIP */}
      {hovered && (
        <div className="mt-2 text-xs text-slate-700 text-center">
          {hovered.country} ({hovered.year}) → {hovered.value}
        </div>
      )}
    </div>
  );
};
