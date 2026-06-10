// src/dataviz/lollipop/LollipopChart.tsx
import { scaleBand, scaleLinear } from "d3-scale";
import { useMemo, useState } from "react";
import type { InteractionData } from "../barplot/types/interaction";

const MARGIN = { top: 50, right: 60, bottom: 80, left: 140 };

type Props = {
  width: number;
  height: number;
  data: Array<{ label: string; value: number; year?: number }>;
  title?: string;
  setSelectedCountry?: (c: string) => void;
};

export const LollipopChart = ({
  width,
  height,
  data,
  title = "Lollipop Chart",
  setSelectedCountry,
}: Props) => {
  const boundsWidth = width - MARGIN.left - MARGIN.right;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  const [hovered, setHovered] = useState<any>(null);

  const labels = useMemo(() => data.map(d => d.label), [data]);
  const values = useMemo(() => data.map(d => d.value), [data]);

  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);

  const yScale = useMemo(
    () => scaleBand()
      .domain(labels)
      .range([0, boundsHeight])
      .padding(0.6),
    [labels, boundsHeight]
  );

  const xScale = useMemo(
    () => scaleLinear()
      .domain([Math.min(0, minValue * 1.1), maxValue * 1.1])
      .range([0, boundsWidth]),
    [minValue, maxValue, boundsWidth]
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-700" 
           style={{ width, height, background: "linear-gradient(145deg, #0f172a 0%, #1e2937 100%)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-30">🍭</div>
          <p className="text-slate-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {title && (
        <div className="absolute top-4 left-6 text-lg font-semibold text-white z-10">
          {title}
        </div>
      )}

      <svg width={width} height={height} className="overflow-visible">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid lines */}
          {xScale.ticks(8).map((v, i) => (
            <line
              key={i}
              x1={xScale(v)} x2={xScale(v)}
              y1={0} y2={boundsHeight}
              stroke="#334155"
              strokeWidth="1"
              opacity="0.4"
            />
          ))}

          {/* Lollipops */}
          {data.map((d, i) => {
            const y = yScale(d.label)! + yScale.bandwidth() / 2;
            const x = xScale(d.value);
            const isPositive = d.value >= 0;

            return (
              <g key={i}>
                {/* Stem */}
                <line
                  x1={xScale(0)}
                  y1={y}
                  x2={x}
                  y2={y}
                  stroke="#67e8f9"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{
                    transition: `x2 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.03}s`
                  }}
                />

                {/* Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={hovered?.label === d.label ? 9 : 6.5}
                  fill="#67e8f9"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                  style={{ transition: "all 0.3s ease" }}
                  onMouseEnter={() => {
                    setHovered(d);
                    setSelectedCountry?.(d.label);
                  }}
                  onMouseLeave={() => setHovered(null)}
                />
              </g>
            );
          })}

          {/* X Axis */}
          {xScale.ticks(8).map((v, i) => (
            <text
              key={i}
              x={xScale(v)}
              y={boundsHeight + 28}
              textAnchor="middle"
              fontSize="13"
              fill="#94a3b8"
              fontWeight="500"
            >
              {v.toLocaleString()}
            </text>
          ))}

          {/* Y Axis Labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={-20}
              y={yScale(d.label)! + yScale.bandwidth() / 2 + 4}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="13.5"
              fill="#e2e8f0"
              fontWeight="500"
            >
              {d.label}
            </text>
          ))}

          <text
            x={boundsWidth / 2}
            y={boundsHeight + 55}
            textAnchor="middle"
            fontSize="14"
            fill="#cbd5e1"
            fontWeight="600"
          >
            Value
          </text>
        </g>
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none bg-slate-900/95 backdrop-blur-xl border border-cyan-400/30 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-50"
          style={{
            left: xScale(hovered.value) + MARGIN.left + 40,
            top: yScale(hovered.label)! + MARGIN.top - 30,
          }}
        >
          <div className="text-cyan-400 text-xs font-mono">{hovered.label}</div>
          <div className="font-semibold text-xl tabular-nums">
            {hovered.value.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};