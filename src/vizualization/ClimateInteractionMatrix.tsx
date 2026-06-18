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
        narrative: "Heat reshapes ecosystem stability and agriculture.",
      },
      {
        row: "Surface Temperature",
        col: "Human",
        value: clamp(t * 0.85),
        narrative: "Heat exposure increases health and displacement risk.",
      },
      {
        row: "Sea Surface Temperature",
        col: "Disaster Risk",
        value: clamp(ss),
        narrative: "Warmer oceans intensify cyclones and storms.",
      },
      {
        row: "Sea Level",
        col: "Human",
        value: clamp(s),
        narrative: "Sea level rise threatens coastal settlements.",
      },
      {
        row: "Rainfall",
        col: "Economic",
        value: clamp(r * 0.75),
        narrative: "Flooding disrupts infrastructure and supply chains.",
      },
      {
        row: "Rainfall",
        col: "Disaster Risk",
        value: clamp(r),
        narrative: "Extreme rainfall increases flooding risk.",
      },
    ];
  }, [latest]);

  const getCell = (r: string, c: string) =>
    matrix.find((m) => m.row === r && m.col === c);

  const hoverRow = hover?.row;

  return (
    <div className="w-full">

      {/* HEADER (smaller, tighter) */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Climate Interaction Map
        </h3>
        <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
          Cross-system climate impacts across key domains.
        </p>
      </div>

      {/* GRID (REDUCED SIZE) */}
      <div
        className="mx-auto grid gap-1.5"
        style={{
          gridTemplateColumns: `140px repeat(${COLS.length}, 1fr)`,
          width: Math.min(width, 820), // 👈 important shrink cap
        }}
      >
        <div />

        {COLS.map((col) => (
          <div
            key={col}
            className="text-[10px] font-semibold text-slate-500 text-center"
          >
            {col}
          </div>
        ))}

        {ROWS.map((row) => (
          <div key={row} className="contents">
            {/* ROW LABEL */}
            <div
              className="text-[11px] text-slate-700 flex items-center"
              style={{
                opacity: hoverRow && hoverRow !== row ? 0.35 : 1,
              }}
            >
              {row}
            </div>

            {/* CELLS (SMALLER HEIGHT) */}
            {COLS.map((col) => {
              const cell = getCell(row, col);
              const intensity = cell?.value ?? 0;

              const isActive = hover
                ? hover.row === row || hover.col === col
                : false;

              return (
                <div
                  key={row + col}
                  onMouseEnter={() => cell && setHover(cell)}
                  onMouseLeave={() => setHover(null)}
                  className="relative h-10 rounded-md border border-slate-100 cursor-pointer"
                  style={{
                    background: cell
                      ? `rgba(37,99,235,${intensity * (isActive ? 0.95 : 0.6)})`
                      : "repeating-linear-gradient(45deg,#f8fafc,#f8fafc 4px,#fff 4px,#fff 8px)",
                    transition: "all 150ms ease",
                  }}
                >
                  {cell && (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white/90">
                      {Math.round(intensity * 100)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* STORY PANEL (COMPACT) */}
      {hover && (
        <div className="mt-4 p-3 border rounded-lg bg-white shadow-sm">
          <div className="text-[11px] font-semibold text-slate-900">
            {hover.row} → {hover.col}
          </div>

          <div className="text-[11px] text-slate-600 mt-1">
            {hover.narrative}
          </div>

          <div className="text-[10px] text-slate-400 mt-2">
            Strength: {Math.round(hover.value * 100)}/100
          </div>
        </div>
      )}
    </div>
  );
}
