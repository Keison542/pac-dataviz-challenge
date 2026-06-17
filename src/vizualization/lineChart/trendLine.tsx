"use client";

import { scaleLinear } from "d3-scale";
import { useMemo, useState, useRef } from "react";
import { line, curveCardinal } from "d3-shape";
import { LineItem } from "@/vizualization/lineChart/LineItem";

const MARGIN = { top: 60, right: 60, bottom: 100, left: 110 };

export const TrendLine = ({
  width,
  height,
  data,
  selectedCountry,
  setSelectedCountry,
  highlightMode = "economic",
}) => {
  const [hovered, setHovered] = useState<any>(null);

  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const trendData = useMemo(() => {
    const map = new Map();

    data.forEach(d => {
      map.set(d.year, (map.get(d.year) || 0) + d.value);
    });

    return Array.from(map.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
  }, [data]);

  const xScale = scaleLinear()
    .domain([trendData[0]?.year, trendData.at(-1)?.year])
    .range([0, boundsWidth]);

  const yScale = scaleLinear()
    .domain([0, Math.max(...trendData.map(d => d.value)) * 1.1])
    .range([boundsHeight, 0]);

  const linePath = useMemo(() => {
    return (
      line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value))
        .curve(curveCardinal.tension(0.7))(trendData) || ""
    );
  }, [trendData]);

  const worst = trendData.reduce((a, b) =>
    b.value > a.value ? b : a,
    trendData[0]
  );

  return (
    <div className="w-full">

      {/* HEADER */}
      <div className="text-center mb-4">
        <div className="text-sm font-semibold">
          Livelihood Pressure Curve
        </div>
      </div>

      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {/* LINE */}
          <LineItem
            path={linePath}
            color="#06b6d4"
            strokeWidth={3}
          />

          {/* PEAK */}
          {worst && (
            <circle
              cx={xScale(worst.year)}
              cy={yScale(worst.value)}
              r={6}
              fill="red"
            />
          )}

          {/* INTERACTION LAYER */}
          {trendData.map((d, i) => (
            <circle
              key={i}
              cx={xScale(d.year)}
              cy={yScale(d.value)}
              r={6}
              fill="transparent"
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}

          {/* X AXIS LABEL */}
          <text
            x={boundsWidth / 2}
            y={boundsHeight + 55}
            textAnchor="middle"
            fontSize={11}
            fill="#64748b"
          >
            Year
          </text>

        </g>
      </svg>

      {/* TOOLTIP */}
      {hovered && (
        <div className="text-xs mt-2 text-center">
          {hovered.year} → {hovered.value}
        </div>
      )}
    </div>
  );
};
