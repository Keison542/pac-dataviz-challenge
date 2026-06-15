"use client";

import { useMemo, useState } from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";

type Row = {
  country: string;
  year: number;
  temp: number;
  sea_surface_temperature: number;
  sea: number;
  rainfall: number;
  loss: number;
  people: number;
  crop_yield: number;
  tourist_arrival: number;
  lifestock_yield: number;
  climate_altering_land: number;
  population_growth: number;
};

type Props = {
  width: number;
  height: number;
  data: Row[];
  title?: string;
  insight?: string;
};

type NodeType = {
  id: string;
  name: string;
  category: string;
};

type LinkType = {
  source: string;
  target: string;
  value: number;
};

const COLORS: Record<string, string> = {
  country: "#3b82f6",
  decade: "#64748b",
  temp: "#ef4444",                    // Surface/Air Temperature - Red
  sea_surface_temperature: "#06b6d4", // Sea Surface Temperature - Cyan
  sea: "#0ea5e9",                     // Sea Level - Sky Blue
  rain: "#22c55e",                    // Rainfall - Green
  crop: "#10b981",                    // Crop Yield - Emerald
  livestock: "#f59e0b",               // Livestock - Amber
  land: "#8b5cf6",                    // Climate Altering Land - Purple
  loss: "#f97316",                    // Economic Loss - Orange
  tourism: "#14b8a6",                 // Tourist Arrivals - Teal
  people: "#ef4444",                  // People Affected - Red
  population: "#ec4898",              // Population Growth - Pink
};

const CATEGORY_LABELS: Record<string, string> = {
  country: "Country",
  decade: "Time Period",
  temp: "Surface Temperature",
  sea_surface_temperature: "Sea Surface Temperature",
  sea: "Sea Level Rise",
  rain: "Precipitation",
  crop: "Crop Yield",
  livestock: "Livestock Yield",
  land: "Climate Altering Land",
  loss: "Economic Loss",
  tourism: "Tourist Arrivals",
  people: "People Affected",
  population: "Population Growth",
};

export default function AlluvialDiagram({
  width,
  height,
  data,
  title = "Comprehensive Climate Impact Alluvial Flow",
  insight = "This diagram shows how climate drivers flow through environmental and economic impacts to ultimately affect human communities.",
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const selectedCountryName = useMemo(() => {
    if (data.length === 0) return "Selected Country";
    return data[0].country;
  }, [data]);

  const { nodes, links } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { nodes: [], links: [] };
    }

    const nodeMap = new Map<string, NodeType>();
    const links: LinkType[] = [];

    const getNode = (id: string, name: string, category: string) => {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, { id, name, category });
      }
      return nodeMap.get(id)!;
    };

    const safe = (v: number) => (Number.isFinite(v) && v > 0 ? Math.min(v, 100) : 0.5);

    for (const row of data) {
      const decade = `${Math.floor(row.year / 10) * 10}s`;

      // Country & Decade Nodes
      const country = getNode(`country-${row.country}`, row.country, "country");
      const decadeNode = getNode(`decade-${decade}`, decade, "decade");

      // Climate Driver Nodes
      const temp = getNode(`temp-${decade}`, "Surface Temp", "temp");
      const seaSurfaceTemp = getNode(`sea_surface_temp-${decade}`, "Sea Surface Temp", "sea_surface_temperature");
      const sea = getNode(`sea-${decade}`, "Sea Level", "sea");
      const rain = getNode(`rain-${decade}`, "Rainfall", "rain");

      // Environmental Impact Nodes
      const crop = getNode(`crop-${decade}`, "Crop Yield", "crop");
      const livestock = getNode(`livestock-${decade}`, "Livestock Yield", "livestock");
      const land = getNode(`land-${decade}`, "Climate Altering Land", "land");

      // Economic Consequence Nodes
      const loss = getNode(`loss-${decade}`, "Economic Loss", "loss");
      const tourism = getNode(`tourism-${decade}`, "Tourist Arrivals", "tourism");

      // Human Consequence Nodes
      const people = getNode(`people-${decade}`, "People Affected", "people");
      const population = getNode(`population-${decade}`, "Population Growth", "population");

      // Country → Decade
      links.push({ source: country.id, target: decadeNode.id, value: 1 });

      // Decade → Climate Drivers
      links.push(
        { source: decadeNode.id, target: temp.id, value: safe(Math.abs(row.temp) * 2) },
        { source: decadeNode.id, target: seaSurfaceTemp.id, value: safe(Math.abs(row.sea_surface_temperature) * 2) },
        { source: decadeNode.id, target: sea.id, value: safe(Math.abs(row.sea) * 3) },
        { source: decadeNode.id, target: rain.id, value: safe(Math.abs(row.rainfall)) }
      );

      // Climate Drivers → Environmental Impacts
      links.push(
        { source: temp.id, target: crop.id, value: safe(Math.abs(row.temp) * 1.2) },
        { source: rain.id, target: crop.id, value: safe(Math.abs(row.rainfall) * 0.8) },
        { source: temp.id, target: livestock.id, value: safe(Math.abs(row.temp) * 1.0) },
        { source: rain.id, target: livestock.id, value: safe(Math.abs(row.rainfall) * 0.7) },
        { source: temp.id, target: land.id, value: safe(Math.abs(row.temp) * 0.9) },
        { source: rain.id, target: land.id, value: safe(Math.abs(row.rainfall) * 0.6) }
      );

      // Environmental Impacts → Economic Loss
      links.push(
        { source: crop.id, target: loss.id, value: safe(row.crop_yield * 0.4) },
        { source: livestock.id, target: loss.id, value: safe(row.lifestock_yield * 0.3) },
        { source: land.id, target: loss.id, value: safe(row.climate_altering_land * 0.2) }
      );

      // Climate Drivers → Direct Economic Impacts
      links.push(
        { source: seaSurfaceTemp.id, target: tourism.id, value: safe(Math.abs(row.sea_surface_temperature) * 1.5) },
        { source: sea.id, target: tourism.id, value: safe(Math.abs(row.sea) * 1.2) },
        { source: rain.id, target: tourism.id, value: safe(Math.abs(row.rainfall) * 0.8) }
      );

      // Climate Drivers → Economic Loss
      links.push(
        { source: temp.id, target: loss.id, value: safe(Math.abs(row.temp) * 1.5) },
        { source: seaSurfaceTemp.id, target: loss.id, value: safe(Math.abs(row.sea_surface_temperature) * 1.5) },
        { source: sea.id, target: loss.id, value: safe(Math.abs(row.sea) * 2) },
        { source: rain.id, target: loss.id, value: safe(Math.abs(row.rainfall) * 1.2) }
      );

      // Economic Consequences → Human Impacts
      links.push(
        { source: loss.id, target: people.id, value: safe((Math.abs(row.people) + Math.abs(row.loss)) / 10000) },
        { source: loss.id, target: population.id, value: safe(Math.abs(row.population_growth) * 0.5) },
        { source: tourism.id, target: people.id, value: safe(Math.abs(row.tourist_arrival) / 50000) },
        { source: tourism.id, target: population.id, value: safe(Math.abs(row.population_growth) * 0.3) }
      );

      // Climate Drivers → Direct Human Impacts
      links.push(
        { source: temp.id, target: people.id, value: safe(Math.abs(row.temp) * 0.8) },
        { source: rain.id, target: people.id, value: safe(Math.abs(row.rainfall) * 0.5) }
      );
    }

    return { nodes: Array.from(nodeMap.values()), links };
  }, [data]);

  const sankeyData = useMemo(() => {
    if (!nodes.length) return null;

    try {
      const layout = sankey<NodeType, LinkType>()
        .nodeId((d) => d.id)
        .nodeWidth(24)
        .nodePadding(12)
        .extent([[80, 50], [width - 80, height - 80]]);

      return layout({
        nodes: nodes.map((d) => ({ ...d })),
        links: links.map((d) => ({ ...d })),
      });
    } catch (e) {
      console.error("Sankey error:", e);
      return null;
    }
  }, [nodes, links, width, height]);

  const decades = useMemo(() => {
    const decadeSet = new Set<string>();
    data.forEach(row => decadeSet.add(`${Math.floor(row.year / 10) * 10}s`));
    return Array.from(decadeSet).sort();
  }, [data]);

  const totalYears = useMemo(() => {
    const years = new Set<number>();
    data.forEach(row => years.add(row.year));
    return years.size;
  }, [data]);

  // Calculate category counts
  const driverCount = nodes.filter(n => n.category === "temp" || n.category === "sea_surface_temperature" || n.category === "sea" || n.category === "rain").length / decades.length;
  const environmentalCount = nodes.filter(n => n.category === "crop" || n.category === "livestock" || n.category === "land").length / decades.length;
  const economicCount = nodes.filter(n => n.category === "loss" || n.category === "tourism").length / decades.length;
  const humanCount = nodes.filter(n => n.category === "people" || n.category === "population").length / decades.length;

  if (!sankeyData) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30"></div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Flow Data</h3>
          <p className="text-xs text-slate-400 max-w-xs">No climate flow data available for {selectedCountryName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Storytelling */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-purple-500">
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800"> Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      {/* Key Findings Summary Cards */}
      <div className="mb-5 grid grid-cols-5 gap-2">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700 truncate max-w-[120px]" title={selectedCountryName}>
            {selectedCountryName}
          </div>
          <div className="text-[10px] text-slate-400">Selected Nation</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-700">{decades.length}</div>
          <div className="text-xs text-slate-500">Decades</div>
          <div className="text-[10px] text-slate-400">{totalYears} years</div>
        </div>
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <div className="text-lg font-bold text-emerald-700">{sankeyData.nodes.length}</div>
          <div className="text-xs text-slate-500">Flow Nodes</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded-lg">
          <div className="text-lg font-bold text-amber-700">{sankeyData.links.length}</div>
          <div className="text-xs text-slate-500">Causal Links</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-700">
            {driverCount + environmentalCount + economicCount + humanCount}
          </div>
          <div className="text-xs text-slate-500">Impact Stages</div>
        </div>
      </div>

      {/* Narrative Paragraph */}
      <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          This comprehensive alluvial diagram traces the complete climate impact pathway for 
          <span className="font-bold text-blue-600"> {selectedCountryName}</span> across 
          <span className="font-bold text-slate-700"> {decades.length} decades</span> 
          ({totalYears} years of recorded data). The flow moves from <span className="font-bold text-orange-600">climate drivers</span> → 
          <span className="font-bold text-emerald-600"> environmental impacts</span> → 
          <span className="font-bold text-amber-600"> economic consequences</span> → 
          <span className="font-bold text-rose-600"> human outcomes</span>, 
          revealing the cascading nature of climate change.
        </p>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-slate-500">Color legend:</span>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
            <span className="text-slate-500 text-[10px]">Drivers</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
            <span className="text-slate-500 text-[10px]">Environmental</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
            <span className="text-slate-500 text-[10px]">Economic</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-rose-500"></div>
            <span className="text-slate-500 text-[10px]">Human</span>
          </div>
        </div>
      </div>

      <svg width={width} height={height} className="overflow-visible">
        {/* Instruction text */}
        <text x={20} y={22} fontSize={10} fill="#64748b" fontWeight="500">
          Hover over any node to trace connections | Flow moves left (causes) → right (effects)
        </text>

        {/* Background */}
        <rect x={5} y={32} width={width - 10} height={height - 50} fill="#fafbfc" rx={8} />

        {/* LINKS */}
        <g>
          {sankeyData.links.map((link: any, i: number) => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            const isActive = !hovered || hovered === sourceId || hovered === targetId;
            const isHighlighted = hovered && (hovered === sourceId || hovered === targetId);

            return (
              <path
                key={i}
                d={sankeyLinkHorizontal()(link) || ""}
                stroke="#a855f7"
                strokeOpacity={isActive ? (isHighlighted ? 0.7 : 0.2) : 0.05}
                strokeWidth={Math.max(1.5, isHighlighted ? (link.width || 1.5) * 1.3 : (link.width || 1.5))}
                fill="none"
                className="transition-all duration-150"
              />
            );
          })}
        </g>

        {/* NODES */}
        <g>
          {sankeyData.nodes.map((node: any, i: number) => {
            const w = node.x1 - node.x0;
            const h = node.y1 - node.y0;
            const isActive = !hovered || hovered === node.id;
            const isHovered = hovered === node.id;
            const category = node.category === "country" ? "country" :
                             node.category === "decade" ? "decade" :
                             node.category === "temp" || node.category === "sea_surface_temperature" || node.category === "sea" || node.category === "rain" ? "temp" :
                             node.category === "crop" || node.category === "livestock" || node.category === "land" ? "crop" :
                             node.category === "loss" || node.category === "tourism" ? "loss" :
                             node.category === "people" || node.category === "population" ? "people" : "temp";
            
            const nodeColor = COLORS[category] || "#64748b";

            return (
              <g
                key={i}
                transform={`translate(${node.x0},${node.y0})`}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
                className="transition-all duration-150"
              >
                <rect
                  width={w}
                  height={h}
                  rx={6}
                  fill={nodeColor}
                  opacity={isActive ? 0.9 : 0.25}
                  stroke={isHovered ? "#0f172a" : "none"}
                  strokeWidth={isHovered ? 2 : 0}
                />

                <text
                  x={w / 2}
                  y={h / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={node.category === "country" ? 10 : 8}
                  fill="#ffffff"
                  fontWeight={node.category === "country" ? 700 : 500}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </g>

        {/* Category labels at the top */}
        <g>
          {[
            { x: 80, label: "Country" },
            { x: 180, label: "Decades" },
            { x: 320, label: "Climate Drivers" },
            { x: 500, label: "Environmental" },
            { x: 680, label: "Economic" },
            { x: 860, label: "Human" },
          ].map((item) => (
            <text
              key={item.label}
              x={item.x}
              y={46}
              textAnchor="middle"
              fontSize={8}
              fill="#94a3b8"
              fontWeight="600"
              letterSpacing="0.05em"
            >
              {item.label}
            </text>
          ))}
        </g>
      </svg>

      {/* Hover Tooltip */}
      {hovered && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-lg px-4 py-2 rounded-lg z-50"
          style={{
            left: typeof window !== 'undefined' ? (window.event as any)?.clientX + 15 : 0,
            top: typeof window !== 'undefined' ? (window.event as any)?.clientY - 40 : 0,
          }}
        >
          {(() => {
            const node = sankeyData.nodes.find((n: any) => n.id === hovered);
            if (!node) return null;
            const categoryLabel = CATEGORY_LABELS[node.category] || node.category;
            return (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[node.category] || "#64748b" }}></div>
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    {categoryLabel}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {node.name}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {node.category === "country" && ` ${selectedCountryName} - Pacific Island Nation`}
                  {node.category === "decade" && "Time period grouping - shows trends over 10-year intervals"}
                  {node.category === "temp" && "Surface temperature anomaly - affects agriculture and human health"}
                  {node.category === "sea_surface_temperature" && " Sea surface temperature - fuels cyclones and marine heatwaves"}
                  {node.category === "sea" && "Sea level rise - threatens coastal communities and infrastructure"}
                  {node.category === "rain" && " Rainfall anomaly - causes flooding or drought"}
                  {node.category === "crop" && " Crop yield - agricultural productivity indicator"}
                  {node.category === "livestock" && "🐄 Livestock yield - meat and dairy production"}
                  {node.category === "land" && " Climate altering land - land cover changes affecting carbon storage"}
                  {node.category === "loss" && "Economic loss - disaster-related damages"}
                  {node.category === "tourism" && " Tourist arrivals - economic vulnerability indicator"}
                  {node.category === "people" && " People affected - human displacement and impact"}
                  {node.category === "population" && " Population growth - demographic trends affected by climate"}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Footer Insight */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          📊 This alluvial diagram reveals the multi-step climate pathway for <span className="font-semibold text-slate-700">{selectedCountryName}</span> · 
          Hover any node to see its role · {decades.length} decades of data · 
          Full pathway: Climate Drivers → Environmental → Economic → Human Impacts
        </p>
      </div>
    </div>
  );
}
