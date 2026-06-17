"use client";

import { useMemo, useState } from "react";

type Props = {
  data: any[];
  selectedCountry: string;
  width: number;
  height?: number;
};

type MatrixCell = {
  row: string;
  col: string;
  value: number;
  narrative: string;
};

const ROWS = [
  "Surface Temperature",
  "Sea Surface Temperature",
  "Sea Level",
  "Rainfall",
];

const COLS = [
  "Environmental",
  "Economic",
  "Human",
  "Disaster Risk",
];

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

export default function ClimateInteractionMatrix({
  data,
  selectedCountry,
  width,
  height = 460,
}: Props) {
  const [hover, setHover] = useState<MatrixCell | null>(null);

  const filtered = useMemo(
    () => data.filter((d) => d.country === selectedCountry),
    [data, selectedCountry]
  );

  const latest = filtered.at(-1);

  const matrix: MatrixCell[] = useMemo(() => {
    if (!latest) return [];

    const t = Math.abs(latest.temp);
    const r = Math.abs(latest.rainfall);
    const s = Math.abs(latest.sea);
    const ss = Math.abs(latest.sea_surface_temperature);

    return [
      {
        row: "Surface Temperature",
        col: "Environmental",
        value: clamp(t * 0.9),
        narrative: "Rising heat reshapes ecosystem stability and crop viability.",
      },
      {
        row: "Surface Temperature",
        col: "Economic",
        value: clamp(t * 0.75),
        narrative: "Heat stress reduces productivity and raises system-wide costs.",
      },
      {
        row: "Surface Temperature",
        col: "Human",
        value: clamp(t * 0.7),
        narrative: "Heat exposure directly increases health and displacement risk.",
      },
      {
        row: "Surface Temperature",
        col: "Disaster Risk",
        value: clamp(t * 0.8),
        narrative: "Higher baseline temperatures amplify extreme event severity.",
      },

      {
        row: "Sea Surface Temperature",
        col: "Disaster Risk",
        value: clamp(ss * 0.95),
        narrative: "Warmer oceans intensify cyclones and storm formation.",
      },

      {
        row: "Sea Level",
        col: "Human",
        value: clamp(s),
        narrative: "Sea level rise directly threatens coastal settlements.",
      },

      {
        row: "Rainfall",
        col: "Environmental",
        value: clamp(r * 0.75),
        narrative: "Rainfall variability destabilises ecosystems and agriculture.",
      },
      {
        row: "Rainfall",
        col: "Disaster Risk",
        value: clamp(r * 0.9),
        narrative: "Extreme rainfall increases flooding and landslides.",
      },
      {
        row: "Rainfall",
        col: "Economic",
        value: clamp(r * 0.65),
        narrative: "Flooding disrupts infrastructure and economic continuity.",
      },
    ];
  }, [latest]);

  const getCell = (r: string, c: string) =>
    matrix.find((m) => m.row === r && m.col === c);

  const hoverRow = hover?.row;
  const hoverCol = hover?.col;

  return (
    <div className="w-full">

      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="text-lg font-semibold text-slate-800">
          Climate System Interaction Map
        </h3>
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          Climate drivers do not act independently — they reinforce or amplify each other across systems.
        </p>
      </div>

      {/* GRID */}
      <div
        className="mx-auto grid gap-2"
        style={{
          gridTemplateColumns: `160px repeat(${COLS.length}, 1fr)`,
          width,
        }}
      >
        <div />

        {COLS.map((col) => (
          <div
            key={col}
            className="text-[11px] text-slate-500 font-semibold text-center"
          >
            {col}
          </div>
        ))}

        {ROWS.map((row) => (
          <>
            <div
              key={row}
              className="text-[12px] font-medium text-slate-600 flex items-center"
              style={{
                opacity: hoverRow && hoverRow !== row ? 0.35 : 1,
              }}
            >
              {row}
            </div>

            {COLS.map((col) => {
              const cell = getCell(row, col);
              const intensity = cell?.value ?? 0;

              const isActive =
                hover
                  ? hover.row === row || hover.col === col
                  : false;

              return (
                <div
                  key={row + col}
                  onMouseEnter={() => cell && setHover(cell)}
                  onMouseLeave={() => setHover(null)}
                  className="relative h-14 rounded-md border border-slate-100 transition-all cursor-pointer"
                  style={{
                    background: `rgba(59,130,246,${
                      intensity * (isActive ? 1 : 0.6)
                    })`,
                    transform: isActive ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cell && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-900">
                      {Math.round(intensity * 100)}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* STORY PANEL */}
      {hover && (
        <div className="mt-6 p-4 border rounded-lg bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-800">
            {hover.row} → {hover.col}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {hover.narrative}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Coupling strength: {Math.round(hover.value * 100)}/100
          </div>
        </div>
      )}
    </div>
  );
}
