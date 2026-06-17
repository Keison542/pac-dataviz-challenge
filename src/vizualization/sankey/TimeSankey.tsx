"use client";

import { useMemo } from "react";

type Props = {
  data: any[];
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
  { key: "people", label: "People" },
];

function norm(v: number) {
  return Math.max(0, Math.min(1, Math.abs(v)));
}

export default function CausalImpactMatrix({
  data,
  selectedCountry,
  width,
}: Props) {
  const filtered = useMemo(
    () => data.filter(d => d.country === selectedCountry),
    [data, selectedCountry]
  );

  const latest = filtered[filtered.length - 1];

  const matrix = useMemo(() => {
    if (!latest) return [];

    return DRIVERS.map(driver => {
      const dVal = norm(latest[driver.key] || 0);

      return OUTCOMES.map(outcome => {
        const oVal = norm(latest[outcome.key] || 0);

        // 🔥 SAME INTUITION AS YOUR SANKEY (not fake causality, just coupling strength)
        return Math.min(1, (dVal * 0.7 + oVal * 0.3));
      });
    });
  }, [latest]);

  const cell = Math.min(80, (width - 140) / OUTCOMES.length);

  if (!latest) {
    return (
      <div className="text-sm text-slate-500">
        No data available for matrix
      </div>
    );
  }

  return (
    <div className="w-full mt-10">
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        System Coupling Matrix
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Shows relative strength between climate drivers and downstream impacts.
      </p>

      <svg width={width} height={260}>
        {/* Column labels */}
        {OUTCOMES.map((o, i) => (
          <text
            key={o.key}
            x={120 + i * cell}
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
              y={60 + row * cell}
              fontSize={10}
              fill="#64748b"
            >
              {d.label}
            </text>

            {OUTCOMES.map((_, col) => {
              const val = matrix[row][col];

              return (
                <rect
                  key={col}
                  x={110 + col * cell}
                  y={40 + row * cell}
                  width={cell - 6}
                  height={cell - 6}
                  rx={6}
                  fill={`rgba(14,165,233,${val})`}
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
