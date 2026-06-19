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
  if (v > 0.75) return "#dc2626";
  if (v > 0.5) return "#f97316";
  if (v > 0.25) return "#eab308";
  return "#3b82f6";
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
      <div className="rounded-xl border bg-white p-6 text-center text-slate-500">
        No climate interaction data available.
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">

      {/* Story Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          How Climate Change Cascades Through {selectedCountry}
        </h2>

        <p className="mt-2 text-sm text-slate-600 max-w-3xl mx-auto">
          Climate indicators do not operate independently. Temperature,
          rainfall, sea-level rise and ocean warming interact to influence
          environmental systems, economies, human wellbeing and disaster risk.
        </p>
      </div>

      {/* Strongest Interaction */}
      {strongest && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-xs uppercase font-bold tracking-wide text-red-600">
            Strongest Climate Interaction
          </div>

          <div className="mt-1 text-lg font-bold text-slate-900">
            {strongest.row} → {strongest.col}
          </div>

          <p className="mt-1 text-sm text-slate-700">
            {strongest.narrative}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
        <span>Low Impact</span>

        <div
          className="h-3 w-40 rounded-full"
          style={{
            background:
              "linear-gradient(to right,#3b82f6,#eab308,#f97316,#dc2626)",
          }}
        />

        <span>High Impact</span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-2 min-w-[650px]"
          style={{
            gridTemplateColumns: `160px repeat(${COLS.length}, minmax(90px,1fr))`,
          }}
        >
          <div />

          {COLS.map((col) => (
            <div
              key={col}
              className="text-center text-xs font-semibold text-slate-500"
            >
              {col}
            </div>
          ))}

          {ROWS.map((row) => (
            <div key={row} className="contents">
              <div className="flex items-center text-sm font-medium text-slate-700">
                {row}
              </div>

              {COLS.map((col) => {
                const cell = getCell(row, col);

                if (!cell) {
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="h-16 rounded-lg border border-slate-100 bg-slate-50"
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
                    className={`h-16 rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? "scale-105 ring-2 ring-slate-800"
                        : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: getColor(cell.value),
                    }}
                  >
                    <div className="text-white font-bold text-sm">
                      {Math.round(cell.value * 100)}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Narrative Card */}
      {selectedCell && (
        <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
              Climate Driver
            </span>

            <span className="font-semibold">
              {selectedCell.row}
            </span>

            <span>→</span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
              Impact Area
            </span>

            <span className="font-semibold">
              {selectedCell.col}
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-700 leading-relaxed">
            {selectedCell.narrative}
          </p>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Interaction Strength</span>
              <span>{Math.round(selectedCell.value * 100)}/100</span>
            </div>

            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${selectedCell.value * 100}%`,
                  backgroundColor: getColor(selectedCell.value),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
