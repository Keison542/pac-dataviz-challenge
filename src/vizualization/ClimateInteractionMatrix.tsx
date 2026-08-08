"use client";

import { useMemo, useState } from "react";

type Props = {
  data: any[];
  selectedCountry: string;
};

type DriverKey =
  | "Surface Temperature"
  | "Sea Surface Temperature"
  | "Sea Level"
  | "Rainfall";

type ImpactPathway = {
  driver: DriverKey;
  system: string;
  value: number;
  impact: number;
  raw: number;
  narrative: string;
  consequences: string[];
};

const DRIVER_CONFIG: Record<
  DriverKey,
  {
    system: string;
    label: string;
    color: string;
    consequences: string[];
  }
> = {
  "Surface Temperature": {
    system: "Environmental / Human",
    label: "Surface temperature",
    color: "#334155",
    consequences: [
      "Ecosystem disruption",
      "Reduced agricultural productivity",
      "Increased heat and health risks",
    ],
  },

  "Sea Surface Temperature": {
    system: "Disaster Risk",
    label: "Sea surface temperature",
    color: "#475569",
    consequences: [
      "Stronger tropical cyclones",
      "Coral bleaching",
      "Disrupted fisheries",
    ],
  },

  "Sea Level": {
    system: "Human / Coastal",
    label: "Sea level",
    color: "#64748b",
    consequences: [
      "Coastal flooding",
      "Community displacement",
      "Saltwater intrusion",
    ],
  },

  Rainfall: {
    system: "Economic / Disaster Risk",
    label: "Rainfall",
    color: "#7c8798",
    consequences: [
      "Flooding and landslides",
      "Agricultural damage",
      "Infrastructure disruption",
    ],
  },
};

const DRIVER_ORDER: DriverKey[] = [
  "Surface Temperature",
  "Sea Surface Temperature",
  "Sea Level",
  "Rainfall",
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

/*
 * Converts the magnitude of each climate signal into a simple
 * impact-strength index between 0 and 100.
 *
 * IMPORTANT:
 * This is an index for visual comparison.
 * It is NOT a statistical correlation coefficient.
 */
function calculateImpact(value: number, driver: DriverKey): number {
  const magnitude = Math.abs(value);

  let scaled = 0;

  switch (driver) {
    case "Surface Temperature":
      scaled = magnitude / 1.5;
      break;

    case "Sea Surface Temperature":
      scaled = magnitude / 1.5;
      break;

    case "Sea Level":
      scaled = magnitude / 0.5;
      break;

    case "Rainfall":
      scaled = magnitude / 100;
      break;

    default:
      scaled = magnitude;
  }

  return Math.round(clamp(scaled) * 100);
}

export default function ClimateInteractionMatrix({
  data,
  selectedCountry,
}: Props) {
  const [hoveredDriver, setHoveredDriver] = useState<DriverKey | null>(null);

  /*
   * Filter records for selected country.
   */
  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter(
      (d) =>
        d &&
        typeof d.country === "string" &&
        d.country === selectedCountry
    );
  }, [data, selectedCountry]);

  /*
   * Rather than relying on the final array item,
   * identify the latest record by year when possible.
   */
  const latest = useMemo(() => {
    if (!filtered.length) return null;

    const sorted = [...filtered].sort((a, b) => {
      const yearA = Number(a.year ?? a.Year ?? 0);
      const yearB = Number(b.year ?? b.Year ?? 0);

      return yearA - yearB;
    });

    return sorted[sorted.length - 1];
  }, [filtered]);

  /*
   * Extract the latest climate-driver values.
   */
  const climateValues = useMemo(() => {
    if (!latest) return null;

    return {
      temperature: Number(latest.temp ?? 0),
      seaSurfaceTemperature: Number(
        latest.sea_surface_temperature ?? latest.sst ?? 0
      ),
      seaLevel: Number(latest.sea ?? latest.sea_level ?? 0),
      rainfall: Number(latest.rainfall ?? 0),
    };
  }, [latest]);

  /*
   * Build the four driver impact pathways.
   */
  const pathways = useMemo<ImpactPathway[]>(() => {
    if (!climateValues) return [];

    const values: Record<DriverKey, number> = {
      "Surface Temperature": climateValues.temperature,
      "Sea Surface Temperature": climateValues.seaSurfaceTemperature,
      "Sea Level": climateValues.seaLevel,
      Rainfall: climateValues.rainfall,
    };

    const systems: Record<DriverKey, string> = {
      "Surface Temperature": "Environmental / Human",
      "Sea Surface Temperature": "Disaster Risk",
      "Sea Level": "Human / Coastal",
      Rainfall: "Economic / Disaster Risk",
    };

    const narratives: Record<DriverKey, string> = {
      "Surface Temperature":
        "Rising temperatures can place pressure on ecosystems, agriculture and human health.",

      "Sea Surface Temperature":
        "Warmer ocean conditions can contribute to stronger tropical cyclones and marine ecosystem stress.",

      "Sea Level":
        "Rising sea levels increase exposure of coastal communities, infrastructure and freshwater resources.",

      Rainfall:
        "Changing rainfall patterns can increase flooding, landslides and disruption to agriculture and infrastructure.",
    };

    return DRIVER_ORDER.map((driver) => {
      const raw = values[driver];
      const impact = calculateImpact(raw, driver);

      return {
        driver,
        system: systems[driver],
        value: raw,
        impact,
        raw,
        narrative: narratives[driver],
        consequences: DRIVER_CONFIG[driver].consequences,
      };
    });
  }, [climateValues]);

  /*
   * Find strongest climate signal.
   */
  const strongest = useMemo(() => {
    if (!pathways.length) return null;

    return [...pathways].sort((a, b) => b.impact - a.impact)[0];
  }, [pathways]);

  /*
   * Calculate an overall index.
   *
   * This is the average strength of the four visual indicators,
   * not a statistical vulnerability score.
   */
  const overallImpact = useMemo(() => {
    if (!pathways.length) return 0;

    const total = pathways.reduce(
      (sum, pathway) => sum + pathway.impact,
      0
    );

    return Math.round(total / pathways.length);
  }, [pathways]);

  /*
   * Identify whether several drivers are simultaneously elevated.
   */
  const elevatedDrivers = useMemo(() => {
    return pathways.filter((p) => p.impact >= 50);
  }, [pathways]);

  /*
   * Build concise narrative.
   */
  const storyText = useMemo(() => {
    if (!strongest || !pathways.length) return null;

    const strongName = strongest.driver.toLowerCase();

    let story = `${selectedCountry} is experiencing climate pressure across several interacting systems. `;

    if (elevatedDrivers.length >= 3) {
      story +=
        `Three or more climate drivers show elevated impact strength, indicating that climate risks are occurring across multiple environmental and human systems. `;
    } else if (elevatedDrivers.length === 2) {
      story +=
        `Two climate drivers show elevated impact strength, indicating that climate pressures extend across more than one system. `;
    } else if (elevatedDrivers.length === 1) {
      story +=
        `One climate driver currently stands out more strongly than the others in the available data. `;
    } else {
      story +=
        `The available indicators show relatively lower impact strength across the four climate drivers. `;
    }

    story += `The strongest signal is ${strongName}, with an impact-strength index of ${strongest.impact}%. `;

    story += strongest.narrative;

    return story;
  }, [
    selectedCountry,
    strongest,
    pathways,
    elevatedDrivers,
  ]);

  /*
   * Format raw values for display.
   */
  const formatRawValue = (driver: DriverKey, value: number) => {
    switch (driver) {
      case "Surface Temperature":
      case "Sea Surface Temperature":
        return `${value.toFixed(2)} °C`;

      case "Sea Level":
        return `${value.toFixed(2)} m`;

      case "Rainfall":
        return `${value.toFixed(1)} mm`;

      default:
        return value.toFixed(2);
    }
  };

  if (!latest || !climateValues) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No climate interaction data available for {selectedCountry}.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ─────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">
              Climate drivers and impact pathways
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {selectedCountry} · Latest available climate indicators
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              Combined indicator
            </div>

            <div className="text-xl font-semibold text-slate-800">
              {overallImpact}%
            </div>

            <div className="text-[9px] text-slate-400">
              average impact strength
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          STRONGEST PATHWAY
      ───────────────────────────────────────────── */}
      {strongest && (
        <div className="mb-5 border-l-4 border-slate-700 bg-slate-50 px-4 py-3">
          <div className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
            Strongest climate signal
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-800">
              {strongest.driver}
            </span>

            <span className="text-slate-400">→</span>

            <span className="text-sm text-slate-600">
              {strongest.system}
            </span>

            <span className="text-sm font-semibold text-slate-800">
              ({strongest.impact}%)
            </span>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {strongest.narrative}
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          DRIVER BARS
      ───────────────────────────────────────────── */}
      <div className="space-y-4">
        {pathways.map((item) => {
          const isHovered = hoveredDriver === item.driver;
          const config = DRIVER_CONFIG[item.driver];

          return (
            <div
              key={item.driver}
              className="relative"
              onMouseEnter={() => setHoveredDriver(item.driver)}
              onMouseLeave={() => setHoveredDriver(null)}
            >
              {/* Driver heading */}
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: config.color,
                      }}
                    />

                    <span className="text-xs font-medium text-slate-700">
                      {item.driver}
                    </span>
                  </div>

                  <div className="ml-[18px] text-[9px] text-slate-400">
                    {item.system}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-xs font-semibold text-slate-700">
                    {item.impact}%
                  </div>

                  <div className="text-[9px] text-slate-400">
                    {formatRawValue(item.driver, item.raw)}
                  </div>
                </div>
              </div>

              {/* Impact bar */}
              <div className="ml-[18px] h-3 w-[calc(100%-18px)] overflow-hidden bg-slate-100">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${item.impact}%`,
                    backgroundColor: config.color,
                    opacity: isHovered ? 1 : 0.75,
                  }}
                />
              </div>

              {/* Hover explanation */}
              {isHovered && (
                <div className="ml-[18px] mt-2 border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <p className="text-[10px] leading-relaxed text-slate-600">
                    {item.narrative}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {item.consequences.map((consequence) => (
                      <span
                        key={consequence}
                        className="text-[9px] text-slate-500"
                      >
                        • {consequence}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────
          SCALE
      ───────────────────────────────────────────── */}
      <div className="ml-[18px] mt-3 flex items-center justify-between text-[8px] text-slate-400">
        <span>Lower</span>

        <span>
          Impact-strength index
        </span>

        <span>Higher</span>
      </div>

      {/* ─────────────────────────────────────────────
          PATHWAY EXPLANATION
      ───────────────────────────────────────────── */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              Climate drivers
            </div>

            <div className="mt-1 text-xs font-medium text-slate-700">
              Temperature · Ocean · Rainfall
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              Systems affected
            </div>

            <div className="mt-1 text-xs font-medium text-slate-700">
              Environment · Economy · People
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              Resulting risks
            </div>

            <div className="mt-1 text-xs font-medium text-slate-700">
              Flooding · Disasters · Displacement
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          FIGURE CAPTION
      ───────────────────────────────────────────── */}
      <p className="mt-5 text-[10px] sm:text-xs text-slate-500 leading-relaxed">
        Fig. 7: Climate drivers and their potential impact pathways across
        environmental, economic, human and disaster-risk systems in{" "}
        {selectedCountry}. Impact strength is a visual index derived from the
        magnitude of each available climate indicator; it should not be
        interpreted as a statistical correlation coefficient.
      </p>

      {/* ─────────────────────────────────────────────
          NARRATIVE
      ───────────────────────────────────────────── */}
      {storyText && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
          {storyText}
        </p>
      )}
    </div>
  );
}
