"use client";

import { useEffect, useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { geoCentroid } from "d3-geo";
import { FeatureCollection } from "geojson";

export type TimeSeriesPoint = {
  country: string;
  year: number;
  value: number;
};

type Props = {
  data: TimeSeriesPoint[];
  geoData: FeatureCollection;
  selectedCountry?: string;
  width?: number;
  height?: number;
};

// ─────────────────────────────────────────────
// Extract country centroid positions from geoData
// ─────────────────────────────────────────────
function getCountryPositions(geoData: FeatureCollection) {
  const map: Record<string, [number, number]> = {};

  geoData.features.forEach((f: any) => {
    const name = f.properties?.name;
    if (!name) return;

    try {
      const [lng, lat] = geoCentroid(f);
      map[name] = [lng, lat];
    } catch (e) {
      // ignore invalid geometry
    }
  });

  return map;
}

function getYears(data: TimeSeriesPoint[]) {
  return [...new Set(data.map((d) => d.year))].sort((a, b) => a - b);
}

export default function AnimatedTimelineMap({
  data,
  geoData,
  selectedCountry,
  width = 900,
  height = 450,
}: Props) {
  const years = useMemo(() => getYears(data), [data]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);

  const year = years[i];

  // 🌍 REAL geographic positions
  const countryPos = useMemo(
    () => getCountryPositions(geoData),
    [geoData]
  );

  // ─────────────────────────────────────────────
  // animation loop
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!playing || years.length === 0) return;

    const t = setInterval(() => {
      setI((p) => (p + 1) % years.length);
    }, 1200);

    return () => clearInterval(t);
  }, [playing, years.length]);

  const frame = useMemo(() => {
    return data.filter((d) => d.year === year);
  }, [data, year]);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const sizeScale = scaleLinear()
    .domain([0, maxValue])
    .range([2, 28]);

  // convert lng/lat → svg coords
  const project = (lng: number, lat: number) => {
    return [
      ((lng + 180) / 360) * width,
      ((90 - lat) / 180) * height,
    ] as [number, number];
  };

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* UI */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          background: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "8px 12px",
          borderRadius: 6,
          fontSize: 12,
        }}
      >
        <button onClick={() => setPlaying((p) => !p)}>
          {playing ? "Pause" : "Play"}
        </button>
        <span style={{ marginLeft: 10 }}>Year: {year}</span>
      </div>

      {/* MAP */}
      <svg width={width} height={height} style={{ background: "#0b1220" }}>
        {/* ocean */}
        <rect width={width} height={height} fill="#0b1220" />

        {/* bubbles */}
        {frame.map((d, i) => {
          const pos = countryPos[d.country];
          if (!pos) return null;

          const [lng, lat] = pos;
          const [x, y] = project(lng, lat);

          const r = sizeScale(d.value);

          const active =
            !selectedCountry || selectedCountry === d.country;

          return (
            <g key={`${d.country}-${i}`}>
              {/* glow ring */}
              <circle
                cx={x}
                cy={y}
                r={r + 6}
                fill="none"
                stroke="#a855f7"
                opacity={0.25}
              />

              {/* main bubble */}
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={active ? "#a855f7" : "#3b82f6"}
                opacity={0.85}
              />

              {/* label */}
              <text
                x={x}
                y={y - r - 6}
                fontSize={10}
                fill="#cbd5e1"
                textAnchor="middle"
              >
                {d.country}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}