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

export default function ClimateInteractionMatrix({
  data,
  selectedCountry,
}: Props) {
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

  // ─── Find strongest interaction ───
  const strongest = useMemo(() => {
    return [...matrix].sort((a, b) => b.value - a.value)[0];
  }, [matrix]);

  // ─── Build narrative story ───
  const buildStory = () => {
    if (!latest || !strongest) return null;

    const t = Math.abs(latest.temp || 0);
    const r = Math.abs(latest.rainfall || 0);
    const s = Math.abs(latest.sea || 0);
    const ss = Math.abs(latest.sea_surface_temperature || 0);

    const tempImpact = Math.min(Math.round(t * 0.9 * 100), 100);
    const rainImpact = Math.min(Math.round(r * 100), 100);
    const seaImpact = Math.min(Math.round(s * 100), 100);
    const sstImpact = Math.min(Math.round(ss * 100), 100);

    let story = "";

    // Opening
    story += `In ${selectedCountry}, climate drivers interact across multiple systems, creating complex risk pathways. `;

    // Surface Temperature story
    if (t > 0.5) {
      story += `Rising surface temperatures (${tempImpact}% impact) are the dominant force, altering ecosystems and increasing health risks. `;
    } else if (t > 0.2) {
      story += `Moderate surface warming (${tempImpact}% impact) is reshaping environmental conditions and human well-being. `;
    }

    // Sea Surface Temperature story
    if (ss > 0.5) {
      story += `Warmer oceans (${sstImpact}% impact) are fueling stronger cyclones and extreme weather events. `;
    } else if (ss > 0.2) {
      story += `Sea surface temperatures are rising, contributing to increased storm activity. `;
    }

    // Sea Level story
    if (s > 0.5) {
      story += `Sea-level rise (${seaImpact}% impact) threatens coastal communities and infrastructure. `;
    } else if (s > 0.2) {
      story += `Gradual sea-level rise (${seaImpact}% impact) is increasing coastal vulnerability. `;
    }

    // Rainfall story
    if (r > 0.5) {
      story += `Extreme rainfall (${rainImpact}% impact) disrupts agriculture, damages infrastructure, and drives economic losses. `;
    } else if (r > 0.2) {
      story += `Changing rainfall patterns (${rainImpact}% impact) are affecting agriculture and increasing flood risk. `;
    }

    // Strongest interaction highlight
    const strongestPct = Math.min(Math.round(strongest.value * 100), 100);
    story += `The strongest interaction is between ${strongest.row} and ${strongest.col} (${strongestPct}% strength), where ${strongest.row.toLowerCase()} drives significant impacts on ${strongest.col.toLowerCase()} systems.`;

    return story;
  };

  const storyText = buildStory();

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
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
      {/* ─── STRONGEST INTERACTION BADGE ─── */}
      {strongest && (
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            Strongest pathway: {strongest.row} → {strongest.col}
            <span className="text-slate-400">·</span>
            {Math.min(Math.round(strongest.value * 100), 100)}% interaction
          </div>
        </div>
      )}

      {/* ─── FIG 7: CORRELATION ─── */}
      <div className="pt-4 border-t border-slate-200">
      

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

        {/* ─── FIG 7 DESCRIPTION ─── */}

          <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-800 tracking-tight">
            Fig 7: The correlation shows how climate drivers translate into impacts across environmental, economic, human, and disaster risk systems in {selectedCountry}
          </h3>
        </div>

        {/* ─── CLIMATE INSIGHT ─── */}
        {storyText && (
                <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                  {storyText}
                </p>
        )}
      </div>
    </div>
  );
}
