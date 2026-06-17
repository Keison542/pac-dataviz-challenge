"use client";

import { useMemo, useState } from "react";

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

  let num = 0, dx = 0, dy = 0;

  for (let i = 0; i < n; i++) {
    const vx = x[i] - mx;
    const vy = y[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }

  return num / Math.sqrt(dx * dy || 1);
}

function interpret(v: number) {
  const a = Math.abs(v);
  if (a > 0.75) return "Very strong";
  if (a > 0.5) return "Strong";
  if (a > 0.3) return "Moderate";
  if (a > 0.1) return "Weak";
  return "Minimal";
}

export default function ClimateSystemCorrelationNetwork({
  data,
  selectedCountry,
  width,
  height,
}: Props) {
  const [hover, setHover] = useState<null | {
    row: number;
    col: number;
    value: number;
  }>(null);

  const filtered = useMemo(
    () => data.filter(d => d.country === selectedCountry),
    [data, selectedCountry]
  );

  const matrix = useMemo(() => {
    return VARIABLES.map(v1 => {
      return VARIABLES.map(v2 => {
        const x = filtered.map(d => d[v1.key] || 0);
        const y = filtered.map(d => d[v2.key] || 0);
        return corr(x, y);
      });
    });
  }, [filtered]);

  const cellSize = Math.min(60, (width - 140) / VARIABLES.length);

  if (!filtered.length) {
    return (
      <div className="text-sm text-slate-500">
        No data available for correlation model
      </div>
    );
  }

  return (
    <div className="w-full mt-8 relative">
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        Climate System Correlation Model
      </h3>
      <p className="text-xs text-slate-600 mb-4">
        Hover cells to explore system-wide statistical relationships.
      </p>

      <svg width={width} height={width}>
        {/* Column labels */}
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

        {/* Rows */}
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

              const isHover = hover?.row === row && hover?.col === col;

              return (
                <rect
                  key={v2.key}
                  x={90 + col * cellSize}
                  y={40 + row * cellSize}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  fill={color}
                  stroke={isHover ? "#0f172a" : "#e2e8f0"}
                  strokeWidth={isHover ? 2 : 1}
                  rx={4}
                  opacity={hover ? (isHover ? 1 : 0.4) : 1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() =>
                    setHover({ row, col, value })
                  }
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hover && (
        <div
          className="absolute pointer-events-none bg-white border border-slate-200 shadow-xl rounded-lg px-3 py-2 text-xs z-50"
          style={{
            top: 40 + hover.row * cellSize,
            left: 120 + hover.col * cellSize,
          }}
        >
          <div className="font-semibold text-slate-800 mb-1">
            {VARIABLES[hover.row].label} → {VARIABLES[hover.col].label}
          </div>

          <div className="text-slate-600">
            Correlation:{" "}
            <span className="font-bold text-slate-800">
              {hover.value.toFixed(2)}
            </span>
          </div>

          <div className="text-slate-500 mt-1">
            {interpret(hover.value)} relationship
          </div>

          <div className="text-[10px] text-slate-400 mt-1">
            {hover.value > 0
              ? "Positive coupling (move together)"
              : "Negative coupling (inverse relationship)"}
          </div>
        </div>
      )}
    </div>
  );
}
