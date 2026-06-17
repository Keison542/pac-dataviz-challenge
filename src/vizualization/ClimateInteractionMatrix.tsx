"use client";

import { useMemo, useState } from "react";
import ClimateInteractionMatrix from '@/vizualization/ClimateInteractionMatrix';


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
  height = 420,
}: Props) {
  const [hover, setHover] = useState<MatrixCell | null>(null);

  const filtered = useMemo(
    () => data.filter((d) => d.country === selectedCountry),
    [data, selectedCountry]
  );

  const latest = filtered[filtered.length - 1];

  const matrix: MatrixCell[] = useMemo(() => {
    if (!latest) return [];

    return [
      {
        row: "Surface Temperature",
        col: "Environmental",
        value: clamp(Math.abs(latest.temp) * 0.8),
        narrative:
          "Rising temperatures reduce crop productivity and stress ecosystems.",
      },
      {
        row: "Surface Temperature",
        col: "Economic",
        value: clamp(Math.abs(latest.temp) * 0.6),
        narrative:
          "Heat stress reduces agricultural output and increases economic loss.",
      },
      {
        row: "Surface Temperature",
        col: "Human",
        value: clamp(Math.abs(latest.temp) * 0.5),
        narrative:
          "Direct heat exposure increases health risks and displacement.",
      },
      {
        row: "Surface Temperature",
        col: "Disaster Risk",
        value: clamp(Math.abs(latest.temp) * 0.4),
        narrative:
          "Higher baseline temperatures intensify extreme weather events.",
      },

      {
        row: "Sea Surface Temperature",
        col: "Disaster Risk",
        value: clamp(latest.sea_surface_temperature * 0.9),
        narrative:
          "Warmer oceans increase cyclone intensity and storm formation.",
      },

      {
        row: "Sea Level",
        col: "Human",
        value: clamp(latest.sea * 1.0),
        narrative:
          "Sea level rise directly threatens coastal settlements and livelihoods.",
      },

      {
        row: "Rainfall",
        col: "Environmental",
        value: clamp(Math.abs(latest.rainfall) * 0.7),
        narrative:
          "Rainfall variability destabilizes agriculture and ecosystems.",
      },
      {
        row: "Rainfall",
        col: "Disaster Risk",
        value: clamp(Math.abs(latest.rainfall) * 0.8),
        narrative:
          "Extreme rainfall increases flooding and landslide frequency.",
      },
      {
        row: "Rainfall",
        col: "Economic",
        value: clamp(Math.abs(latest.rainfall) * 0.5),
        narrative:
          "Flooding disrupts infrastructure and economic activity.",
      },
    ];
  }, [latest]);

  const getValue = (r: string, c: string) =>
    matrix.find((m) => m.row === r && m.col === c);

  return (
    <div className="w-full">

      {/* Header */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-slate-800">
          Climate System Interaction Matrix
        </h3>
        <p className="text-xs text-slate-500 max-w-xl mx-auto mt-1">
          This matrix shows how climate drivers structurally interact with impact domains.
          Darker cells indicate stronger systemic coupling.
        </p>
      </div>

      {/* Matrix Grid */}
      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `140px repeat(${COLS.length}, 1fr)`,
          width,
        }}
      >
        {/* Top-left empty */}
        <div />

        {/* Column headers */}
        {COLS.map((col) => (
          <div
            key={col}
            className="text-[10px] text-slate-500 font-semibold text-center"
          >
            {col}
          </div>
        ))}

        {/* Rows */}
        {ROWS.map((row) => (
          <>
            {/* Row label */}
            <div
              key={row}
              className="text-[11px] font-medium text-slate-600 flex items-center"
            >
              {row}
            </div>

            {/* Cells */}
            {COLS.map((col) => {
              const cell = getValue(row, col);
              const intensity = cell?.value ?? 0;

              return (
                <div
                  key={row + col}
                  onMouseEnter={() => cell && setHover(cell)}
                  onMouseLeave={() => setHover(null)}
                  className="relative h-14 rounded-md border border-slate-100 cursor-pointer transition-all"
                  style={{
                    background: `rgba(59,130,246,${intensity})`,
                  }}
                >
                  {/* value label */}
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

      {/* Narrative insight */}
      {hover && (
        <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-800 mb-1">
            {hover.row} → {hover.col}
          </div>
          <div className="text-xs text-slate-600">
            {hover.narrative}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Coupling strength: {Math.round(hover.value * 100)} / 100
          </div>
        </div>
      )}

    </div>
  );
}
