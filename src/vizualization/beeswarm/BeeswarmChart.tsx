"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { animated, useSpring } from "@react-spring/web";
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
  // Climate Drivers
  { key: "Temperature", color: "#ef4444", label: "Temperature (°C)", icon: "", description: "Surface temperature anomaly", dataKey: "temp" },
  { key: "Sea Surface Temperature", color: "#06b6d4", label: "Sea Surface Temp (°C)", icon: "", description: "Ocean surface warming", dataKey: "seaSurfaceTemp" },
  { key: "Sea Level", color: "#3b82f6", label: "Sea Level (mm)", icon: "", description: "Ocean level anomaly", dataKey: "sea" },
  { key: "Rainfall", color: "#22c55e", label: "Rainfall (mm)", icon: "", description: "Precipitation anomaly", dataKey: "rainfall" },
  // Environmental Impacts
  { key: "Crop Yield", color: "#10b981", label: "Crop Yield (t/ha)", icon: "", description: "Agricultural productivity", dataKey: "cropYield" },
  { key: "Livestock Yield", color: "#f59e0b", label: "Livestock Yield (tons)", icon: "", description: "Livestock production", dataKey: "lifestockYield" },
  { key: "Climate Altering Land", color: "#8b5cf6", label: "Climate Altering Land (ha)", icon: "", description: "Land cover changes", dataKey: "climateAlteringLand" },
  // Economic Consequences
  { key: "Economic Loss", color: "#f97316", label: "Economic Loss (USD)", icon: "", description: "Disaster-related losses", dataKey: "loss" },
  { key: "Tourist Arrivals", color: "#14b8a6", label: "Tourist Arrivals", icon: "", description: "Tourism volume", dataKey: "tourists" },
  // Human Consequences
  { key: "People Affected", color: "#ef4444", label: "People Affected", icon: "", description: "Human impact magnitude", dataKey: "people" },
  { key: "Population Growth", color: "#ec4898", label: "Population Growth (%)", icon: "", description: "Demographic trends", dataKey: "populationGrowth" },
];

// Animated circle component with spring effects
const AnimatedCircle = ({ cx, cy, r, fill, fillOpacity, stroke, strokeWidth, onMouseEnter, onMouseLeave, isHovered }: any) => {
  const springProps = useSpring({
    r: isHovered ? r + 3 : r,
    fillOpacity: isHovered ? 1 : fillOpacity,
    strokeWidth: isHovered ? 3 : strokeWidth,
    config: { tension: 200, friction: 20 },
  });

  const glowSpring = useSpring({
    opacity: isHovered ? 0.3 : 0,
    config: { tension: 200, friction: 20 },
  });

  return (
    <>
      {/* Glow effect on hover */}
      {isHovered && (
        <animated.circle
          cx={cx}
          cy={cy}
          r={r + 6}
          fill={fill}
          opacity={glowSpring.opacity}
          style={{ filter: "blur(4px)" }}
        />
      )}
      <animated.circle
        cx={cx}
        cy={cy}
        r={springProps.r}
        fill={fill}
        fillOpacity={springProps.fillOpacity}
        stroke={stroke}
        strokeWidth={springProps.strokeWidth}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="cursor-pointer transition-all duration-150"
      />
    </>
  );
};

export default function BeeswarmChart({ 
  width, 
  height, 
  data, 
  title = "Comprehensive Climate Impact Distribution",
  insight = "Each dot represents a climate impact measurement. Size shows magnitude, color indicates type. Dots cluster by country (vertical) and decade (horizontal). Click legend to filter categories."
}: Props) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [hovered, setHovered] = useState<Node | null>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>(
    CATEGORY_META.map(d => d.key)
  );
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const simulationRef = useRef<d3.Simulation<Node, undefined> | null>(null);

  // ─────────────────────────────────────────────
  // DATA PROCESSING (decades only for clarity)
  // ─────────────────────────────────────────────
  const flat = useMemo<Node[]>(() => {
    const out: Node[] = [];

    data
      .filter(d => d.year % 10 === 0)
      .forEach(d => {
        CATEGORY_META.forEach(category => {
          const value = d[category.dataKey as keyof ClimateRecord] as number | null;
          if (value == null) return;
          if (value === 0) return;
          if (!activeCategories.includes(category.key)) return;

          out.push({
            id: `${d.country}-${category.key}-${d.year}`,
            country: d.country,
            year: d.year,
            category: category.key,
            value: Math.abs(value),
          });
        });
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

  // Calculate category group counts
  const driverCategories = ["Temperature", "Sea Surface Temperature", "Sea Level", "Rainfall"];
  const environmentalCategories = ["Crop Yield", "Livestock Yield", "Climate Altering Land"];
  const economicCategories = ["Economic Loss", "Tourist Arrivals"];
  const humanCategories = ["People Affected", "Population Growth"];

  const driverCount = flat.filter(d => driverCategories.includes(d.category)).length;
  const environmentalCount = flat.filter(d => environmentalCategories.includes(d.category)).length;
  const economicCount = flat.filter(d => economicCategories.includes(d.category)).length;
  const humanCount = flat.filter(d => humanCategories.includes(d.category)).length;

  // ─────────────────────────────────────────────
  // ADAPTIVE HEIGHT
  // ─────────────────────────────────────────────
  const MIN_ROW_HEIGHT = 32;
  const computedHeight = useMemo(() => {
    return Math.max(height, countries.length * MIN_ROW_HEIGHT + 180);
  }, [height, countries.length]);

  // ─────────────────────────────────────────────
  // SCALES
  // ─────────────────────────────────────────────
  const xScale = useMemo(
    () =>
      d3.scalePoint<number>()
        .domain(years)
        .range([180, width - 50])
        .padding(0.6),
    [years, width]
  );

  const yScale = useMemo(() => {
    if (countries.length === 0) return () => 0;
    const rowHeight = (computedHeight - 180) / Math.max(countries.length, 1);
    return d3.scalePoint<string>()
      .domain(countries)
      .range([100, 100 + countries.length * rowHeight])
      .padding(0.7);
  }, [countries, computedHeight]);

  const rScale = useMemo(
    () =>
      d3.scaleSqrt()
        .domain([0, maxValue])
        .range([3, 18]),
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

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const sim = d3.forceSimulation<Node>(flat as any)
      .force("x", d3.forceX((d: any) => xScale(d.year) ?? 0).strength(0.85))
      .force("y", d3.forceY((d: any) => yScale(d.country) ?? 0).strength(0.85))
      .force("collide", d3.forceCollide((d: any) => rScale(d.value) + 3))
      .alpha(0.8)
      .restart();

    simulationRef.current = sim;

    const ticked = () => {
      setNodes([...sim.nodes()] as Node[]);
    };

    sim.on("tick", ticked);

    return () => {
      sim.stop();
      simulationRef.current = null;
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
    if (category === "Tourist Arrivals") {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M visitors`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K visitors`;
      return `${value.toLocaleString()} visitors`;
    }
    if (category === "Population Growth") {
      return `${value.toFixed(1)}% growth`;
    }
    if (category === "Crop Yield") {
      return `${value.toFixed(1)} t/ha`;
    }
    if (category === "Livestock Yield") {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M tons`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K tons`;
      return `${value.toLocaleString()} tons`;
    }
    if (category === "Climate Altering Land") {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ha`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K ha`;
      return `${value.toLocaleString()} ha`;
    }
    if (category === "Temperature" || category === "Sea Surface Temperature") {
      return `${value.toFixed(1)}°C`;
    }
    if (category === "Sea Level") return `${value.toFixed(1)}mm`;
    if (category === "Rainfall") return `${value.toFixed(0)}mm`;
    return value.toLocaleString();
  };

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white" style={{ width, height }}>
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30"></div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">No climate impact data available</p>
        </div>
      </div>
    );
  }

  if (!flat.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white" style={{ width, height }}>
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30"></div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data for Selected Filters</h3>
          <p className="text-xs text-slate-400 max-w-xs">Try enabling more categories in the legend</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Storytelling */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {insight}
          </p>
      </div>

      {/* Key Findings Summary Cards */}
      <div className="mb-5 grid grid-cols-5 gap-2">
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
            {mostCommonMeta?.icon || ""}
          </div>
          <div className="text-xs text-slate-500">Most Frequent</div>
          <div className="text-[10px] text-slate-400">{mostCommonMeta?.label || mostCommonCategory}</div>
        </div>
        <div className="text-center p-2 bg-rose-50 rounded-lg">
          <div className="text-lg font-bold text-rose-700">
            {driverCount + environmentalCount + economicCount + humanCount}
          </div>
          <div className="text-xs text-slate-500">Measurements</div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="mb-5 grid grid-cols-4 gap-2">
        <div 
          className="text-center p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md"
          style={{ backgroundColor: hoveredCategory === "driver" ? "#fff7ed" : "#fff7ed" }}
          onMouseEnter={() => setHoveredCategory("driver")}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <span className="text-sm"></span>
          <div className="text-xs font-bold text-orange-700">{driverCount}</div>
          <div className="text-[9px] text-slate-400">Climate Drivers</div>
        </div>
        <div 
          className="text-center p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md"
          style={{ backgroundColor: hoveredCategory === "environmental" ? "#ecfdf5" : "#ecfdf5" }}
          onMouseEnter={() => setHoveredCategory("environmental")}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <span className="text-sm"></span>
          <div className="text-xs font-bold text-emerald-700">{environmentalCount}</div>
          <div className="text-[9px] text-slate-400">Environmental</div>
        </div>
        <div 
          className="text-center p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md"
          style={{ backgroundColor: hoveredCategory === "economic" ? "#fffbeb" : "#fffbeb" }}
          onMouseEnter={() => setHoveredCategory("economic")}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <span className="text-sm"></span>
          <div className="text-xs font-bold text-amber-700">{economicCount}</div>
          <div className="text-[9px] text-slate-400">Economic</div>
        </div>
        <div 
          className="text-center p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md"
          style={{ backgroundColor: hoveredCategory === "human" ? "#fff1f2" : "#fff1f2" }}
          onMouseEnter={() => setHoveredCategory("human")}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <span className="text-sm"></span>
          <div className="text-xs font-bold text-rose-700">{humanCount}</div>
          <div className="text-[9px] text-slate-400">Human</div>
        </div>
      </div>

      {/* Narrative Paragraph */}
        <p className="text-sm text-slate-700 leading-relaxed">
          This chart visualizes {totalEvents} climate impact events across {countries.length} Pacific nations over {years.length} decades. 
          Each dot represents a measurement across the full climate cascade: 
          climate drivers, environmental impacts, economic consequences, and human outcomes. 
          Larger dots indicate more severe impacts. Hover over dots to see details — they pulse and glow!
        </p>

      {/* Chart */}
      <svg width={width} height={computedHeight} className="overflow-visible">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background alternating rows */}
        {countries.map((country, i) => {
          const y = yScale(country) ?? 0;
          return (
            <rect
              key={`bg-${country}`}
              x={0}
              y={y - 18}
              width={width}
              height={36}
              fill={i % 2 === 0 ? "#ffffff" : "#f8fafc"}
              opacity={0.5}
            />
          );
        })}

        {/* Year Labels */}
        <text x={width / 2} y={38} textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight="600" letterSpacing="0.05em">
          TIME → (Decades)
        </text>
        
        {years.map(year => (
          <text
            key={year}
            x={xScale(year) ?? 0}
            y={58}
            textAnchor="middle"
            fontSize={10}
            fontWeight={600}
            fill="#475569"
          >
            {year}
          </text>
        ))}

        {/* Country Labels */}
        <text x={40} y={80} fontSize={10} fill="#94a3b8" fontWeight="600" letterSpacing="0.05em">
          COUNTRY
          <tspan dy={15} x={40}>↓</tspan>
        </text>

        {countries.map((country, i) => {
          const y = yScale(country) ?? 0;
          return (
            <g key={country}>
              <text
                x={120}
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

        {/* Nodes with animated effects */}
        <g filter="url(#shadow)">
          {nodes.map(d => {
            const isHovered = hovered?.id === d.id;
            const isCategoryHovered = hoveredCategory !== null && (
              (hoveredCategory === "driver" && driverCategories.includes(d.category)) ||
              (hoveredCategory === "environmental" && environmentalCategories.includes(d.category)) ||
              (hoveredCategory === "economic" && economicCategories.includes(d.category)) ||
              (hoveredCategory === "human" && humanCategories.includes(d.category))
            );
            const shouldHighlight = isHovered || isCategoryHovered;
            const baseRadius = rScale(d.value);
            const finalRadius = shouldHighlight ? baseRadius + 3 : baseRadius;
            
            return (
              <g key={d.id}>
                {/* Glow effect on hover */}
                {isHovered && (
                  <circle
                    cx={d.x ?? 0}
                    cy={d.y ?? 0}
                    r={finalRadius + 6}
                    fill={colorScale(d.category)}
                    opacity={0.3}
                    style={{ filter: "blur(6px)" }}
                  />
                )}
                <circle
                  cx={d.x ?? 0}
                  cy={d.y ?? 0}
                  r={finalRadius}
                  fill={colorScale(d.category)}
                  fillOpacity={shouldHighlight ? 1 : (hovered && !isHovered ? 0.2 : 0.85)}
                  stroke={isHovered ? "#0f172a" : "none"}
                  strokeWidth={isHovered ? 2.5 : 0}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    filter: isHovered ? "url(#glow)" : "none",
                    transition: "r 0.2s ease, fill-opacity 0.2s ease"
                  }}
                  onMouseEnter={() => setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend - Clickable Toggles with hover effects */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {CATEGORY_META.map(cat => {
          const active = activeCategories.includes(cat.key);
          const count = categoryCounts[cat.key] || 0;
          const isCategoryHovered = hoveredCategory !== null && (
            (hoveredCategory === "driver" && driverCategories.includes(cat.key)) ||
            (hoveredCategory === "environmental" && environmentalCategories.includes(cat.key)) ||
            (hoveredCategory === "economic" && economicCategories.includes(cat.key)) ||
            (hoveredCategory === "human" && humanCategories.includes(cat.key))
          );

          return (
            <button
              key={cat.key}
              onClick={() => toggleCategory(cat.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-150 ${
                active 
                  ? isCategoryHovered ? "shadow-md scale-105" : "bg-slate-100 text-slate-700"
                  : "bg-slate-50 text-slate-400"
              }`}
              style={{
                transform: isCategoryHovered ? "scale(1.02)" : "scale(1)",
                transition: "all 0.2s ease"
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color, opacity: active ? 1 : 0.4 }}
              />
              <span>{cat.icon}</span>
              <span className="hidden sm:inline">{cat.label.split(' ')[0]}</span>
              <span className={`text-[9px] ${active ? "text-slate-400" : "text-slate-300"}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Tooltip with animation */}
      {hovered && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-xl px-3 py-2 rounded-lg z-50 animate-in fade-in zoom-in duration-200"
          style={{
            left: (hovered.x ?? 0) + 20,
            top: (hovered.y ?? 0) - 50,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full animate-pulse" 
              style={{ backgroundColor: colorScale(hovered.category) }}
            />
            <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide">
              {hovered.category}
            </span>
          </div>
          <div className="text-xs font-bold text-slate-800">
            {hovered.country} • {hovered.year}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
            {formatValue(hovered.value, hovered.category)}
          </div>
          <div className="text-[9px] text-slate-400 mt-1">
            {hovered.value > 1000 ? "Severe impact" : hovered.value > 100 ? "Moderate impact" : "Measured impact"}
          </div>
        </div>
      )}
    </div>
  );
}
