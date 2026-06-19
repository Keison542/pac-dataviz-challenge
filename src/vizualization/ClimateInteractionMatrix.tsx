"use client";

import { useMemo, useState } from "react";

type Props = {
  data: any[];
  selectedCountry: string;
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

function getColor(v: number) {
  const opacity = 0.15 + v * 0.75;
  return `rgba(15,23,42,${opacity})`;
}

export default function ClimateInteractionMatrix({
  data,
  selectedCountry,
}: Props) {
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null);

  const filtered = useMemo(
    () => data.filter((d) => d.country === selectedCountry),
    [data, selectedCountry]
  );

  const latest = filtered.at(-1);

  const matrix: MatrixCell[] = useMemo(() => {
    if (!latest) return [];

    const t = Math.abs(latest.temp || 0);
    const r = Math.abs(latest.rainfall || 0);
    const s = Math.abs(latest.sea || 0);
    const ss = Math.abs(latest.sea_surface_temperature || 0);

    return [
      {
        row: "Surface Temperature",
        col: "Environmental",
        value: clamp(t * 0.9),
        narrative:
          "Rising temperatures alter ecosystems, biodiversity and agricultural productivity.",
      },
      {
        row: "Surface Temperature",
        col: "Human",
        value: clamp(t * 0.85),
        narrative:
          "Heat exposure increases health risks and can contribute to displacement.",
      },
      {
        row: "Sea Surface Temperature",
        col: "Disaster Risk",
        value: clamp(ss),
        narrative:
          "Warmer oceans fuel stronger tropical cyclones and extreme weather.",
      },
      {
        row: "Sea Level",
        col: "Human",
        value: clamp(s),
        narrative:
          "Sea-level rise threatens homes, infrastructure and coastal communities.",
      },
      {
        row: "Rainfall",
        col: "Economic",
        value: clamp(r * 0.75),
        narrative:
          "Extreme rainfall disrupts transport, agriculture and economic activity.",
      },
      {
        row: "Rainfall",
        col: "Disaster Risk",
        value: clamp(r),
        narrative:
          "Heavy rainfall significantly increases flooding and landslide risk.",
      },
    ];
  }, [latest]);

  const strongest = useMemo(() => {
    return [...matrix].sort((a, b) => b.value - a.value)[0];
  }, [matrix]);

  const getCell = (r: string, c: string) =>
    matrix.find((m) => m.row === r && m.col === c);

  if (!latest) {
    return (
      <div className="border border-slate-200 bg-white p-6 text-center text-slate-500">
        No climate interaction data available.
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-5 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Climate Interaction Pathways in {selectedCountry}
        </h2>

        <p className="mt-2 text-xs text-slate-600 max-w-2xl mx-auto">
          Climate indicators interact through environmental, economic,
          human and disaster-risk systems. Darker cells indicate
          stronger interactions.
        </p>
      </div>

      {/* Strongest Interaction */}
      {strongest && (
        <div className="mb-4 border-b border-slate-200 pb-3">
          <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Strongest Climate Interaction
          </div>

          <div className="mt-1 text-sm font-semibold text-slate-900">
            {strongest.row} → {strongest.col}
          </div>

          <p className="mt-1 text-xs text-slate-600">
            {strongest.narrative}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-4 flex items-center justify-center gap-3 text-[10px] text-slate-500">
        <span>Low</span>

        <div
          className="h-2 w-28"
          style={{
            background:
              "linear-gradient(to right,#e2e8f0,#0f172a)",
          }}
        />

        <span>High</span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-1 min-w-[420px]"
          style={{
            gridTemplateColumns: `100px repeat(${COLS.length}, 55px)`,
          }}
        >
          <div />

          {COLS.map((col) => (
            <div
              key={col}
              className="text-center text-[9px] font-medium text-slate-500"
            >
              {col}
            </div>
          ))}

          {ROWS.map((row) => (
            <div key={row} className="contents">
              <div className="flex items-center text-[10px] text-slate-700">
                {row}
              </div>

              {COLS.map((col) => {
                const cell = getCell(row, col);

                if (!cell) {
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="h-8 border border-slate-100 bg-white"
                    />
                  );
                }

                const isSelected =
                  selectedCell?.row === row &&
                  selectedCell?.col === col;

                return (
                  <button
                    key={`${row}-${col}`}
                    onClick={() => setSelectedCell(cell)}
                    onMouseEnter={() => setSelectedCell(cell)}
                    className={`h-8 border border-slate-200 transition ${
                      isSelected ? "ring-1 ring-slate-900" : ""
                    }`}
                    style={{
                      backgroundColor: getColor(cell.value),
                    }}
                  >
                    <div className="text-[9px] font-medium text-white">
                      {Math.round(cell.value * 100)}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCell && (
        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Climate Driver
          </div>

          <div className="text-sm font-medium text-slate-900">
            {selectedCell.row}
          </div>

          <div className="mt-3 text-[10px] uppercase tracking-wide text-slate-500">
            Impact Area
          </div>

          <div className="text-sm font-medium text-slate-900">
            {selectedCell.col}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {selectedCell.narrative}
          </p>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Interaction Strength</span>
              <span>{Math.round(selectedCell.value * 100)}/100</span>
            </div>

            <div className="mt-1 h-1 bg-slate-100">
              <div
                className="h-1 bg-slate-900"
                style={{
                  width: `${selectedCell.value * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
