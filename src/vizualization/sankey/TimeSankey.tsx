"use client";

import { useMemo, useState } from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { LineItem } from "@/vizualization/lineChart/LineItem";

type Props = {
  width: number;
  height: number;
  data: {
    country: string;
    year: number;
    temp: number;
    sea: number;
    rainfall: number;
    loss: number;
    people: number;
    sea_surface_temperature: number;
    crop_yield: number;
    tourist_arrival: number;
    lifestock_yield: number;
    climate_altering_land: number;
    population_growth: number;
  }[];
  selectedCountry: string;
  title?: string;
  insight?: string;
};

const NODE_COLOR: Record<string, string> = {
  // Climate Drivers
  "Surface Temperature": "#f97316",
  "Sea Surface Temperature": "#06b6d4",
  "Sea Level": "#3b82f6",
  "Rainfall": "#22c55e",
  // Environmental Impact
  "Crop Yield": "#10b981",
  "Livestock Yield": "#f59e0b",
  "Climate Altering Land": "#8b5cf6",
  // Disasters & Economic
  "Disasters": "#a855f7",
  "Economic Loss": "#f59e0b",
  // Human Impact
  "People Affected": "#ef4444",
  "Population Growth": "#ec4898",
  "Tourist Arrivals": "#14b8a6",
};

const NODE_CATEGORY_COLOR: Record<string, string> = {
  driver: "#f97316",
  environmental: "#10b981",
  disaster: "#a855f7",
  economic: "#f59e0b",
  human: "#ef4444",
};

function normalize(v: number, multiplier: number = 1) {
  return Math.min(Math.max(Math.abs(v) * multiplier, 0.3), 30);
}

export default function TimeSankey({
  width,
  height,
  data,
  selectedCountry,
  title = "Comprehensive Climate Impact Flow",
  insight = "This diagram traces the complete causal chain from climate drivers to environmental, economic, and human impacts. Thicker lines indicate stronger connections.",
}: Props) {
  const [hover, setHover] = useState<any>(null);
  const [hoveredLinkIndex, setHoveredLinkIndex] = useState<number | null>(null);

  const processed = useMemo(() => {
    const filtered = data.filter(d => d.country === selectedCountry);
    if (!filtered.length) return { nodes: [], links: [] };

    const latest = filtered[filtered.length - 1];

    const nodes = [
      // Climate Drivers
      { name: "Surface Temperature", category: "driver" },
      { name: "Sea Surface Temperature", category: "driver" },
      { name: "Sea Level", category: "driver" },
      { name: "Rainfall", category: "driver" },
      // Environmental Impact
      { name: "Crop Yield", category: "environmental" },
      { name: "Livestock Yield", category: "environmental" },
      { name: "Climate Altering Land", category: "environmental" },
      // Disasters
      { name: "Disasters", category: "disaster" },
      // Economic Consequence
      { name: "Economic Loss", category: "economic" },
      { name: "Tourist Arrivals", category: "economic" },
      // Human Consequence
      { name: "People Affected", category: "human" },
      { name: "Population Growth", category: "human" },
    ];

    // Calculate link strengths using actual data fields
    const links = [];

    // Climate Drivers → Environmental Impacts
    links.push({
      source: nodes.findIndex(n => n.name === "Surface Temperature"),
      target: nodes.findIndex(n => n.name === "Crop Yield"),
      value: normalize(Math.abs(latest.temp) * 0.8),
      label: "Heat stress reduces crop productivity",
      color: "#10b981"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Crop Yield"),
      value: normalize(Math.abs(latest.rainfall) * 0.6),
      label: "Rainfall variability affects harvests",
      color: "#10b981"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Surface Temperature"),
      target: nodes.findIndex(n => n.name === "Livestock Yield"),
      value: normalize(Math.abs(latest.temp) * 0.7),
      label: "Heat stress reduces livestock production",
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Livestock Yield"),
      value: normalize(Math.abs(latest.rainfall) * 0.5),
      label: "Drought affects grazing lands",
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Surface Temperature"),
      target: nodes.findIndex(n => n.name === "Climate Altering Land"),
      value: normalize(Math.abs(latest.temp) * 0.6),
      label: "Temperature shifts alter ecosystems",
      color: "#8b5cf6"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Climate Altering Land"),
      value: normalize(Math.abs(latest.rainfall) * 0.5),
      label: "Precipitation changes affect land cover",
      color: "#8b5cf6"
    });

    // Climate Drivers → Disasters
    links.push({
      source: nodes.findIndex(n => n.name === "Sea Surface Temperature"),
      target: nodes.findIndex(n => n.name === "Disasters"),
      value: normalize(latest.sea_surface_temperature * 1.2),
      label: "Warm oceans fuel cyclones",
      color: "#a855f7"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Sea Level"),
      target: nodes.findIndex(n => n.name === "Disasters"),
      value: normalize(latest.sea * 1.5),
      label: "Sea level rise increases coastal flooding",
      color: "#a855f7"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Disasters"),
      value: normalize(Math.abs(latest.rainfall) * 0.8),
      label: "Extreme precipitation causes flooding",
      color: "#a855f7"
    });

    // Environmental Impact → Economic Loss
    links.push({
      source: nodes.findIndex(n => n.name === "Crop Yield"),
      target: nodes.findIndex(n => n.name === "Economic Loss"),
      value: normalize(latest.crop_yield * 0.3),
      label: "Crop failure causes economic damage",
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Livestock Yield"),
      target: nodes.findIndex(n => n.name === "Economic Loss"),
      value: normalize(latest.lifestock_yield * 0.25),
      label: "Livestock loss affects livelihoods",
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Climate Altering Land"),
      target: nodes.findIndex(n => n.name === "Economic Loss"),
      value: normalize(latest.climate_altering_land * 0.2),
      label: "Land degradation reduces economic value",
      color: "#f59e0b"
    });

    // Disasters → Economic Loss
    links.push({
      source: nodes.findIndex(n => n.name === "Disasters"),
      target: nodes.findIndex(n => n.name === "Economic Loss"),
      value: normalize(latest.loss * 0.3),
      label: "Disasters cause infrastructure damage",
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Disasters"),
      target: nodes.findIndex(n => n.name === "Tourist Arrivals"),
      value: normalize(latest.loss * 0.2),
      label: "Disasters deter tourism",
      color: "#14b8a6"
    });

    // Economic Loss → Human Impacts
    links.push({
      source: nodes.findIndex(n => n.name === "Economic Loss"),
      target: nodes.findIndex(n => n.name === "People Affected"),
      value: normalize(latest.people * 0.1),
      label: "Economic hardship displaces communities",
      color: "#ef4444"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Economic Loss"),
      target: nodes.findIndex(n => n.name === "Population Growth"),
      value: normalize(Math.abs(latest.population_growth) * 0.15),
      label: "Economic stress affects migration",
      color: "#ec4898"
    });

    // Climate Drivers → Direct Human Impacts
    links.push({
      source: nodes.findIndex(n => n.name === "Surface Temperature"),
      target: nodes.findIndex(n => n.name === "Tourist Arrivals"),
      value: normalize(Math.abs(latest.temp) * 0.5),
      label: "Temperature affects tourism patterns",
      color: "#14b8a6"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Tourist Arrivals"),
      value: normalize(Math.abs(latest.rainfall) * 0.4),
      label: "Rainfall affects travel decisions",
      color: "#14b8a6"
    });

    return { nodes, links };
  }, [data, selectedCountry]);

  const sankeyData = useMemo(() => {
    if (!processed.nodes.length || !processed.links.length) return null;

    const layout = sankey<any, any>()
      .nodeWidth(28)
      .nodePadding(18)
      .extent([[80, 50], [width - 80, height - 80]]);

    return layout({
      nodes: processed.nodes.map(d => ({ ...d })),
      links: processed.links.map(d => ({ ...d })),
    });
  }, [processed, width, height]);

  const strongestLink = useMemo(() => {
    if (!sankeyData || !sankeyData.links.length) return null;
    return sankeyData.links.reduce((max: any, link: any) => 
      (link.value > max.value) ? link : max, sankeyData.links[0]);
  }, [sankeyData]);

  // Calculate category counts for storytelling
  const driverCount = processed.nodes.filter(n => n.category === "driver").length;
  const environmentalCount = processed.nodes.filter(n => n.category === "environmental").length;
  const economicCount = processed.nodes.filter(n => n.category === "economic").length;
  const humanCount = processed.nodes.filter(n => n.category === "human").length;

  if (!sankeyData) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30"></div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Flow Data</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No climate flow data available for {selectedCountry}
          </p>
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
      {strongestLink && (
        <div className="mb-5 grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-700">
              {driverCount}
            </div>
            <div className="text-xs text-slate-500">Climate Drivers</div>
            <div className="text-[10px] text-slate-400">Starting point</div>
          </div>
          <div className="text-center p-2 bg-emerald-50 rounded-lg">
            <div className="text-lg font-bold text-emerald-700">
              {environmentalCount}
            </div>
            <div className="text-xs text-slate-500">Environmental Impacts</div>
            <div className="text-[10px] text-slate-400">Food & Land</div>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <div className="text-lg font-bold text-amber-700">
              {economicCount}
            </div>
            <div className="text-xs text-slate-500">Economic Consequences</div>
            <div className="text-[10px] text-slate-400">Losses & Tourism</div>
          </div>
          <div className="text-center p-2 bg-rose-50 rounded-lg">
            <div className="text-lg font-bold text-rose-700">
              {humanCount}
            </div>
            <div className="text-xs text-slate-500">Human Impacts</div>
            <div className="text-[10px] text-slate-400">People & Population</div>
          </div>
        </div>
      )}

      {/* Narrative Paragraph */}
      {strongestLink && (
        <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">
            The climate impact cascade in <span className="font-bold text-slate-900">{selectedCountry}</span> flows through 
            <span className="font-bold text-orange-600"> {driverCount} climate drivers</span> → 
            <span className="font-bold text-emerald-600"> {environmentalCount} environmental impacts</span> → 
            <span className="font-bold text-amber-600"> {economicCount} economic consequences</span> → 
            <span className="font-bold text-rose-600"> {humanCount} human outcomes</span>.
            The strongest causal link is from <span className="font-bold text-orange-600">{strongestLink.source?.name}</span> to 
            <span className="font-bold text-purple-600"> {strongestLink.target?.name}</span> (strength: {Math.round(strongestLink.value)}), 
            highlighting the critical role of climate drivers in shaping disaster risk and downstream impacts.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-slate-500">Flow strength = line thickness</span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-slate-500 text-[10px]">Climate Drivers</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-500 text-[10px]">Environmental</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-slate-500 text-[10px]">Economic</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-slate-500 text-[10px]">Human</span>
          </div>
        </div>
      </div>

      <svg width={width} height={height} className="overflow-visible">
        {/* Instruction text */}
        <text x={20} y={22} fontSize={10} fill="#64748b" fontWeight="500">
           Complete causal flow: Climate Drivers → Environmental → Economic → Human | Thicker lines = stronger influence
        </text>

        {/* Background */}
        <rect x={5} y={35} width={width - 10} height={height - 45} fill="#fafbfc" rx={8} />

        {/* LINKS - Using LineItem for better hover effects */}
        <g>
          {sankeyData.links.map((link: any, i: number) => {
            const pathData = sankeyLinkHorizontal()(link);
            const isStrongest = strongestLink && link === strongestLink;
            const linkColor = processed.links[i]?.color || "#a855f7";
            const isHovered = hoveredLinkIndex === i;
            
            return (
              <LineItem
                key={i}
                path={pathData || ""}
                color={linkColor}
                opacity={isHovered ? 0.9 : (isStrongest ? 0.7 : 0.3)}
                strokeWidth={Math.max(1.5, isStrongest ? (link.width || 1.5) * 1.3 : (link.width || 1.5))}
                onHover={(hovered: boolean) => {
                  setHoveredLinkIndex(hovered ? i : null);
                  if (hovered) {
                    setHover({ type: "link", index: i, data: link });
                  } else if (!hovered && hover?.type === "link") {
                    setHover(null);
                  }
                }}
              />
            );
          })}
        </g>

        {/* NODES - Enhanced with glow effects */}
        <g>
          {sankeyData.nodes.map((node: any, i: number) => {
            const isHovered = hover?.type === "node" && hover.data?.name === node.name;
            const nodeColor = NODE_COLOR[node.name] || NODE_CATEGORY_COLOR[node.category] || "#94a3b8";
            
            return (
              <g
                key={i}
                transform={`translate(${node.x0},${node.y0})`}
                cursor="pointer"
                onMouseEnter={() => setHover({ type: "node", data: node })}
                onMouseLeave={() => setHover(null)}
              >
                {/* Glow effect for hovered node */}
                {isHovered && (
                  <rect
                    width={node.x1 - node.x0}
                    height={node.y1 - node.y0}
                    fill={nodeColor}
                    opacity={0.2}
                    rx={8}
                    style={{ filter: "blur(6px)" }}
                  />
                )}
                
                <rect
                  width={node.x1 - node.x0}
                  height={node.y1 - node.y0}
                  fill={nodeColor}
                  opacity={isHovered ? 1 : 0.85}
                  stroke={isHovered ? "#0f172a" : "none"}
                  strokeWidth={isHovered ? 2 : 0}
                  rx={6}
                  className="transition-all duration-150"
                />

                <text
                  x={-12}
                  y={(node.y1 - node.y0) / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="#1e293b"
                  fontWeight={isHovered ? 700 : 600}
                >
                  {node.name}
                </text>

                {node.value > 0 && (
                  <text
                    x={6}
                    y={(node.y1 - node.y0) / 2 + 1}
                    dominantBaseline="middle"
                    fontSize={8}
                    fill="#ffffff"
                    fontWeight={700}
                  >
                    {Math.round(node.value)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Category labels at the top */}
        <g>
          {[
            { x: 140, label: " Climate Drivers", color: "#f97316" },
            { x: 340, label: " Environmental", color: "#10b981" },
            { x: 540, label: " Economic", color: "#f59e0b" },
            { x: 740, label: " Human", color: "#ef4444" },
          ].map((item) => (
            <text
              key={item.label}
              x={item.x}
              y={48}
              textAnchor="middle"
              fontSize={9}
              fill={item.color}
              fontWeight="600"
              letterSpacing="0.05em"
            >
              {item.label}
            </text>
          ))}
        </g>

        {/* Tooltip */}
        {hover && (
          <foreignObject x={20} y={70} width={320} height={200}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#0f172a",
                padding: "12px",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {hover.type === "node" && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: NODE_COLOR[hover.data.name] || NODE_CATEGORY_COLOR[hover.data.category] || "#94a3b8" }}
                    />
                    <strong className="text-slate-800">{hover.data.name}</strong>
                  </div>
                  <div className="text-slate-600">
                    Impact score: <span className="font-semibold text-slate-800">{Math.round(hover.data.value)}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] mt-2">
                    {hover.data.name === "Surface Temperature" && " Land and air temperature anomaly - affects agriculture, ecosystems, and human health"}
                    {hover.data.name === "Sea Surface Temperature" && " Ocean surface warming - fuels cyclones and marine heatwaves"}
                    {hover.data.name === "Sea Level" && " Rising sea levels from thermal expansion - threatens coastal communities"}
                    {hover.data.name === "Rainfall" && " Extreme precipitation events - causes flooding and landslides"}
                    {hover.data.name === "Crop Yield" && "Agricultural productivity - affected by temperature and rainfall changes"}
                    {hover.data.name === "Livestock Yield" && " Livestock production - heat stress reduces meat and dairy output"}
                    {hover.data.name === "Climate Altering Land" && " Land cover changes - affects carbon storage and biodiversity"}
                    {hover.data.name === "Disasters" && " Cyclones, floods, storm surges - direct climate impacts"}
                    {hover.data.name === "Economic Loss" && " Infrastructure and economic damage from disasters"}
                    {hover.data.name === "Tourist Arrivals" && " Tourism-dependent economies - vulnerable to climate disruptions"}
                    {hover.data.name === "People Affected" && " Human displacement and livelihood impacts"}
                    {hover.data.name === "Population Growth" && " Demographic trends - affected by migration and economic conditions"}
                  </div>
                </>
              )}

              {hover.type === "link" && (
                <>
                  <strong className="text-slate-800">Causal Connection</strong>
                  <div className="mt-1 text-slate-600">
                    {hover.data.source?.name} → {hover.data.target?.name}
                  </div>
                  <div className="text-slate-600">
                    Flow strength: <span className="font-semibold text-purple-600">{Math.round(hover.data.value)}</span>
                  </div>
                  <div className="text-slate-500 text-[10px] mt-2">
                    {hover.data.label || "Relationship magnitude based on historical data"}
                  </div>
                  <div className="text-slate-400 text-[9px] mt-2 pt-1 border-t border-slate-100">
                    Hover over links to see causal pathways
                  </div>
                </>
              )}
            </div>
          </foreignObject>
        )}
      </svg>

      {/* Footer Insight */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          Hover over any link or node to explore the complete causal chain · 
          Thicker lines indicate stronger relationships.  
          Full pathway: Climate Drivers → Environmental → Economic → Human Impacts
        </p>
      </div>
    </div>
  );
}
