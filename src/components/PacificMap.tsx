"use client";

import { geoData } from "@/climatedata/pacificGeoData";

type Point = {
  name: string;
  lon: number;
  lat: number;
};

const WIDTH = 1200;
const HEIGHT = 650;

/*
  Pacific-centered projection

  120°E -------------------- 120°W
*/
const projectLon = (lon: number) => {
  let shifted = lon;

  if (shifted < 120) {
    shifted += 360;
  }

  return ((shifted - 120) / 120) * WIDTH;
};

const projectLat = (lat: number) => {
  return HEIGHT - ((lat + 35) / 60) * HEIGHT;
};

function extractCoordinates(
  geometry: any,
  coords: number[][] = []
): number[][] {
  if (!geometry) return coords;

  if (geometry.type === "Polygon") {
    geometry.coordinates.forEach((ring: number[][]) => {
      ring.forEach((c) => coords.push(c));
    });
  }

  if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((poly: number[][][]) => {
      poly.forEach((ring: number[][]) => {
        ring.forEach((c) => coords.push(c));
      });
    });
  }

  return coords;
}

function buildCentroids(): Point[] {
  const countryMap = new Map<string, number[][]>();

  geoData.features.forEach((feature: any) => {
    const name = feature.properties?.name;

    if (!name) return;

    const existing = countryMap.get(name) || [];

    countryMap.set(
      name,
      existing.concat(extractCoordinates(feature.geometry))
    );
  });

  return Array.from(countryMap.entries()).map(([name, coords]) => {
    const lon =
      coords.reduce((sum, c) => sum + c[0], 0) / coords.length;

    const lat =
      coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

    return {
      name,
      lon,
      lat,
    };
  });
}

const countries = buildCentroids();

export function PacificMap() {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-sky-50 to-cyan-100">

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

        {/* Ocean title */}
        <text
          x={WIDTH / 2}
          y={HEIGHT / 2}
          textAnchor="middle"
          fontSize="52"
          fontWeight="700"
          fill="#93c5fd"
        >
          PACIFIC OCEAN
        </text>

        {/* Country points */}
        {countries.map((country) => {
          const x = projectLon(country.lon);
          const y = projectLat(country.lat);

          return (
            <g key={country.name}>
              <circle
                cx={x}
                cy={y}
                r={6}
                fill="#0f172a"
              />

              <text
                x={x + 10}
                y={y - 10}
                fontSize="12"
                fill="#334155"
                fontWeight="600"
              >
                {country.name}
              </text>
            </g>
          );
        })}

        {/* Example disaster markers */}
        <text
          x={projectLon(178)}
          y={projectLat(-17) - 50}
          fontSize="28"
        >
          🌀
        </text>

        <text
          x={projectLon(167)}
          y={projectLat(-15) - 45}
          fontSize="28"
        >
          🌋
        </text>

        <text
          x={projectLon(173)}
          y={projectLat(1) - 40}
          fontSize="28"
        >
          🌊
        </text>

        <text
          x={projectLon(-172)}
          y={projectLat(-13) - 50}
          fontSize="28"
        >
          🌧️
        </text>
      </svg>
    </div>
  );
}

export default PacificMap;
