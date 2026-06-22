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
  // Color scale: white (0) → light blue → dark blue (1)
  // Similar to the correlation matrix style
  const intensity = v;
  if (intensity === 0) return "#f8f9fa";
  
  // Blue color scale from light to dark
  const r = Math.round(240 - intensity * 200);
  const g = Math.round(245 - intensity * 200);
  const b = Math.round(250 - intensity * 200);
  return `rgb(${r}, ${g}, ${b})`;
}

function getTextColor(v: number) {
  // Dark text for light cells, white text for dark cells
  return v > 0.5 ? "#ffffff" : "#1a1a2e";
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

  // ─── Build the narrative story ───
  const buildNarrative = () => {
    if (!latest) return null;

    const t = Math.abs(latest.temp || 0);
    const r = Math.abs(latest.rainfall || 0);
    const s = Math.abs(latest.sea || 0);
    const ss = Math.abs(latest.sea_surface_temperature || 0);

    let narrative = "";

    const tempInteraction = Math.min(Math.round(t * 0.9 * 100), 100);
    if (t > 0.5) {
      narrative += `In ${selectedCountry}, rising surface temperatures (${tempInteraction}% interaction strength) are altering ecosystems and biodiversity, while also increasing health risks for local communities. `;
    } else if (t > 0.2) {
      narrative += `Surface temperatures in ${selectedCountry} are showing moderate warming trends, with measurable impacts on both environmental systems and human health. `;
    }

    const sstInteraction = Math.min(Math.round(ss * 100), 100);
    if (ss > 0.5) {
      narrative += `Warmer ocean temperatures (${sstInteraction}% interaction strength) are fueling stronger tropical cyclones and more extreme weather events. `;
    } else if (ss > 0.2) {
      narrative += `Sea surface temperatures are rising, contributing to increased storm activity and disaster risk. `;
    }

    const seaInteraction = Math.min(Math.round(s * 100), 100);
    if (s > 0.5) {
      narrative += `Sea-level rise (${seaInteraction}% interaction strength) poses a direct threat to coastal communities, infrastructure, and livelihoods. `;
    } else if (s > 0.2) {
      narrative += `Rising sea levels are gradually affecting coastal areas, increasing vulnerability to flooding and erosion. `;
    }

    const rainInteraction = Math.min(Math.round(r * 100), 100);
    if (r > 0.5) {
      narrative += `Extreme rainfall events (${rainInteraction}% interaction strength) are disrupting agriculture, damaging infrastructure, and creating significant economic losses. `;
    } else if (r > 0.2) {
      narrative += `Changing rainfall patterns are affecting agricultural productivity and increasing the risk of flooding and landslides. `;
    }

    if (strongest) {
      const strengthPct = Math.min(Math.round(strongest.value * 100), 100);
      narrative += `The strongest climate interaction in ${selectedCountry} is between ${strongest.row} and ${strongest.col}, with an interaction strength of ${strengthPct}%. ${strongest.narrative}`;
    }

    return narrative;
  };

  const narrativeText = buildNarrative();

  if (!latest) {
    return (
      <div className="border border-slate-200 bg-white p-6 text-center text-slate-500">
        No climate interaction data available.
      </div>
    );
  }

  const formatDetailSentence = (cell: MatrixCell) => {
    const strength = Math.min(Math.round(cell.value * 100), 100);
    return `${cell.row} impacts ${cell.col.toLowerCase()}. ${cell.narrative} Interaction strength: ${strength}/100.`;
  };

  return (
    <div className="w-full flex flex-col items-center px-2 sm:px-4">
      {/* ─── NARRATIVE HEADER ─── */}
      <div className="mb-4 text-center w-full max-w-4xl px-4">
        <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-500 tracking-wider uppercase mb-2">
          Climate System Dynamics
        </div>
        <h2 className="text-xl sm:text-2xl font-light text-slate-800 tracking-tight">
          Climate Interaction <span className="font-semibold text-slate-900">Pathways</span>
        </h2>
        <div className="w-12 h-0.5 bg-slate-300 mx-auto mt-3 mb-3" />
      </div>

      {/* ─── NARRATIVE STORY ─── */}
      {narrativeText && (
        <div className="mb-5 text-center w-full max-w-3xl px-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            {narrativeText}
          </p>
        </div>
      )}

      {/* ─── STRONGEST INTERACTION ─── */}
      {strongest && (
        <div className="mb-4 text-center w-full max-w-3xl px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            Strongest: {strongest.row} → {strongest.col}
            <span className="text-slate-400">·</span>
            {Math.min(Math.round(strongest.value * 100), 100)}% interaction
          </div>
        </div>
      )}

      {/* ─── LEGEND ─── */}
      <div className="mb-4 flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 px-4">
        <span>Low</span>
        <div
          className="h-3 w-32 sm:w-40 md:w-48 rounded"
          style={{
            background: "linear-gradient(to right, #f8f9fa, #a8c8e8, #4a8ab5, #1a4a6a)",
          }}
        />
        <span>High</span>
      </div>

      {/* ─── MATRIX ─── */}
      <div 
        className="w-full overflow-x-auto"
        style={{
          scrollbarWidth: 'thin',
        }}
      >
        <div
          className="mx-auto grid gap-[1px]"
          style={{
            gridTemplateColumns: `minmax(80px,120px) repeat(${COLS.length}, minmax(45px,1fr))`,
            minWidth: "320px",
            maxWidth: "100%",
          }}
        >
          {/* ─── TOP-LEFT EMPTY ─── */}
          <div className="h-7 bg-transparent" />

          {/* ─── COLUMN HEADERS ─── */}
          {COLS.map((col) => (
            <div
              key={col}
              className="text-center text-[8px] sm:text-[9px] md:text-[10px] font-medium text-slate-600 px-0.5 leading-tight h-7 flex items-center justify-center bg-slate-50 rounded-t-sm"
            >
              {col}
            </div>
          ))}

          {/* ─── ROWS ─── */}
          {ROWS.map((row) => (
            <div key={row} className="contents">
              {/* Row label */}
              <div className="flex items-center text-[8px] sm:text-[9px] md:text-[10px] text-slate-700 pr-2 leading-tight h-7 bg-slate-50 rounded-l-sm">
                {row}
              </div>

              {/* Cells */}
              {COLS.map((col) => {
                const cell = getCell(row, col);

                if (!cell) {
                  return (
                    <div
                      key={`${row}-${col}`}
                      className="h-7 border border-slate-100 bg-white"
                    />
                  );
                }

                const isSelected =
                  selectedCell?.row === row &&
                  selectedCell?.col === col;

                const displayValue = Math.min(Math.round(cell.value * 100), 100);
                const color = getColor(cell.value);
                const textColor = getTextColor(cell.value);

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`
                      h-7
                      border border-slate-200
                      transition-all duration-200
                      flex items-center justify-center
                      ${isSelected ? "ring-2 ring-slate-900 z-10 shadow-md" : ""}
                      hover:ring-1 hover:ring-slate-400 hover:z-10
                    `}
                    style={{
                      backgroundColor: color,
                      cursor: "default",
                    }}
                    onMouseEnter={() => setSelectedCell(cell)}
                    onMouseLeave={() => setSelectedCell(null)}
                  >
                    <span 
                      className="text-[8px] sm:text-[9px] font-medium leading-none"
                      style={{ color: textColor }}
                    >
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ─── DETAIL PANEL ─── */}
      {selectedCell && (
        <div className="mt-5 border-t border-slate-200 pt-4 w-full max-w-3xl px-4">
          <p className="text-sm sm:text-base leading-relaxed text-slate-700">
            {formatDetailSentence(selectedCell)}
          </p>
          
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Interaction Strength</span>
              <span>{Math.min(Math.round(selectedCell.value * 100), 100)}/100</span>
            </div>
            <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-slate-900 transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.min(selectedCell.value * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
