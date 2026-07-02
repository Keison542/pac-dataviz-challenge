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
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

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

  // ─── Calculate correlation data for Fig 7 ───
  const correlationData = useMemo(() => {
    if (!latest) return null;

    const t = Math.abs(latest.temp || 0);
    const r = Math.abs(latest.rainfall || 0);
    const s = Math.abs(latest.sea || 0);
    const ss = Math.abs(latest.sea_surface_temperature || 0);

    const tempImpacts = matrix
      .filter(m => m.row === "Surface Temperature")
      .reduce((sum, m) => sum + m.value, 0) / 2;

    const sstImpacts = matrix
      .filter(m => m.row === "Sea Surface Temperature")
      .reduce((sum, m) => sum + m.value, 0) / 1;

    const seaImpacts = matrix
      .filter(m => m.row === "Sea Level")
      .reduce((sum, m) => sum + m.value, 0) / 1;

    const rainImpacts = matrix
      .filter(m => m.row === "Rainfall")
      .reduce((sum, m) => sum + m.value, 0) / 2;

    return [
      { 
        signal: "Surface Temperature", 
        impact: Math.min(Math.round(tempImpacts * 100), 100), 
        raw: t,
        consequences: [
          "Ecosystem disruption and biodiversity loss",
          "Reduced agricultural productivity",
          "Increased human health risks from heat exposure"
        ]
      },
      { 
        signal: "Sea Surface Temperature", 
        impact: Math.min(Math.round(sstImpacts * 100), 100), 
        raw: ss,
        consequences: [
          "Stronger tropical cyclones and storms",
          "Coral bleaching and marine ecosystem damage",
          "Disrupted fisheries and coastal livelihoods"
        ]
      },
      { 
        signal: "Sea Level", 
        impact: Math.min(Math.round(seaImpacts * 100), 100), 
        raw: s,
        consequences: [
          "Coastal flooding and erosion",
          "Displacement of coastal communities",
          "Saltwater intrusion into freshwater sources"
        ]
      },
      { 
        signal: "Rainfall", 
        impact: Math.min(Math.round(rainImpacts * 100), 100), 
        raw: r,
        consequences: [
          "Flooding and landslide risks",
          "Agricultural damage and food insecurity",
          "Infrastructure destruction and economic losses"
        ]
      },
    ];
  }, [latest, matrix]);

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

  // Get bar color
  const getBarColor = (signal: string) => {
    const colors: Record<string, string> = {
      "Surface Temperature": "#ef4444",
      "Sea Surface Temperature": "#f59e0b",
      "Sea Level": "#3b82f6",
      "Rainfall": "#10b981",
    };
    return colors[signal] || "#94a3b8";
  };

  return (
    <div className="w-full flex flex-col items-center px-2 sm:px-4">
      {/* ─── HEADER ─── */}
      <div className="mb-4 text-center w-full max-w-4xl px-4">
        <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-500 tracking-wider uppercase mb-2">
          Climate System Dynamics
        </div>
        <h2 className="text-xl sm:text-2xl font-light text-slate-800 tracking-tight">
          Climate Interaction <span className="font-semibold text-slate-900">Pathways</span>
        </h2>
        <div className="w-12 h-0.5 bg-slate-300 mx-auto mt-3 mb-3" />
      </div>

      {/* ─── NARRATIVE ─── */}
      {narrativeText && (
        <div className="mb-5 text-center w-full max-w-3xl px-4">
          <p className="text-sm text-slate-700 leading-relaxed">{narrativeText}</p>
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
        <div className="h-2 w-20 sm:w-28 md:w-36" style={{ background: "linear-gradient(to right,#e2e8f0,#0f172a)" }} />
        <span>High</span>
      </div>

      {/* ─── MATRIX ─── */}
      <div className="w-full overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div
          className="mx-auto grid gap-0.5"
          style={{
            gridTemplateColumns: `minmax(70px,100px) repeat(${COLS.length}, minmax(35px,1fr))`,
            minWidth: "280px",
            maxWidth: "100%",
          }}
        >
          <div />
          {COLS.map((col) => (
            <div key={col} className="text-center text-[7px] sm:text-[8px] md:text-[9px] font-medium text-slate-500 px-0.5 leading-tight">
              {col}
            </div>
          ))}

          {ROWS.map((row) => (
            <div key={row} className="contents">
              <div className="flex items-center text-[8px] sm:text-[9px] md:text-[10px] text-slate-700 pr-1 leading-tight">
                {row}
              </div>
              {COLS.map((col) => {
                const cell = getCell(row, col);
                if (!cell) {
                  return <div key={`${row}-${col}`} className="h-5 border border-slate-100 bg-white" />;
                }
                const isSelected = selectedCell?.row === row && selectedCell?.col === col;
                const displayValue = Math.min(Math.round(cell.value * 100), 100);

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`h-5 border border-slate-200 transition-all duration-200 ${isSelected ? "ring-1 ring-slate-900 z-10" : ""}`}
                    style={{ backgroundColor: getColor(cell.value), cursor: "default" }}
                    onMouseEnter={() => setSelectedCell(cell)}
                    onMouseLeave={() => setSelectedCell(null)}
                  >
                    <div className="text-[7px] sm:text-[8px] font-semibold text-white leading-none text-center flex items-center justify-center h-full">
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ─── FIG 7: CORRELATION ─── */}
      <div className="mt-8 w-full max-w-3xl px-4">
        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-800 tracking-tight">
              Fig 7: Correlation of impact size against climate signals
            </h3>
            <span className="text-[10px] text-slate-400">{selectedCountry}</span>
          </div>

          <div className="space-y-3">
            {correlationData?.map((item, index) => {
              const barColor = getBarColor(item.signal);
              const isHovered = hoveredSignal === item.signal;

              return (
                <div key={index} className="relative">
                  <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onMouseEnter={() => setHoveredSignal(item.signal)}
                    onMouseLeave={() => setHoveredSignal(null)}
                  >
                    <div className="w-32 sm:w-40 text-right">
                      <span className="text-[10px] sm:text-xs text-slate-600">{item.signal}</span>
                    </div>
                    <div className="flex-1">
                      <div className="relative h-6 w-full bg-slate-100 rounded overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full transition-all duration-500"
                          style={{ width: `${Math.min(item.impact, 100)}%`, backgroundColor: barColor, opacity: 0.8 }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-[9px] sm:text-xs font-medium text-slate-700">
                          {Math.min(item.impact, 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-10 text-right">
                      <span className="text-[9px] sm:text-xs text-slate-400">{item.raw.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* ─── HOVER TOOLTIP WITH CONSEQUENCES ─── */}
                  {isHovered && item.consequences && (
                    <div className="absolute z-10 left-0 right-0 mt-1 p-3 bg-white border border-slate-200 rounded-lg shadow-lg">
                      <div className="text-xs font-medium text-slate-800 mb-1">
                        {item.signal} — {Math.min(item.impact, 100)}% impact
                      </div>
                      <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc list-inside">
                        {item.consequences.map((consequence, idx) => (
                          <li key={idx}>{consequence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between text-[8px] sm:text-[9px] text-slate-400">
            <span>Low impact →</span>
            <span className="text-center">Impact strength (%)</span>
            <span>← High impact</span>
          </div>

          <p className="mt-3 text-[10px] sm:text-xs text-slate-500 leading-relaxed">
            Hover over any bar to see the consequences of each climate signal.
          </p>
        </div>
      </div>

      {/* ─── DETAIL PANEL ─── */}
      {selectedCell && (
        <div className="mt-5 border-t border-slate-200 pt-4 w-full max-w-3xl px-4">
          <p className="text-sm sm:text-base leading-relaxed text-slate-700">{formatDetailSentence(selectedCell)}</p>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Interaction Strength</span>
              <span>{Math.min(Math.round(selectedCell.value * 100), 100)}/100</span>
            </div>
            <div className="mt-1 h-1 bg-slate-100">
              <div className="h-1 bg-slate-900 transition-all duration-300" style={{ width: `${Math.min(selectedCell.value * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
