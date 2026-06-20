"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { geoData } from "@/climatedata/pacificGeoData";
import { affectedPersons } from "@/climatedata/human_consequence/number_of_persons_affected";
import { disasterEconomicLoss } from "@/climatedata/economic_consequence/direct_disaster_economic_loss";
import { seaLevelAnomalies } from "@/climatedata/climate_drivers/sea_level_anomalies";
import { rainfallAnomalies } from "@/climatedata/climate_drivers/rainfall_anomalies";

const WIDTH = 1400;
const HEIGHT = 700;
const TIMELINE_HEIGHT = 120;

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

// ─── Color Scale for Vulnerability ───
const VULNERABILITY_COLORS = {
  high: "#1a1a2e",
  medium: "#4a4a6a",
  low: "#94a3b8",
  none: "#e2e8f0"
};

// ─── Hazard Colors ───
const HAZARD_COLORS = {
  cyclone: "#7c3aed",
  flood: "#2563eb",
  drought: "#ea580c",
  seaLevelRise: "#dc2626",
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

// ─── Get vulnerability level ───
function getVulnerabilityLevel(score: number, maxScore: number): 'high' | 'medium' | 'low' | 'none' {
  if (score === 0) return 'none';
  const percentage = score / maxScore;
  if (percentage >= 0.7) return 'high';
  if (percentage >= 0.4) return 'medium';
  return 'low';
}

function getColorForScore(score: number, maxScore: number): string {
  const level = getVulnerabilityLevel(score, maxScore);
  switch (level) {
    case 'high': return VULNERABILITY_COLORS.high;
    case 'medium': return VULNERABILITY_COLORS.medium;
    case 'low': return VULNERABILITY_COLORS.low;
    default: return VULNERABILITY_COLORS.none;
  }
}

export function PacificClimateStoryMap({ data, selectedCountry, className = "" }: Props) {
  const [activeHazard, setActiveHazard] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const countries = useMemo(() => buildCentroids(), []);
  const hazardLookup = useMemo(() => buildHazardLookup(), []);
  const countryData = useMemo(() => buildCountryData(data), [data]);
  const ranked = useMemo(() => computeCompositeScores(countryData), [countryData]);

  const topCountry = ranked.length > 0 ? ranked[0] : null;
  const bottomCountry = ranked.length > 0 ? ranked[ranked.length - 1] : null;
  const maxScore = ranked.length > 0 ? ranked[0].compositeScore : 1;

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
    y: 70 - i * 0.35 + Math.sin(i / 10) * 12,
  }));

  const path = temperatureLine
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const getCountryColor = (countryName: string) => {
    if (activeHazard) {
      const hazardData = hazardLookup.get(countryName);
      return hazardData?.[activeHazard as keyof typeof hazardData]
        ? HAZARD_COLORS[activeHazard as keyof typeof HAZARD_COLORS]
        : "#dbe4ee";
    }
    const score = getCompositeScore(countryName);
    return getColorForScore(score, maxScore);
  };

  const getImpactValue = (countryName: string, hazardKey: string): number => {
    const data = hazardLookup.get(countryName);
    return data?.[hazardKey as keyof typeof data] || 0;
  };

  const getCircleRadius = (countryName: string): number => {
    if (activeHazard) {
      const impact = getImpactValue(countryName, activeHazard);
      if (impact === 0) return 3;
      const maxImpact = getMaxImpact(hazardLookup, activeHazard);
      const normalized = Math.min(impact / maxImpact, 1);
      return 4 + normalized * 14;
    }

    const score = getCompositeScore(countryName);
    if (score === 0) return 3;
    const normalized = Math.min(score / maxScore, 1);
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

  const getCompositeScore = (countryName: string): number => {
    const found = ranked.find(d => d.country === countryName);
    return found?.compositeScore || 0;
  };

  const getVulnerabilityLabel = (score: number): string => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 70) return 'High';
    if (percentage >= 40) return 'Medium';
    if (percentage > 0) return 'Low';
    return 'None';
  };

  useEffect(() => {
    const timer = setTimeout(() => { setShowInstructions(false); }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Compact annotation position ───
  const annotationX = WIDTH - 220;
  const annotationStartY = 60;

  return (
    <div className={`w-full ${className}`}>
      {/* ─── NARRATIVE HEADER ─── */}
      <div className="mb-4 px-1">
        <p className="text-sm uppercase tracking-wider text-slate-500 font-medium">
          Regional Vulnerability Map
        </p>
        <h3 className="text-xl font-semibold text-slate-900 mt-0.5">
          Climate exposure is uneven across Pacific nations
        </h3>
        <p className="text-slate-500 mt-1.5 max-w-3xl text-sm leading-relaxed">
          Circle size represents composite vulnerability.
          Hover hazards below to reveal countries experiencing
          flooding, drought, cyclone impacts, or sea-level rise.
        </p>
      </div>

      {/* ─── MAP ─── */}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" style={{ background: "transparent" }}>
        <rect width={WIDTH} height={HEIGHT} fill="transparent" />

        {/* ─── INSTRUCTIONS PANEL ─── */}
        <g opacity={showInstructions ? 1 : 0} transition={{ duration: 0.5 }}>
          <rect x={WIDTH / 2 - 250} y={20} width={500} height={80} rx={8} fill="white" stroke="#e2e8f0" strokeWidth={1} />
          <text x={WIDTH / 2} y={45} textAnchor="middle" fontSize={13} fontWeight="600" fill="#1a1a2e">
            🗺️ How to read this map
          </text>
          <text x={WIDTH / 2} y={65} textAnchor="middle" fontSize={11} fill="#64748b">
            • Circle size & shade show vulnerability score
          </text>
          <text x={WIDTH / 2} y={82} textAnchor="middle" fontSize={11} fill="#64748b">
            • Hover a country for details · Hover hazards below to explore impacts
          </text>
        </g>

        {/* ─── OCEAN LABEL ─── */}
        <text
          x={WIDTH / 2}
          y={HEIGHT / 2}
          textAnchor="middle"
          fontSize={32}
          fill="#cbd5e1"
          opacity={0.08}
          fontWeight="300"
          letterSpacing="0.15em"
        >
          PACIFIC OCEAN
        </text>

        {/* ─── COUNTRIES ─── */}
        {countries.map((country) => {
          const x = projectLon(country.lon);
          const y = projectLat(country.lat);
          const highlighted = isHighlighted(country.name);
          const radius = getCircleRadius(country.name);
          const impactLabel = getImpactLabel(country.name);
          const isHovered = hoveredCountry === country.name;
          const compositeScore = getCompositeScore(country.name);
          const isTopCountry = topCountry?.country === country.name;
          const color = getCountryColor(country.name);
          const showScore = compositeScore > 0;
          const vulnerabilityLabel = getVulnerabilityLabel(compositeScore);
          const scorePercentage = maxScore > 0 ? ((compositeScore / maxScore) * 100).toFixed(0) : '0';

          return (
            <g 
              key={country.name}
              onMouseEnter={() => setHoveredCountry(country.name)}
              onMouseLeave={() => setHoveredCountry(null)}
              onClick={() => setShowInstructions(false)}
            >
              {/* Circle */}
              <motion.circle
                cx={x}
                cy={y}
                r={radius}
                fill={color}
                stroke="white"
                strokeWidth={1.5}
                animate={{
                  scale: highlighted || isHovered ? 1.25 : 1,
                  opacity: activeHazard && !highlighted ? 0.18 : 1,
                  strokeWidth: isTopCountry ? 2.5 : 1.5,
                  stroke: isTopCountry ? "#1a1a2e" : "white",
                }}
                transition={{ duration: 0.2 }}
              />

              {/* Country name */}
              <motion.text
                x={x + radius + 6}
                y={y + 3}
                fontSize={10}
                fontWeight={isTopCountry ? "600" : "400"}
                fill={color === VULNERABILITY_COLORS.none ? "#94a3b8" : color}
                animate={{
                  opacity: activeHazard && !highlighted ? 0.18 : 1
                }}
              >
                {country.name}
              </motion.text>

              {/* Vulnerability score on hover */}
              {isHovered && !activeHazard && showScore && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <rect
                    x={x + radius + 4}
                    y={y + 12}
                    width={60}
                    height={20}
                    rx={3}
                    fill="white"
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                  />
                  <text
                    x={x + radius + 9}
                    y={y + 26}
                    fontSize={8}
                    fontWeight="500"
                    fill="#1a1a2e"
                  >
                    Score: {compositeScore.toFixed(2)}
                  </text>
                </motion.g>
              )}

              {/* Impact label when hazard is active */}
              {highlighted && impactLabel && (
                <motion.text
                  x={x + radius + 6}
                  y={y + 16}
                  fontSize={8}
                  fill="#334155"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {impactLabel}
                </motion.text>
              )}
            </g>
          );
        })}

        {/* ─── COMPACT ANNOTATIONS ─── */}
        {stats && topCountry && (
          <g transform={`translate(${annotationX}, ${annotationStartY})`}>
            <text x={0} y={0} fontSize={8} fontWeight="600" fill="#1a1a2e" letterSpacing="0.05em">
              HIGHEST VULNERABILITY
            </text>
            <text x={0} y={16} fontSize={13} fontWeight="600" fill="#1a1a2e">
              {topCountry.country}
            </text>
            <text x={0} y={30} fontSize={9} fill="#64748b">
              Score {topCountry.compositeScore.toFixed(2)}
            </text>

            <text x={0} y={52} fontSize={8} fontWeight="600" fill="#1a1a2e" letterSpacing="0.05em">
              REGIONAL GAP
            </text>
            <text x={0} y={68} fontSize={13} fontWeight="600" fill="#1a1a2e">
              {stats.gapPercent.toFixed(0)}%
            </text>
            <text x={0} y={82} fontSize={9} fill="#64748b">
              between highest and average
            </text>

            <text x={0} y={104} fontSize={8} fontWeight="600" fill="#1a1a2e" letterSpacing="0.05em">
              COUNTRIES
            </text>
            <text x={0} y={120} fontSize={13} fontWeight="600" fill="#1a1a2e">
              {stats.count}
            </text>
            <text x={0} y={134} fontSize={9} fill="#64748b">
              across the Pacific region
            </text>
          </g>
        )}

        {/* ─── HAZARD FILTERS ─── */}
        <g transform={`translate(30, ${HEIGHT - 60})`}>
          <text x={0} y={0} fontSize={9} fill="#94a3b8" letterSpacing="0.05em">
            {activeHazard ? "▼ Showing hazard impact" : "▼ Filter by hazard"}
          </text>

          {[
            { key: "cyclone", label: "Cyclones", color: HAZARD_COLORS.cyclone },
            { key: "flood", label: "Flooding", color: HAZARD_COLORS.flood },
            { key: "drought", label: "Drought", color: HAZARD_COLORS.drought },
            { key: "seaLevelRise", label: "Sea-level rise", color: HAZARD_COLORS.seaLevelRise },
          ].map((item, i) => {
            const xPos = 140 + i * 105;
            const isActive = activeHazard === item.key;

            return (
              <g
                key={item.key}
                onMouseEnter={() => setActiveHazard(item.key)}
                onMouseLeave={() => setActiveHazard(null)}
                onClick={() => setShowInstructions(false)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={xPos}
                  y={-12}
                  width={95}
                  height={26}
                  rx={4}
                  fill={isActive ? "#f1f5f9" : "transparent"}
                  stroke={isActive ? "#cbd5e1" : "transparent"}
                  strokeWidth={1}
                />
                
                {/* Color chip */}
                <rect
                  x={xPos + 6}
                  y={-4}
                  width={12}
                  height={12}
                  rx={2}
                  fill={item.color}
                  opacity={isActive ? 1 : 0.5}
                />

                <text
                  x={xPos + 24}
                  y={4}
                  fontSize={10}
                  fill={isActive ? "#1a1a2e" : "#94a3b8"}
                  fontWeight={isActive ? "500" : "400"}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ─── TEMPERATURE TIMELINE ─── */}
      <svg
        viewBox={`0 0 ${WIDTH} ${TIMELINE_HEIGHT}`}
        className="w-full h-auto mt-8"
        style={{ background: "transparent" }}
      >
        <rect width={WIDTH} height={TIMELINE_HEIGHT} fill="transparent" />

        {/* Title */}
        <text x={0} y={20} fontSize={12} fontWeight="600" fill="#1a1a2e" letterSpacing="0.02em">
          Surface temperature anomaly across the Pacific
        </text>

        <text x={0} y={36} fontSize={9} fill="#94a3b8">
          Historical warming trend (1850–2025)
        </text>

        {/* Trend line */}
        <path
          d={path}
          fill="none"
          stroke="#475569"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Baseline */}
        <line x1={0} y1={70} x2={WIDTH} y2={70} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />

        {/* Labels */}
        <text x={0} y={105} fontSize={9} fill="#64748b">
          1850
        </text>

        <text x={WIDTH - 45} y={105} fontSize={9} fill="#64748b">
          2025
        </text>

        {/* Anomaly indicator */}
        <text x={WIDTH - 45} y={32} fontSize={9} fill="#475569" fontWeight="500">
          +1.2°C
        </text>
      </svg>

      {/* ─── KEY TAKEAWAY ─── */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
          {topCountry && (
            <span>
              <span className="font-medium text-slate-700">{topCountry.country}</span> shows the highest
              composite vulnerability across the Pacific, with a {stats?.gapPercent.toFixed(0)}% gap
              between the highest and average scores across {stats?.count} countries.
              {activeHazard && ` Currently viewing impacts from ${activeHazard}.`}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default PacificClimateStoryMap;
