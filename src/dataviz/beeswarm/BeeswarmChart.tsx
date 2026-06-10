"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { ClimateRecord } from "@/lib/mergedClimateRecord";

type Props = {
  width: number;
  height: number;
  data: ClimateRecord[];
  title?: string;
  insight?: string;
};

type Node = {
  id: string;
  country: string;
  year: number;
  value: number;
  category: string;
  x?: number;
  y?: number;
};

const CATEGORY_META = [
  { key: "Temperature", color: "#ef4444", label: "Temperature (°C)", icon: "🌡️", description: "Surface temperature anomaly" },
  { key: "Sea Surface Temperature", color: "#06b6d4", label: "Sea Surface Temp (°C)", icon: "🌊", description: "Ocean surface warming" },
  { key: "Sea Level", color: "#3b82f6", label: "Sea Level (mm)", icon: "📈", description: "Ocean level anomaly" },
  { key: "Rainfall", color: "#22c55e", label: "Rainfall (mm)", icon: "☔", description: "Precipitation anomaly" },
  { key: "Economic Loss", color: "#f97316", label: "Economic Loss (USD)", icon: "💰", description: "Disaster-related losses" },
  { key: "People Affected", color: "#a855f7", label: "People Affected", icon: "👥", description: "Human impact magnitude" },
];

export default function BeeswarmChart({ 
  width, 
  height, 
  data, 
  title = "Climate Impact Distribution",
  insight = "Each dot represents a climate impact event. Size shows magnitude, color indicates type. Dots cluster by country (vertical) and year (horizontal)."
}: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hovered, setHovered] = useState<Node | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>(
    CATEGORY_META.map(d => d.key)
  );

  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);

  // ─────────────────────────────────────────────
  // DATA PROCESSING (decades only for clarity)
  // ─────────────────────────────────────────────
  const flat = useMemo<Node[]>(() => {
    const out: Node[] = [];

    data
      .filter(d => d.year % 10 === 0)
      .forEach(d => {
        const push = (category: string, value: number | null) => {
          if (value == null) return;
          if (!activeCategories.includes(category)) return;

          out.push({
            id: `${d.country}-${category}-${d.year}`,
            country: d.country,
            year: d.year,
            category,
            value: Math.abs(value), // Use absolute values for size
          });
        };

        push("Temperature", d.temp);
        push("Sea Surface Temperature", d.seaSurfaceTemp);
        push("Sea Level", d.sea);
        push("Rainfall", d.rainfall);
        push("Economic Loss", d.loss);
        push("People Affected", d.people);
      });

    return out;
  }, [data, activeCategories]);

  const countries = useMemo(
    () => Array.from(new Set(flat.map(d => d.country))).sort(),
    [flat]
  );

  const years = useMemo(
    () => Array.from(new Set(flat.map(d => d.year))).sort((a, b) => a - b),
    [flat]
  );

  // Calculate story insights
  const totalEvents = flat.length;
  const maxValue = d3.max(flat, d => d.value) || 1;
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    flat.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [flat]);

  const mostCommonCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostCommonMeta = CATEGORY_META.find(c => c.key === mostCommonCategory);

  // ─────────────────────────────────────────────
  // ADAPTIVE HEIGHT
  // ─────────────────────────────────────────────
  const MIN_ROW_HEIGHT = 32;
  const computedHeight = useMemo(() => {
    return Math.max(height, countries.length * MIN_ROW_HEIGHT + 160);
  }, [height, countries.length]);

  // ─────────────────────────────────────────────
  // SCALES
  // ─────────────────────────────────────────────
  const xScale = useMemo(
    () =>
      d3.scalePoint<number>()
        .domain(years)
        .range([160, width - 50])
        .padding(0.6),
    [years, width]
  );

  const yScale = useMemo(() => {
    const rowHeight = (computedHeight - 160) / Math.max(countries.length, 1);
    return d3.scalePoint<string>()
      .domain(countries)
      .range([80, 80 + countries.length * rowHeight])
      .padding(0.7);
  }, [countries, computedHeight]);

  const rScale = useMemo(
    () =>
      d3.scaleSqrt()
        .domain([0, maxValue])
        .range([4, 16]),
    [maxValue]
  );

  const colorScale = useMemo(
    () =>
      d3.scaleOrdinal<string>()
        .domain(CATEGORY_META.map(d => d.key))
        .range(CATEGORY_META.map(d => d.color)),
    []
  );

  // ─────────────────────────────────────────────
  // FORCE SIMULATION
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!flat.length || !width || !computedHeight) return;

    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<Node>();
    }

    const sim = simulationRef.current;

    sim.nodes(flat as any)
      .force("x", d3.forceX((d: any) => xScale(d.year) ?? 0).strength(0.85))
      .force("y", d3.forceY((d: any) => yScale(d.country) ?? 0).strength(0.85))
      .force("collide", d3.forceCollide((d: any) => rScale(d.value) + 3))
      .alpha(0.8)
      .restart();

    const ticked = () => {
      setNodes([...sim.nodes()] as Node[]);
    };

    sim.on("tick", ticked);

    return () => {
      sim.on("tick", null);
    };
  }, [flat, xScale, yScale, rScale, width, computedHeight]);

  const toggleCategory = useCallback((cat: string) => {
    setActiveCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  }, []);

  // Format value for tooltip
  const formatValue = (value: number, category: string): string => {
    if (category === "Economic Loss") {
      if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
      return `$${value.toLocaleString()}`;
    }
    if (category === "People Affected") {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M people`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K people`;
      return `${value.toLocaleString()} people`;
    }
    if (category === "Temperature") return `${value.toFixed(1)}°C`;
    if (category === "Sea Surface Temperature") return `${value.toFixed(1)}°C`;
    if (category === "Sea Level") return `${value.toFixed(1)}mm`;
    if (category === "Rainfall") return `${value.toFixed(0)}mm`;
    return value.toLocaleString();
  };

  return (
    <div className="w-full">
      {/* Header with Storytelling */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-purple-500">
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      {/* Key Findings Summary Cards */}
      <div className="mb-5 grid grid-cols-4 gap-2">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">{totalEvents}</div>
          <div className="text-xs text-slate-500">Total Events</div>
        </div>
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <div className="text-lg font-bold text-emerald-700">{countries.length}</div>
          <div className="text-xs text-slate-500">Pacific Nations</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-700">{years.length}</div>
          <div className="text-xs text-slate-500">Decades Shown</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-lg font-bold text-amber-700">
            {mostCommonMeta?.icon || "📊"}
          </div>
          <div className="text-xs text-slate-500">Most Frequent</div>
          <div className="text-[10px] text-slate-400">{mostCommonMeta?.label || mostCommonCategory}</div>
        </div>
      </div>

      {/* Narrative Paragraph */}
      <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          This beeswarm chart visualizes <span className="font-bold text-blue-600">{totalEvents} climate impact events</span> across 
          <span className="font-bold text-emerald-600"> {countries.length} Pacific nations</span> over 
          <span className="font-bold text-slate-700"> {years.length} decades</span>. 
          Each <span className="font-bold text-purple-600">colored dot</span> represents an impact measurement — 
          <span className="font-bold text-red-500"> red for temperature</span>, 
          <span className="font-bold text-cyan-500"> cyan for sea surface temperature</span>, 
          <span className="font-bold text-blue-500"> blue for sea level</span>, 
          <span className="font-bold text-green-500"> green for rainfall</span>, 
          <span className="font-bold text-orange-500"> orange for economic loss</span>, and 
          <span className="font-bold text-purple-500"> purple for people affected</span>. 
          Larger dots indicate more severe impacts.
        </p>
      </div>

      {/* Chart */}
      <svg width={width} height={computedHeight} className="overflow-visible">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background alternating rows */}
        {countries.map((country, i) => {
          const y = yScale(country) ?? 0;
          return (
            <rect
              key={`bg-${country}`}
              x={0}
              y={y - 16}
              width={width}
              height={32}
              fill={i % 2 === 0 ? "#ffffff" : "#f8fafc"}
              opacity={0.5}
            />
          );
        })}

        {/* Year Labels */}
        <text x={width / 2} y={32} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" letterSpacing="0.05em">
          TIME → (Decades)
        </text>
        
        {years.map(year => (
          <text
            key={year}
            x={xScale(year) ?? 0}
            y={52}
            textAnchor="middle"
            fontSize={10}
            fontWeight={600}
            fill="#475569"
          >
            {year}
          </text>
        ))}

        {/* Country Labels */}
        <text x={30} y={70} fontSize={10} fill="#94a3b8" fontWeight="600" letterSpacing="0.05em">
          COUNTRY
          <tspan dy={15} x={30}>↓</tspan>
        </text>

        {countries.map((country, i) => {
          const y = yScale(country) ?? 0;
          return (
            <g key={country}>
              <text
                x={100}
                y={y + 4}
                textAnchor="end"
                fontSize={countries.length > 14 ? 9 : 10}
                fill="#64748b"
                fontWeight={500}
              >
                {country}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        <g filter="url(#shadow)">
          {nodes.map(d => {
            const isHovered = hovered?.id === d.id;
            const meta = CATEGORY_META.find(c => c.key === d.category);

            return (
              <circle
                key={d.id}
                cx={d.x ?? 0}
                cy={d.y ?? 0}
                r={rScale(d.value)}
                fill={colorScale(d.category)}
                fillOpacity={hovered && !isHovered ? 0.2 : 0.85}
                stroke={isHovered ? "#0f172a" : "none"}
                strokeWidth={isHovered ? 2 : 0}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </g>
      </svg>

      {/* Legend - Clickable Toggles */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {CATEGORY_META.map(cat => {
          const active = activeCategories.includes(cat.key);
          const count = categoryCounts[cat.key] || 0;

          return (
            <button
              key={cat.key}
              onClick={() => toggleCategory(cat.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                active 
                  ? "bg-slate-100 text-slate-700" 
                  : "bg-slate-50 text-slate-400"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.color, opacity: active ? 1 : 0.4 }}
              />
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`text-[10px] ${active ? "text-slate-400" : "text-slate-300"}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-lg px-4 py-2 rounded-lg z-50"
          style={{
            left: (hovered.x ?? 0) + 20,
            top: (hovered.y ?? 0) - 40,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: colorScale(hovered.category) }}
            />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {hovered.category}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-800">
            {hovered.country} • {hovered.year}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {formatValue(hovered.value, hovered.category)}
          </div>
        </div>
      )}

      {/* Footer Insight */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          📊 Hover over any dot for details · Click legend to filter categories · 
          Dot size = magnitude of impact · Vertical position = country · Horizontal = decade · 
          Sea surface temperature shows ocean warming trends
        </p>
      </div>
    </div>
  );
}