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

const hazardColors = {
  cyclone: "#334155",
  flood: "#334155",
  drought: "#334155",
  seaLevelRise: "#334155",
};

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

function buildHazardLookup() {
  const lookup = new Map<
    string,
    { cyclone?: number; flood?: number; drought?: number; seaLevelRise?: number }
  >();

  affectedPersons.forEach((d) => {
    if (d.value > 0) {
      const existing = lookup.get(d.country) || {};
      lookup.set(d.country, {
        ...existing,
        cyclone: (existing.cyclone || 0) + d.value,
      });
    }
  });

  rainfallAnomalies.forEach((d) => {
    if (Math.abs(d.value) > 0) {
      const existing = lookup.get(d.country) || {};
      lookup.set(d.country, {
        ...existing,
        flood: (existing.flood || 0) + Math.abs(d.value),
      });
    }
  });

  seaLevelAnomalies.forEach((d) => {
    if (d.value > 0) {
      const existing = lookup.get(d.country) || {};
      lookup.set(d.country, {
        ...existing,
        seaLevelRise: (existing.seaLevelRise || 0) + d.value,
      });
    }
  });

  disasterEconomicLoss.forEach((d) => {
    if (d.value > 0) {
      const existing = lookup.get(d.country) || {};
      lookup.set(d.country, {
        ...existing,
        drought: (existing.drought || 0) + d.value,
      });
    }
  });

  return lookup;
}

// Get max impact value for a hazard across all countries
function getMaxImpact(hazardLookup: Map<string, any>, hazardKey: string): number {
  let max = 0;
  for (const [_, data] of hazardLookup) {
    const val = data[hazardKey] || 0;
    if (val > max) max = val;
  }
  return max || 1;
}

export function PacificClimateStoryMap() {
  const [activeHazard, setActiveHazard] = useState<string | null>(null);

  const countries = useMemo(() => buildCentroids(), []);
  const hazardLookup = useMemo(() => buildHazardLookup(), []);

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
    if (!activeHazard) return 5;

    const impact = getImpactValue(countryName, activeHazard);
    if (impact === 0) return 3;

    const maxImpact = getMaxImpact(hazardLookup, activeHazard);
    const normalized = Math.min(impact / maxImpact, 1);

    // Scale from 4px (low impact) to 18px (high impact)
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

    // Format based on hazard type
    const labels: Record<string, string> = {
      cyclone: `${Math.round(impact).toLocaleString()} affected`,
      flood: `${impact.toFixed(1)}mm anomaly`,
      drought: `$${impact.toFixed(0)}M loss`,
      seaLevelRise: `${impact.toFixed(1)}mm rise`,
    };

    return labels[activeHazard] || `${impact}`;
  };

  return (
    <div className="w-full bg-white">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
        {/* Ocean */}
        <rect width={WIDTH} height={HEIGHT} fill="#f1f5f9" />

        {/* Temperature Trend */}
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

        {/* Ocean Label */}
        <text
          x={WIDTH / 2}
          y={HEIGHT / 2}
          textAnchor="middle"
          fontSize={64}
          fontWeight="300"
          fill="#cbd5e1"
          letterSpacing="0.15em"
        >
          PACIFIC OCEAN
        </text>

        {/* Countries */}
        {countries.map((country) => {
          const x = projectLon(country.lon);
          const y = projectLat(country.lat);
          const highlighted = isHighlighted(country.name);
          const radius = getCircleRadius(country.name);
          const impactLabel = getImpactLabel(country.name);

          return (
            <g key={country.name}>
              <motion.circle
                cx={x}
                cy={y}
                r={radius}
                animate={{
                  fill: getCountryColor(country.name),
                  scale: highlighted ? 1.2 : 1,
                }}
                transition={{ duration: 0.2 }}
              />

              <motion.text
                x={x + radius + 6}
                y={y + 3}
                fontSize={10}
                fontWeight={highlighted ? "500" : "400"}
                fill={getCountryColor(country.name)}
              >
                {country.name}
              </motion.text>

              {/* Impact label - only show on hover */}
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
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(30, ${HEIGHT - 70})`}>
          <text x={0} y={0} fontSize={10} fill="#94a3b8" letterSpacing="0.05em">
            Hover to explore
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
    </div>
  );
}

export default PacificClimateStoryMap;
