"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { geoData } from "@/climatedata/pacificGeoData";

const WIDTH = 1400;
const HEIGHT = 700;

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

const hazardCountries = {
  cyclone: [
    "Fiji",
    "Vanuatu",
    "Tonga",
    "Samoa",
    "Solomon Islands",
    "Papua New Guinea",
  ],

  flood: [
    "Papua New Guinea",
    "Fiji",
    "Solomon Islands",
    "Marshall Islands",
    "Kiribati",
  ],

  drought: [
    "Kiribati",
    "Tuvalu",
    "Nauru",
    "Tokelau",
  ],

  seaLevelRise: [
    "Kiribati",
    "Tuvalu",
    "Marshall Islands",
    "Tokelau",
    "Cook Islands",
    "Maldives",
  ],
};

const hazardColors = {
  cyclone: "#ef4444",
  flood: "#3b82f6",
  drought: "#f59e0b",
  seaLevelRise: "#14b8a6",
};

export function PacificClimateStoryMap() {
  const [activeHazard, setActiveHazard] =
    useState<keyof typeof hazardCountries | null>(
      null
    );

  const countries = useMemo(
    () => buildCentroids(),
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

    const members =
      hazardCountries[activeHazard];

    return members.includes(countryName)
      ? hazardColors[activeHazard]
      : "#cbd5e1";
  };

  const isHighlighted = (
    countryName: string
  ) => {
    if (!activeHazard) return false;

    return hazardCountries[
      activeHazard
    ].includes(countryName);
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
                r={7}
                animate={{
                  fill: getCountryColor(
                    country.name
                  ),
                  scale: isHighlighted(
                    country.name
                  )
                    ? 1.8
                    : 1,
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
                  fill: getCountryColor(
                    country.name
                  ),
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
          width={700}
          height={60}
          rx={12}
          fill="white"
          opacity={0.95}
        />

        {/* Cyclones */}

        <text
          x={40}
          y={HEIGHT - 52}
          fontSize={15}
          cursor="pointer"
          fill="#ef4444"
          onMouseEnter={() =>
            setActiveHazard("cyclone")
          }
          onMouseLeave={() =>
            setActiveHazard(null)
          }
        >
          🌀 Cyclones
        </text>

        {/* Floods */}

        <text
          x={190}
          y={HEIGHT - 52}
          fontSize={15}
          cursor="pointer"
          fill="#3b82f6"
          onMouseEnter={() =>
            setActiveHazard("flood")
          }
          onMouseLeave={() =>
            setActiveHazard(null)
          }
        >
          🌧 Floods
        </text>

        {/* Drought */}

        <text
          x={320}
          y={HEIGHT - 52}
          fontSize={15}
          cursor="pointer"
          fill="#f59e0b"
          onMouseEnter={() =>
            setActiveHazard("drought")
          }
          onMouseLeave={() =>
            setActiveHazard(null)
          }
        >
          🔥 Drought
        </text>

        {/* Sea Level */}

        <text
          x={470}
          y={HEIGHT - 52}
          fontSize={15}
          cursor="pointer"
          fill="#14b8a6"
          onMouseEnter={() =>
            setActiveHazard("seaLevelRise")
          }
          onMouseLeave={() =>
            setActiveHazard(null)
          }
        >
          🌊 Sea Level Rise
        </text>
      </svg>
    </div>
  );
}

export default PacificClimateStoryMap;
