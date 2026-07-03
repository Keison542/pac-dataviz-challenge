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

  const strongest = useMemo(() => {
    return [...matrix].sort((a, b) => b.value - a.value)[0];
  }, [matrix]);

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

    story += `In ${selectedCountry}, climate drivers interact across multiple systems. `;

    if (t > 0.5) {
      story += `Rising surface temperatures (${tempImpact}% impact) are the dominant force, altering ecosystems and increasing health risks. `;
    } else if (t > 0.2) {
      story += `Moderate surface warming (${tempImpact}% impact) is reshaping environmental conditions and human well-being. `;
    }

    if (ss > 0.5) {
      story += `Warmer oceans (${sstImpact}% impact) are fueling stronger cyclones and extreme weather. `;
    } else if (ss > 0.2) {
      story += `Sea surface temperatures are rising, contributing to increased storm activity. `;
    }

    if (s > 0.5) {
      story += `Sea-level rise (${seaImpact}% impact) threatens coastal communities and infrastructure. `;
    } else if (s > 0.2) {
      story += `Gradual sea-level rise (${seaImpact}% impact) is increasing coastal vulnerability. `;
    }

    if (r > 0.5) {
      story += `Extreme rainfall (${rainImpact}% impact) disrupts agriculture and drives economic losses. `;
    } else if (r > 0.2) {
      story += `Changing rainfall patterns (${rainImpact}% impact) are affecting agriculture and increasing flood risk. `;
    }

    const strongestPct = Math.min(Math.round(strongest.value * 100), 100);
    story += `The strongest interaction is between ${strongest.row} and ${strongest.col} (${strongestPct}%).`;

    return story;
  };

  const storyText = buildStory();

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
          "Ecosystem disruption",
          "Reduced agricultural productivity",
          "Increased health risks"
        ]
      },
      { 
        signal: "Sea Surface Temperature", 
        impact: Math.min(Math.round(sstImpacts * 100), 100), 
        raw: ss,
        consequences: [
          "Stronger cyclones",
          "Coral bleaching",
          "Disrupted fisheries"
        ]
      },
      { 
        signal: "Sea Level", 
        impact: Math.min(Math.round(seaImpacts * 100), 100), 
        raw: s,
        consequences: [
          "Coastal flooding",
          "Community displacement",
          "Saltwater intrusion"
        ]
      },
      { 
        signal: "Rainfall", 
        impact: Math.min(Math.round(rainImpacts * 100), 100), 
        raw: r,
        consequences: [
          "Flooding and landslides",
          "Agricultural damage",
          "Infrastructure destruction"
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

  const getBarColor = (signal: string) => {
    const colors: Record<string, string> = {
      "Surface Temperature": "#334155",
      "Sea Surface Temperature": "#334155",
      "Sea Level": "#334155",
      "Rainfall": "#334155",
    };
    return colors[signal] || "#94a3b8";
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Strongest interaction */}
      {strongest && (
        <div className="mb-4 text-center text-xs text-slate-500">
          Strongest pathway: {strongest.row} → {strongest.col} ({Math.min(Math.round(strongest.value * 100), 100)}%)
        </div>
      )}

      {/* Correlation bars */}
      <div className="space-y-2">
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
                <div className="w-28 sm:w-36 text-right">
                  <span className="text-[10px] sm:text-xs text-slate-600">{item.signal}</span>
                </div>
                <div className="flex-1">
                  <div className="relative h-5 w-full bg-slate-100">
                    <div
                      className="absolute left-0 top-0 h-full transition-all duration-500"
                      style={{ width: `${Math.min(item.impact, 100)}%`, backgroundColor: barColor }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-[9px] sm:text-xs font-medium text-white">
                      {Math.min(item.impact, 100)}%
                    </span>
                  </div>
                </div>
                <div className="w-10 text-right">
                  <span className="text-[9px] sm:text-xs text-slate-400">{item.raw.toFixed(2)}</span>
                </div>
              </div>

              {/* Tooltip */}
              {isHovered && item.consequences && (
                <div className="absolute z-10 left-0 right-0 mt-1 p-3 bg-white border border-slate-200 shadow-sm">
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

      {/* Labels */}
      <div className="mt-2 flex justify-between text-[8px] sm:text-[9px] text-slate-400">
        <span>Low</span>
        <span>Impact strength (%)</span>
        <span>High</span>
      </div>

      {/* Fig 7 caption */}
      <p className="mt-4 text-[10px] sm:text-xs text-slate-500">
        Fig 7: Climate drivers and their impacts on environmental, economic, human, and disaster risk systems in {selectedCountry}.
      </p>

      {/* Story */}
      {storyText && (
        <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {storyText}
        </p>
      )}
    </div>
  );
}
