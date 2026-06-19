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
  cyclone: "#ef4444",
  flood: "#3b82f6",
  drought: "#f59e0b",
  seaLevelRise: "#14b8a6",
};

const projectLon = (lon: number) => {
  let x = lon;

  if (x < 120) {
    x += 360;
  }

  return ((x - 120) / 120) * WIDTH;
};

const projectLat = (lat: number) => {
  return HEIGHT - ((lat + 35) / 60) * HEIGHT;
};

function flattenCoordinates(
  geometry: any,
  result: number[][] = []
): number[][] {
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

    grouped.set(
      name,
      existing.concat(
        flattenCoordinates(feature.geometry)
      )
    );
  });

  return Array.from(grouped.entries()).map(
    ([name, coords]) => ({
      name,
      lon:
        coords.reduce((s, c) => s + c[0], 0) /
        coords.length,
      lat:
        coords.reduce((s, c) => s + c[1], 0) /
        coords.length,
    })
  );
}

function buildHazardLookup() {
  const lookup = new Map<
    string,
    {
      cyclone?: boolean;
      flood?: boolean;
      drought?: boolean;
      seaLevelRise?: boolean;
    }
  >();

  affectedPersons.forEach((d) => {
    if (d.value > 0) {
      lookup.set(d.country, {
        ...(lookup.get(d.country) || {}),
        cyclone: true,
      });
    }
  });

  rainfallAnomalies.forEach((d) => {
    if (Math.abs(d.value) > 0) {
      lookup.set(d.country, {
        ...(lookup.get(d.country) || {}),
        flood: true,
      });
    }
  });

  seaLevelAnomalies.forEach((d) => {
    if (d.value > 0) {
      lookup.set(d.country, {
        ...(lookup.get(d.country) || {}),
        seaLevelRise: true,
      });
    }
  });

  disasterEconomicLoss.forEach((d) => {
    if (d.value > 0) {
      lookup.set(d.country, {
        ...(lookup.get(d.country) || {}),
        drought: true,
      });
    }
  });

  return lookup;
}

export function PacificClimateStoryMap() {
  const [activeHazard, setActiveHazard] = useState<string | null>(null);

  const countries = useMemo(
    () => buildCentroids(),
    []
  );

  const hazardLookup = useMemo(
    () => buildHazardLookup(),
    []
  );

  const temperatureLine = Array.from(
    { length: 175 },
    (_, i) => ({
      x: (i / 174) * WIDTH,
      y:
        120 -
        i * 0.35 +
        Math.sin(i / 10) * 12,
    })
  );

  const path = temperatureLine
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
    )
    .join(" ");

  const getCountryColor = (
    countryName: string
  ) => {
    if (!activeHazard) {
      return "#0f172a";
    }

    const hazardData = hazardLookup.get(countryName);
    const isAffected = hazardData?.[activeHazard as keyof typeof hazardData];

    return isAffected
      ? hazardColors[activeHazard as keyof typeof hazardColors]
      : "#cbd5e1";
  };

  const isHighlighted = (
    countryName: string
  ) => {
    if (!activeHazard) return false;

    const hazardData = hazardLookup.get(countryName);
    return !!hazardData?.[activeHazard as keyof typeof hazardData];
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
      >
        {/* Ocean */}
        <rect
          width={WIDTH}
          height={HEIGHT}
          fill="#dbeafe"
        />

        {/* Temperature Trend */}
        <path
          d={path}
          fill="none"
          stroke="#ef4444"
          strokeWidth={5}
        />

        <text
          x={30}
          y={60}
          fontSize={24}
          fontWeight={700}
          fill="#991b1b"
        >
          Rising Pacific Temperature
        </text>

        <text
          x={30}
          y={90}
          fontSize={14}
          fill="#64748b"
        >
          1850
        </text>

        <text
          x={WIDTH - 70}
          y={90}
          fontSize={14}
          fill="#64748b"
        >
          2025
        </text>

        {/* Ocean Label */}
        <text
          x={WIDTH / 2}
          y={HEIGHT / 2}
          textAnchor="middle"
          fontSize={72}
          fontWeight={700}
          fill="#93c5fd"
          opacity={0.35}
        >
          PACIFIC OCEAN
        </text>

        {/* Countries */}
        {countries.map((country) => {
          const x = projectLon(country.lon);
          const y = projectLat(country.lat);

          return (
            <g key={country.name}>
              <motion.circle
                cx={x}
                cy={y}
                r={isHighlighted(country.name) ? 11 : 7}
                animate={{
                  fill: getCountryColor(country.name),
                  scale: isHighlighted(country.name) ? 1.8 : 1,
                }}
                transition={{
                  duration: 0.25,
                }}
              />

              <motion.text
                x={x + 10}
                y={y - 10}
                fontSize={12}
                fontWeight={600}
                animate={{
                  fill: getCountryColor(country.name),
                }}
              >
                {country.name}
              </motion.text>
            </g>
          );
        })}

        {/* Hazard Icons */}
        <text
          x={projectLon(168)}
          y={projectLat(-16) - 50}
          fontSize={32}
        >
          🌀
        </text>

        <text
          x={projectLon(178)}
          y={projectLat(-17) - 50}
          fontSize={32}
        >
          🌊
        </text>

        <text
          x={projectLon(-172)}
          y={projectLat(-13) - 50}
          fontSize={32}
        >
          🌧️
        </text>

        <text
          x={projectLon(173)}
          y={projectLat(1) - 50}
          fontSize={32}
        >
          🔥
        </text>

        {/* Legend Background */}
        <rect
          x={20}
          y={HEIGHT - 90}
          width={720}
          height={60}
          rx={12}
          fill="white"
          opacity={0.95}
        />

        {/* Interactive Legend Items */}
        {[
          {
            key: "cyclone",
            label: "🌀 Cyclones",
            color: hazardColors.cyclone,
          },
          {
            key: "flood",
            label: "🌧 Flooding",
            color: hazardColors.flood,
          },
          {
            key: "drought",
            label: "🔥 Drought",
            color: hazardColors.drought,
          },
          {
            key: "seaLevelRise",
            label: "🌊 Sea Level Rise",
            color: hazardColors.seaLevelRise,
          },
        ].map((item, i) => (
          <g
            key={item.key}
            onMouseEnter={() => setActiveHazard(item.key)}
            onMouseLeave={() => setActiveHazard(null)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={40 + i * 95}
              y={HEIGHT - 68}
              width={18}
              height={18}
              rx={4}
              fill={item.color}
              opacity={activeHazard === item.key ? 1 : 0.7}
            />

            <text
              x={64 + i * 95}
              y={HEIGHT - 54}
              fontSize={12}
              fill={activeHazard === item.key ? item.color : "#334155"}
              fontWeight={activeHazard === item.key ? "600" : "400"}
            >
              {item.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default PacificClimateStoryMap;
