"use client";

import { scaleLinear } from "d3-scale";
import { line, curveCardinal } from "d3-shape";

export function TimeSeriesDashboard({ width, height, data }: any) {
  const MARGIN = { top: 60, right: 40, bottom: 80, left: 80 };

  const boundsW = width - MARGIN.left - MARGIN.right;
  const boundsH = height - MARGIN.top - MARGIN.bottom;

  const x = scaleLinear()
    .domain([Math.min(...data.map((d: any) => d.year)), Math.max(...data.map((d: any) => d.year))])
    .range([0, boundsW]);

  const metrics = ["cropYield", "livestockYield", "touristArrivals"];

  const y = scaleLinear()
    .domain([0, Math.max(...data.flatMap((d: any) => metrics.map(m => d[m])))])
    .range([boundsH, 0]);

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold">
          Livelihood systems under stress
        </h3>
        <p className="text-xs text-slate-500">
          Food, income, and tourism respond differently — revealing structural fragility.
        </p>
      </div>

      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>

          {metrics.map((m, i) => (
            <path
              key={m}
              d={
                line<any>()
                  .x(d => x(d.year))
                  .y(d => y(d[m]))
                  .curve(curveCardinal.tension(0.6))(data) || ""
              }
              fill="none"
              stroke={["#10b981", "#f59e0b", "#14b8a6"][i]}
              strokeWidth={2.5}
              opacity={0.85}
            />
          ))}

        </g>
      </svg>
    </div>
  );
}
