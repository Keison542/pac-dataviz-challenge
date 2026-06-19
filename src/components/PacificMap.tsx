"use client";

import { geoMercator, geoPath } from "d3-geo";
import { geoData } from "@/climatedata/pacificGeoData";

interface Props {
  selectedCountry: string;
}

export function PacificMap({
  selectedCountry,
}: Props) {
  const width = 1100;
  const height = 500;

  const projection = geoMercator()
    .center([175, -10])
    .scale(700)
    .translate([width / 2, height / 2]);

  const pathGenerator = geoPath(projection);

  const renderedCountries = new Set<string>();

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
    >
      {/* Ocean */}
      <rect
        width={width}
        height={height}
        fill="#e0f2fe"
      />

      {/* Countries */}
      {geoData.features.map((feature: any, index) => {
        const name = feature.properties?.name ?? "";

        const selected =
          name === selectedCountry;

        const path = pathGenerator(feature);

        if (!path) return null;

        const showLabel =
          !renderedCountries.has(name);

        renderedCountries.add(name);

        const centroid =
          pathGenerator.centroid(feature);

        return (
          <g key={feature.id ?? index}>
            <path
              d={path}
              fill={
                selected
                  ? "#0891b2"
                  : "#94a3b8"
              }
              stroke="white"
              strokeWidth={0.5}
              opacity={0.95}
            />

            {showLabel &&
              centroid &&
              Number.isFinite(centroid[0]) && (
                <text
                  x={centroid[0]}
                  y={centroid[1]}
                  fontSize="8"
                  fill="#0f172a"
                  textAnchor="middle"
                >
                  {name}
                </text>
              )}
          </g>
        );
      })}

      {/* Disaster icons */}

      <text
        x={470}
        y={260}
        fontSize="32"
      >
        🌊
      </text>

      <text
        x={540}
        y={210}
        fontSize="32"
      >
        🌪️
      </text>

      <text
        x={620}
        y={290}
        fontSize="32"
      >
        🔥
      </text>

      <text
        x={700}
        y={230}
        fontSize="32"
      >
        🌧️
      </text>

      {/* Pacific label */}

      <text
        x={550}
        y={180}
        textAnchor="middle"
        fontSize="34"
        fill="#0369a1"
        opacity={0.18}
        fontWeight={700}
      >
        PACIFIC OCEAN
      </text>
    </svg>
  );
}
