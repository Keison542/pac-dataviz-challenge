"use client";

import { useMemo } from "react";

type Props = {
  data: any[];
  selectedCountry: string;
  width: number;
  height: number;
};

const VARIABLES = [
  { key: "temp", label: "Temp" },
  { key: "sea_surface_temperature", label: "Sea Temp" },
  { key: "sea", label: "Sea Level" },
  { key: "rainfall", label: "Rainfall" },
  { key: "crop_yield", label: "Crops" },
  { key: "lifestock_yield", label: "Livestock" },
  { key: "loss", label: "Economic Loss" },
  { key: "people", label: "People" },
];

function corr(x: number[], y: number[]) {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let dx = 0;
  let dy = 0;

  for (let i = 0; i < n; i++) {
    const vx = x[i] - mx;
    const vy = y[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }

  return num / Math.sqrt(dx * dy || 1);
}

export default function ClimateSystemCorrelationNetwork({
  data,
  selectedCountry,
  width,
  height,
}: Props) {
  const filtered = useMemo(
    () => data.filter(d => d.country === selectedCountry),
    [data, selectedCountry]
  );

  const matrix = useMemo(() => {
    const result: number[][] = [];

    VARIABLES.forEach(v1 => {
      const row: number[] = [];

      VARIABLES.forEach(v2 => {
        const x = filtered.map(d => d[v1.key] || 0);
        const y = filtered.map(d => d[v2.key] || 0);

        row.push(corr(x, y));
      });

      result.push(row);
    });

    return result;
  }, [filtered]);

  const cellSize = Math.min(60, (width - 120) / VARIABLES.length);

  if (!filtered.length) {
    return (
      <div className="text-sm text-slate-500">
        No data available for correlation model
      </div>
    );
  }

  return (
    <div className="w-full mt-8">
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        Climate System Correlation Model
      </h3>
      <p className="text-xs text-slate-600 mb-4">
        Statistical relationships across climate, environmental, economic, and human systems.
      </p>

      <svg width={width} height={width}>
        {/* Labels */}
        {VARIABLES.map((v, i) => (
          <text
            key={v.key}
            x={100 + i * cellSize}
            y={20}
            fontSize={9}
            fill="#475569"
            textAnchor="middle"
          >
            {v.label}
          </text>
        ))}

        {VARIABLES.map((v1, row) => (
          <g key={v1.key}>
            <text
              x={10}
              y={60 + row * cellSize}
              fontSize={9}
              fill="#64748b"
            >
              {v1.label}
            </text>

            {VARIABLES.map((v2, col) => {
              const value = matrix[row][col];

              const intensity = Math.abs(value);
              const color =
                value > 0
                  ? `rgba(239,68,68,${intensity})`
                  : `rgba(59,130,246,${intensity})`;

              return (
                <rect
                  key={v2.key}
                  x={90 + col * cellSize}
                  y={40 + row * cellSize}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  fill={color}
                  stroke="#e2e8f0"
                  rx={4}
                />
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
