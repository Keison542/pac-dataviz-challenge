"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { geoData } from "@/climatedata/pacificGeoData";
import { affectedPersons } from "@/climatedata/human_consequence/number_of_persons_affected";
import { disasterEconomicLoss } from "@/climatedata/economic_consequence/direct_disaster_economic_loss";
import { seaLevelAnomalies } from "@/climatedata/climate_drivers/sea_level_anomalies";
import { rainfallAnomalies } from "@/climatedata/climate_drivers/rainfall_anomalies";

const WIDTH = 1400;
const HEIGHT = 700;

// ─── Types ───
type RecordType = {
  country: string;
  value: number;
};

type Props = {
  data?: {
    economicLoss: RecordType[];
    cropYield: RecordType[];
    touristArrivals: RecordType[];
    livestockYield: RecordType[];
    climateAlteringLand: RecordType[];
    populationGrowth: RecordType[];
    affectedPersons: RecordType[];
  };
  selectedCountry?: string;
  className?: string;
};

// ─── Metric Configs ───
const METRIC_CONFIGS = {
  economicLoss: {
    label: "Economic Loss",
    unit: "USD",
    format: (v: number) => {
      const absV = Math.abs(v);
      if (absV >= 1_000_000_000) return `$${(absV / 1_000_000_000).toFixed(1)}B`;
      if (absV >= 1_000_000) return `$${(absV / 1_000_000).toFixed(1)}M`;
      if (absV >= 1_000) return `$${(absV / 1_000).toFixed(1)}K`;
      return `$${absV}`;
    }
  },
  cropYield: {
    label: "Crop Yield",
    unit: "t/ha",
    format: (v: number) => `${Math.abs(v).toFixed(1)} t/ha`
  },
  touristArrivals: {
    label: "Tourist Arrivals",
    unit: "visitors",
    format: (v: number) => `${Math.abs(v).toLocaleString()} visitors`
  },
  livestockYield: {
    label: "Livestock Yield",
    unit: "tons",
    format: (v: number) => `${Math.abs(v).toLocaleString()} tons`
  },
  climateAlteringLand: {
    label: "Climate-Altering Land",
    unit: "ha",
    format: (v: number) => `${Math.abs(v).toLocaleString()} ha`
  },
  populationGrowth: {
    label: "Population Growth",
    unit: "%",
    format: (v: number) => `${Math.abs(v).toFixed(1)}%`
  },
  affectedPersons: {
    label: "People Affected",
    unit: "people",
    format: (v: number) => `${Math.abs(v).toLocaleString()} people`
  }
};

const METRIC_KEYS = Object.keys(METRIC_CONFIGS);

// ─── Hazard Colors ───
const hazardColors = {
  cyclone: "#334155",
  flood: "#334155",
  drought: "#334155",
  seaLevelRise: "#334155",
};

// ─── Projection Functions ───
const projectLon = (lon: number) => {
  let x = lon;
  if (x < 120) x += 360;
  return ((x - 120) / 120) * WIDTH;
};

const projectLat = (lat: number) => {
  return HEIGHT - ((lat + 35) / 60) * HEIGHT;
};

function flattenCoordinates(geometry: any, result: number[][] = []): number[][] {
  if (!geometry) return result;
  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring: number[][]) =>
      ring.forEach((c) => result.push(c))
    );
  }
  if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((poly: number[][][]) =>
      poly.forEach((ring: number[][]) =>
        ring.forEach((c) => result.push(c))
      )
    );
  }
  return result;
}

function buildCentroids() {
  const grouped = new Map<string, number[][]>();
  geoData.features.forEach((feature: any) => {
    const name = feature.properties?.name;
    if (!name) return;
    const existing = grouped.get(name) || [];
    grouped.set(name, existing.concat(flattenCoordinates(feature.geometry)));
  });
  return Array.from(grouped.entries()).map(([name, coords]) => ({
    name,
    lon: coords.reduce((s, c) => s + c[0], 0) / coords.length,
    lat: coords.reduce((s, c) => s + c[1], 0) / coords.length,
  }));
}

// ─── Normalize function ───
const normalize = (value: number, max: number) => {
  if (max === 0) return 0;
  return Math.min(value / max, 1);
};

// ─── Build country data from props ───
function buildCountryData(data: Props['data']) {
  const map = new Map<string, Record<string, number>>();

  if (!data) return map;

  METRIC_KEYS.forEach((key) => {
    const records = data[key as keyof Props['data']] || [];
    records.forEach((d) => {
      if (!map.has(d.country)) {
        map.set(d.country, {});
      }
      const entry = map.get(d.country)!;
      entry[key] = (entry[key] || 0) + d.value;
    });
  });

  return map;
}

// ─── Compute composite scores ───
function computeCompositeScores(countryData: Map<string, Record<string, number>>) {
  if (countryData.size === 0) return [];

  const maxValues: Record<string, number> = {};
  METRIC_KEYS.forEach((key) => {
    let max = 0;
    for (const [_, values] of countryData) {
      const val = values[key] || 0;
      if (val > max) max = val;
    }
    maxValues[key] = max || 1;
  });

  const results: Array<{ country: string; values: Record<string, number>; compositeScore: number }> = [];
  for (const [country, values] of countryData) {
    let composite = 0;
    METRIC_KEYS.forEach((key) => {
      const raw = values[key] || 0;
      composite += normalize(raw, maxValues[key]);
    });
    results.push({ country, values, compositeScore: composite });
  }

  return results.sort((a, b) => b.compositeScore - a.compositeScore);
}

// ─── Build hazard lookup from imported data ───
function buildHazardLookup() {
  const lookup = new Map<
    string,
    { cyclone?: number; flood?: number; drought?: number; seaLevelRise?: number }
  >();

  if (affectedPersons && affectedPersons.length > 0) {
    affectedPersons.forEach((d) => {
      if (d.value > 0) {
        const existing = lookup.get(d.country) || {};
        lookup.set(d.country, {
          ...existing,
          cyclone: (existing.cyclone || 0) + d.value,
        });
      }
    });
  }

  if (rainfallAnomalies && rainfallAnomalies.length > 0) {
    rainfallAnomalies.forEach((d) => {
      if (Math.abs(d.value) > 0) {
        const existing = lookup.get(d.country) || {};
        lookup.set(d.country, {
          ...existing,
          flood: (existing.flood || 0) + Math.abs(d.value),
        });
      }
    });
  }

  if (seaLevelAnomalies && seaLevelAnomalies.length > 0) {
    seaLevelAnomalies.forEach((d) => {
      if (d.value > 0) {
        const existing = lookup.get(d.country) || {};
        lookup.set(d.country, {
          ...existing,
          seaLevelRise: (existing.seaLevelRise || 0) + d.value,
        });
      }
    });
  }

  if (disasterEconomicLoss && disasterEconomicLoss.length > 0) {
    disasterEconomicLoss.forEach((d) => {
      if (d.value > 0) {
        const existing = lookup.get(d.country) || {};
        lookup.set(d.country, {
          ...existing,
          drought: (existing.drought || 0) + d.value,
        });
      }
    });
  }

  return lookup;
}

function getMaxImpact(hazardLookup: Map<string, any>, hazardKey: string): number {
  let max = 0;
  for (const [_, data] of hazardLookup) {
    const val = data[hazardKey] || 0;
    if (val > max) max = val;
  }
  return max || 1;
}

export function PacificClimateStoryMap({ data, selectedCountry, className = "" }: Props) {
  const [activeHazard, setActiveHazard] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const countries = useMemo(() => buildCentroids(), []);
  const hazardLookup = useMemo(() => buildHazardLookup(), []);
  const countryData = useMemo(() => buildCountryData(data), [data]);
  const ranked = useMemo(() => computeCompositeScores(countryData), [countryData]);

  // Find top and bottom countries
  const topCountry = ranked.length > 0 ? ranked[0] : null;
  const bottomCountry = ranked.length > 0 ? ranked[ranked.length - 1] : null;

  // Calculate stats
  const stats = useMemo(() => {
    if (ranked.length === 0) return null;
    const scores = ranked.map(d => d.compositeScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const gapPercent = ((max - min) / avg) * 100;
    return { avg, max, min, gapPercent, count: ranked.length };
  }, [ranked]);

  const temperatureLine = Array.from({ length: 175 }, (_, i) => ({
    x: (i / 174) * WIDTH,
    y: 120 - i * 0.35 + Math.sin(i / 10) * 12,
  }));

  const path = temperatureLine
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const getCountryColor = (countryName: string) => {
    if (!activeHazard) return "#334155";
    const hazardData = hazardLookup.get(countryName);
    return hazardData?.[activeHazard as keyof typeof hazardData] ? "#334155" : "#e2e8f0";
  };

  const getImpactValue = (countryName: string, hazardKey: string): number => {
    const data = hazardLookup.get(countryName);
    return data?.[hazardKey as keyof typeof data] || 0;
  };

  const getCircleRadius = (countryName: string): number => {
    // Show size based on composite score when no hazard is active
    if (!activeHazard) {
      const score = getCompositeScore(countryName);
      if (score === 0) return 4;
      // Scale from 4px (low score) to 16px (high score)
      const maxScore = ranked.length > 0 ? ranked[0].compositeScore : 1;
      const normalized = Math.min(score / maxScore, 1);
      return 4 + normalized * 12;
    }

    const impact = getImpactValue(countryName, activeHazard);
    if (impact === 0) return 3;

    const maxImpact = getMaxImpact(hazardLookup, activeHazard);
    const normalized = Math.min(impact / maxImpact, 1);
    return 4 + normalized * 14;
  };

  const isHighlighted = (countryName: string) => {
    if (!activeHazard) return false;
    return getImpactValue(countryName, activeHazard) > 0;
  };

  const getImpactLabel = (countryName: string): string => {
    if (!activeHazard) return "";
    const impact = getImpactValue(countryName, activeHazard);
    if (impact === 0) return "";

    const labels: Record<string, string> = {
      cyclone: `${Math.round(impact).toLocaleString()} affected`,
      flood: `${impact.toFixed(1)}mm anomaly`,
      drought: `$${impact.toFixed(0)}M loss`,
      seaLevelRise: `${impact.toFixed(1)}mm rise`,
    };

    return labels[activeHazard] || `${impact}`;
  };

  // Get composite score for a country
  const getCompositeScore = (countryName: string): number => {
    const found = ranked.find(d => d.country === countryName);
    return found?.compositeScore || 0;
  };

  // Get rank for a country
  const getRank = (countryName: string): number => {
    const found = ranked.findIndex(d => d.country === countryName);
    return found + 1;
  };

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" style={{ background: "transparent" }}>
      <rect width={WIDTH} height={HEIGHT} fill="transparent" />

      <path d={path} fill="none" stroke="#94a3b8" strokeWidth={1.5} />

      <text x={30} y={50} fontSize={12} fontWeight="400" fill="#475569" letterSpacing="0.05em">
        Surface temperature anomaly
      </text>

      <text x={30} y={70} fontSize={10} fill="#94a3b8">
        1850
      </text>

      <text x={WIDTH - 70} y={70} fontSize={10} fill="#94a3b8">
        2025
      </text>

      <text
        x={WIDTH / 2}
        y={HEIGHT / 2}
        textAnchor="middle"
        fontSize={64}
        fontWeight="300"
        fill="#e2e8f0"
        letterSpacing="0.15em"
      >
        PACIFIC OCEAN
      </text>

      {/* Countries with scores always visible */}
      {countries.map((country) => {
        const x = projectLon(country.lon);
        const y = projectLat(country.lat);
        const highlighted = isHighlighted(country.name);
        const radius = getCircleRadius(country.name);
        const impactLabel = getImpactLabel(country.name);
        const isHovered = hoveredCountry === country.name;
        const compositeScore = getCompositeScore(country.name);
        const rank = getRank(country.name);
        const isTopCountry = topCountry?.country === country.name;
        const isBottomCountry = bottomCountry?.country === country.name;

        // Only show score for countries that have data
        const showScore = compositeScore > 0;

        return (
          <g 
            key={country.name}
            onMouseEnter={() => setHoveredCountry(country.name)}
            onMouseLeave={() => setHoveredCountry(null)}
          >
            {/* Circle - size represents score */}
            <motion.circle
              cx={x}
              cy={y}
              r={radius}
              animate={{
                fill: getCountryColor(country.name),
                scale: highlighted || isHovered ? 1.3 : 1,
              }}
              transition={{ duration: 0.2 }}
            />

            {/* Country name */}
            <motion.text
              x={x + radius + 6}
              y={y + 3}
              fontSize={10}
              fontWeight={isTopCountry ? "600" : isBottomCountry ? "400" : "400"}
              fill={getCountryColor(country.name)}
            >
              {country.name}
            </motion.text>

            {/* Composite score - always visible for countries with data */}
            {showScore && !activeHazard && (
              <motion.text
                x={x + radius + 6}
                y={y + 16}
                fontSize={8}
                fill={isTopCountry ? "#334155" : "#94a3b8"}
                fontWeight={isTopCountry ? "600" : "400"}
              >
                {compositeScore.toFixed(2)}
                {isTopCountry && " ★"}
              </motion.text>
            )}

            {/* Impact label when hazard is active */}
            {highlighted && impactLabel && (
              <motion.text
                x={x + radius + 6}
                y={y + 16}
                fontSize={8}
                fill="#94a3b8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {impactLabel}
              </motion.text>
            )}

            {/* Rank indicator on hover */}
            {isHovered && !activeHazard && showScore && (
              <motion.text
                x={x + radius + 6}
                y={y + 26}
                fontSize={7}
                fill="#cbd5e1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                Rank #{rank} of {ranked.length}
              </motion.text>
            )}
          </g>
        );
      })}

      {/* Stats Display - Top/Bottom Countries */}
      {stats && topCountry && bottomCountry && (
        <g transform={`translate(30, ${HEIGHT - 110})`}>
          <text x={0} y={0} fontSize={10} fill="#94a3b8" letterSpacing="0.05em">
            Highest: {topCountry.country} ({topCountry.compositeScore.toFixed(2)})
          </text>
          <text x={0} y={16} fontSize={10} fill="#94a3b8" letterSpacing="0.05em">
            Lowest: {bottomCountry.country} ({bottomCountry.compositeScore.toFixed(2)})
          </text>
          <text x={0} y={32} fontSize={10} fill="#94a3b8" letterSpacing="0.05em">
            Gap: {stats.gapPercent.toFixed(0)}% · {stats.count} countries
          </text>
        </g>
      )}

      {/* Legend */}
      <g transform={`translate(30, ${HEIGHT - 70})`}>
        <text x={0} y={0} fontSize={10} fill="#94a3b8" letterSpacing="0.05em">
          {activeHazard ? "Hazard impact" : "Circle size = composite score"}
        </text>

        {[
          { key: "cyclone", label: "cyclones" },
          { key: "flood", label: "flooding" },
          { key: "drought", label: "drought" },
          { key: "seaLevelRise", label: "sea level rise" },
        ].map((item, i) => (
          <g
            key={item.key}
            onMouseEnter={() => setActiveHazard(item.key)}
            onMouseLeave={() => setActiveHazard(null)}
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={140 + i * 90}
              cy={-4}
              r={4}
              fill={activeHazard === item.key ? "#334155" : "#cbd5e1"}
            />
            <text
              x={150 + i * 90}
              y={0}
              fontSize={10}
              fill={activeHazard === item.key ? "#334155" : "#94a3b8"}
              fontWeight={activeHazard === item.key ? "500" : "400"}
            >
              {item.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export default PacificClimateStoryMap;
