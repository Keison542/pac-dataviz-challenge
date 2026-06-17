"use client";

import { useMemo } from "react";

type Props = {
  data: {
    temp: number;
    sea: number;
    rainfall: number;
    sea_surface_temperature: number;
    crop_yield: number;
    lifestock_yield: number;
    climate_altering_land: number;
    loss: number;
    people: number;
    population_growth: number;
  }[];
  selectedCountry: string;
  width: number;
};

const DRIVERS = [
  { key: "temp", label: "Temp" },
  { key: "sea_surface_temperature", label: "Sea Temp" },
  { key: "sea", label: "Sea Level" },
  { key: "rainfall", label: "Rainfall" },
];

const OUTCOMES = [
  { key: "crop_yield", label: "Crops" },
  { key: "lifestock_yield", label: "Livestock" },
  { key: "climate_altering_land", label: "Land" },
  { key: "loss", label: "Economic Loss" },
  { key: "people", label: "People Affected" },
];

function clamp(v: number) {
  return Math.max(0, Math.min(1, v));
}

export default function CausalImpactMatrix({
  data,
  selectedCountry,
  width,
}: Props) {
  const matrix = useMemo(() => {
    const filtered = data.filter(d => d.country === selectedCountry);
    if (!filtered.length) return [];

    const latest = filtered[filtered.length - 1];

    return DRIVERS.map(driver => {
      return OUTCOMES.map(outcome => {
        let value = 0;

        const dVal = Math.abs(latest[driver.key as keyof typeof latest] as number || 0);
        const oVal = Math.abs(latest[outcome.key as keyof typeof latest] as number || 0);

        // simple causal heuristic (you can refine later)
        value = clamp((dVal * 0.5 + oVal * 0.5) / 100);

        return value;
      });
    });
  }, [data, selectedCountry]);

  const cellSize = Math.min(90, (width - 120) / OUTCOMES.length);

  if (!matrix.length) return null;

  return (
    <div className="w-full">
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        Climate → Impact Strength Map
      </h3>
      <p className="text-xs text-slate-600 mb-6">
        Higher intensity shows stronger coupling between climate drivers and system outcomes.
      </p>

      <svg width={width} height={260}>
        {/* Column Labels */}
        {OUTCOMES.map((o, i) => (
          <text
            key={o.key}
            x={110 + i * cellSize}
            y={20}
            fontSize={10}
            fill="#475569"
            textAnchor="middle"
          >
            {o.label}
          </text>
        ))}

        {/* Rows */}
        {DRIVERS.map((d, row) => (
          <g key={d.key}>
            <text
              x={10}
              y={60 + row * cellSize}
              fontSize={10}
              fill="#64748b"
              textAnchor="start"
            >
              {d.label}
            </text>

            {OUTCOMES.map((_, col) => {
              const val = matrix[row][col];
              return (
                <rect
                  key={`${row}-${col}`}
                  x={100 + col * cellSize}
                  y={40 + row * cellSize}
                  width={cellSize - 6}
                  height={cellSize - 6}
                  rx={6}
                  fill={`rgba(14, 165, 233, ${val})`}
                  stroke="#e2e8f0"
                />
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
