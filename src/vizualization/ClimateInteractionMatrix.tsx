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

/**
 * Award-style color encoding (deeper + more semantic)
 */
function getIntensityColor(value: number, active: boolean) {
  const v = clamp(value);
  const alpha = active ? 0.95 : 0.7;

  // richer, more “dataviz editorial” blue
  return `rgba(37, 99, 235, ${v * alpha})`;
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
        value: clamp(t * 0.95),
        narrative:
          "Rising heat destabilises ecosystem balance and reduces agricultural resilience.",
      },
      {
        row: "Surface Temperature",
        col: "Economic",
        value: clamp(t * 0.8),
        narrative:
          "Heat stress increases production costs and reduces economic efficiency.",
      },
      {
        row: "Surface Temperature",
        col: "Human",
        value: clamp(t * 0.85),
        narrative:
          "Human exposure to heat drives health risks and displacement pressure.",
      },
      {
        row: "Surface Temperature",
        col: "Disaster Risk",
        value: clamp(t * 0.9),
        narrative:
          "Higher baseline temperatures intensify extreme climate events.",
      },

      {
        row: "Sea Surface Temperature",
        col: "Disaster Risk",
        value: clamp(ss),
        narrative:
          "Warmer oceans significantly amplify cyclone intensity and storm energy.",
      },
      {
        row: "Sea Surface Temperature",
        col: "Environmental",
        value: clamp(ss * 0.85),
        narrative:
          "Marine ecosystems shift under thermal stress, reducing biodiversity stability.",
      },

      {
        row: "Sea Level",
        col: "Human",
        value: clamp(s),
        narrative:
          "Sea level rise directly threatens coastal habitation and freshwater access.",
      },
      {
        row: "Sea Level",
        col: "Economic",
        value: clamp(s * 0.9),
        narrative:
          "Coastal infrastructure damage produces long-term economic fragility.",
      },

      {
        row: "Rainfall",
        col: "Environmental",
        value: clamp(r * 0.8),
        narrative:
          "Rainfall variability disrupts ecological systems and soil stability.",
      },
      {
        row: "Rainfall",
        col: "Economic",
        value: clamp(r * 0.7),
        narrative:
          "Flooding and drought cycles disrupt supply chains and agriculture.",
      },
      {
        row: "Rainfall",
        col: "Disaster Risk",
        value: clamp(r),
        narrative:
          "Extreme rainfall events significantly increase flooding and landslide risk.",
      },
    ];
  }, [latest]);

  const getCell = (r: string, c: string) =>
    matrix.find((m) => m.row === r && m.col === c);

  const hoverRow = hover?.row;
  const hoverCol = hover?.col;

  return (
    <div className="w-full">

      {/* HEADER — more editorial like dataviz competition entries */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
          Climate System Interaction Map
        </h3>

        <p className="text-xs text-slate-500 max-w-2xl mx-auto mt-1 leading-relaxed">
          Climate drivers interact unevenly — producing disproportionate impacts
          across environmental, economic, and human systems.
        </p>
      </div>

      {/* GRID */}
      <div
        className="mx-auto grid gap-2"
        style={{
          gridTemplateColumns: `170px repeat(${COLS.length}, 1fr)`,
          width,
        }}
      >
        {/* top-left empty cell */}
        <div />

        {/* COLUMN HEADERS */}
        {COLS.map((col) => (
          <div
            key={col}
            className="text-[11px] font-semibold text-slate-500 text-center tracking-wide uppercase"
          >
            {col}
          </div>
        ))}

        {/* ROWS */}
        {ROWS.map((row) => (
          <div key={row} className="contents">
            {/* ROW LABEL */}
            <div
              className="text-[12px] font-medium text-slate-700 flex items-center pr-2"
              style={{
                opacity: hoverRow && hoverRow !== row ? 0.35 : 1,
              }}
            >
              {row}
            </div>

            {/* CELLS */}
            {COLS.map((col) => {
              const cell = getCell(row, col);
              const intensity = cell?.value ?? 0;

              const isActive =
                hover ? hover.row === row || hover.col === col : false;

              return (
                <div
                  key={row + col}
                  onMouseEnter={() => cell && setHover(cell)}
                  onMouseLeave={() => setHover(null)}
                  className="relative h-16 rounded-lg border border-slate-100 cursor-pointer overflow-hidden"
                  style={{
                    background: cell
                      ? getIntensityColor(intensity, isActive)
                      : "repeating-linear-gradient(45deg, #f8fafc, #f8fafc 4px, #ffffff 4px, #ffffff 8px)",
                    transform: isActive ? "scale(1.03)" : "scale(1)",
                    transition: "all 180ms ease",
                    boxShadow: isActive
                      ? "0 10px 25px rgba(0,0,0,0.08)"
                      : "none",
                  }}
                >
                  {cell ? (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white/90">
                      {Math.round(intensity * 100)}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-300">
                      —
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* STORY PANEL — more “editorial insight card” */}
      {hover && (
        <div className="mt-6 p-5 border rounded-xl bg-white shadow-sm">
          <div className="text-xs font-semibold text-slate-900">
            {hover.row} → {hover.col}
          </div>

          <div className="text-xs text-slate-600 mt-2 leading-relaxed">
            {hover.narrative}
          </div>

          <div className="mt-3 text-[10px] text-slate-400">
            Coupling strength:{" "}
            <span className="font-semibold text-slate-700">
              {Math.round(hover.value * 100)}/100
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
