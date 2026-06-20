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

  // Format the detail panel as a sentence
  const formatDetailSentence = (cell: MatrixCell) => {
    const strength = Math.round(cell.value * 100);
    return `${cell.row} impacts ${cell.col.toLowerCase()}. ${cell.narrative} Interaction strength: ${strength}/100.`;
  };

  return (
    <div className="w-full flex flex-col items-center px-2 sm:px-4">
      {/* Header */}
      <div className="mb-6 text-center w-full max-w-4xl px-4">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">
          Climate Interaction Pathways in {selectedCountry}
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Climate indicators interact through environmental, economic,
          human and disaster-risk systems. Darker cells indicate
          stronger interactions.
        </p>
      </div>

      {/* Strongest Interaction */}
      {strongest && (
        <div className="mb-5 border-b border-slate-200 pb-4 text-center w-full max-w-3xl px-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
            Strongest Climate Interaction
          </div>

          <div className="mt-1 text-sm font-semibold text-slate-900">
            {strongest.row} → {strongest.col}
          </div>

          <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
            {strongest.narrative}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-5 flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 px-4">
        <span>Low</span>

        <div
          className="h-2 w-20 sm:w-28 md:w-36"
          style={{
            background:
              "linear-gradient(to right,#e2e8f0,#0f172a)",
          }}
        />

        <span>High</span>
      </div>

      {/* Matrix */}
      <div 
        className="w-full overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div
          className="mx-auto grid gap-1"
          style={{
            gridTemplateColumns: `minmax(90px,140px) repeat(${COLS.length}, minmax(55px,1fr))`,
            minWidth: "420px",
            maxWidth: "100%",
          }}
        >
          <div />

          {COLS.map((col) => (
            <div
              key={col}
              className="text-center text-[9px] sm:text-[10px] md:text-xs font-medium text-slate-500 px-1"
            >
              {col}
            </div>
          ))}

          {ROWS.map((row) => (
            <div key={row} className="contents">
              <div className="flex items-center text-[10px] sm:text-xs md:text-sm text-slate-700 pr-2">
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
                    className={`
                      h-8
                      border border-slate-200
                      transition-all duration-200
                      hover:scale-105
                      touch-manipulation
                      ${isSelected ? "ring-2 ring-slate-900 z-10" : ""}
                    `}
                    style={{
                      backgroundColor: getColor(cell.value),
                    }}
                  >
                    <div className="text-[10px] sm:text-xs font-semibold text-white">
                      {Math.round(cell.value * 100)}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel - Now in sentence form */}
      {selectedCell && (
        <div className="mt-6 border-t border-slate-200 pt-5 w-full max-w-3xl px-4">
          <p className="text-sm sm:text-base leading-relaxed text-slate-700">
            {formatDetailSentence(selectedCell)}
          </p>
          
          {/* Progress bar for visual reference */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Interaction Strength</span>
              <span>{Math.round(selectedCell.value * 100)}/100</span>
            </div>
            <div className="mt-1 h-1 bg-slate-100">
              <div
                className="h-1 bg-slate-900 transition-all duration-300"
                style={{
                  width: `${selectedCell.value * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
