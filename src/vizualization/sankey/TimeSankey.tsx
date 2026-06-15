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
  // Reduced max value from 30 to 12 to prevent huge lines
  return Math.min(Math.max(Math.abs(v) * multiplier, 0.2), 12);
}

export default function TimeSankey({
  width,
  height,
  data,
  selectedCountry,
  title = "Climate Impact Flow",
  insight = "Flow diagram showing relationships from climate drivers to environmental, economic, and human impacts. Line thickness represents relative strength based on historical data.",
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
      value: normalize(Math.abs(latest.temp) * 0.5),
      label: `${Math.abs(latest.temp).toFixed(1)}°C temperature anomaly`,
      color: "#10b981"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Crop Yield"),
      value: normalize(Math.abs(latest.rainfall) * 0.4),
      label: `${Math.abs(latest.rainfall).toFixed(0)}mm rainfall deviation`,
      color: "#10b981"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Surface Temperature"),
      target: nodes.findIndex(n => n.name === "Livestock Yield"),
      value: normalize(Math.abs(latest.temp) * 0.45),
      label: `${Math.abs(latest.temp).toFixed(1)}°C temperature anomaly`,
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Livestock Yield"),
      value: normalize(Math.abs(latest.rainfall) * 0.35),
      label: `${Math.abs(latest.rainfall).toFixed(0)}mm rainfall deviation`,
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Surface Temperature"),
      target: nodes.findIndex(n => n.name === "Climate Altering Land"),
      value: normalize(Math.abs(latest.temp) * 0.4),
      label: `${Math.abs(latest.temp).toFixed(1)}°C temperature anomaly`,
      color: "#8b5cf6"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Climate Altering Land"),
      value: normalize(Math.abs(latest.rainfall) * 0.35),
      label: `${Math.abs(latest.rainfall).toFixed(0)}mm rainfall deviation`,
      color: "#8b5cf6"
    });

    // Climate Drivers → Disasters
    links.push({
      source: nodes.findIndex(n => n.name === "Sea Surface Temperature"),
      target: nodes.findIndex(n => n.name === "Disasters"),
      value: normalize(latest.sea_surface_temperature * 0.8),
      label: `${latest.sea_surface_temperature.toFixed(1)}°C ocean warming`,
      color: "#a855f7"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Sea Level"),
      target: nodes.findIndex(n => n.name === "Disasters"),
      value: normalize(latest.sea * 1.0),
      label: `${(latest.sea * 100).toFixed(0)}cm sea level rise`,
      color: "#a855f7"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Disasters"),
      value: normalize(Math.abs(latest.rainfall) * 0.5),
      label: `${Math.abs(latest.rainfall).toFixed(0)}mm rainfall deviation`,
      color: "#a855f7"
    });

    // Environmental Impact → Economic Loss
    links.push({
      source: nodes.findIndex(n => n.name === "Crop Yield"),
      target: nodes.findIndex(n => n.name === "Economic Loss"),
      value: normalize(latest.crop_yield * 0.2),
      label: `${latest.crop_yield.toFixed(1)} t/ha crop yield`,
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Livestock Yield"),
      target: nodes.findIndex(n => n.name === "Economic Loss"),
      value: normalize(latest.lifestock_yield * 0.15),
      label: `${(latest.lifestock_yield / 1000).toFixed(0)}K tons livestock`,
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Climate Altering Land"),
      target: nodes.findIndex(n => n.name === "Economic Loss"),
      value: normalize(latest.climate_altering_land * 0.1),
      label: `${(latest.climate_altering_land / 1000).toFixed(0)}K ha land change`,
      color: "#f59e0b"
    });

    // Disasters → Economic Loss
    links.push({
      source: nodes.findIndex(n => n.name === "Disasters"),
      target: nodes.findIndex(n => n.name === "Economic Loss"),
      value: normalize(latest.loss * 0.15),
      label: `$${(latest.loss / 1e6).toFixed(0)}M economic loss`,
      color: "#f59e0b"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Disasters"),
      target: nodes.findIndex(n => n.name === "Tourist Arrivals"),
      value: normalize(latest.loss * 0.1),
      label: `$${(latest.loss / 1e6).toFixed(0)}M loss impact`,
      color: "#14b8a6"
    });

    // Economic Loss → Human Impacts
    links.push({
      source: nodes.findIndex(n => n.name === "Economic Loss"),
      target: nodes.findIndex(n => n.name === "People Affected"),
      value: normalize(latest.people * 0.08),
      label: `${(latest.people / 1000).toFixed(0)}K people affected`,
      color: "#ef4444"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Economic Loss"),
      target: nodes.findIndex(n => n.name === "Population Growth"),
      value: normalize(Math.abs(latest.population_growth) * 0.1),
      label: `${latest.population_growth.toFixed(1)}% population growth`,
      color: "#ec4898"
    });

    // Climate Drivers → Direct Human Impacts
    links.push({
      source: nodes.findIndex(n => n.name === "Surface Temperature"),
      target: nodes.findIndex(n => n.name === "Tourist Arrivals"),
      value: normalize(Math.abs(latest.temp) * 0.3),
      label: `${Math.abs(latest.temp).toFixed(1)}°C temperature anomaly`,
      color: "#14b8a6"
    });
    
    links.push({
      source: nodes.findIndex(n => n.name === "Rainfall"),
      target: nodes.findIndex(n => n.name === "Tourist Arrivals"),
      value: normalize(Math.abs(latest.rainfall) * 0.25),
      label: `${Math.abs(latest.rainfall).toFixed(0)}mm rainfall deviation`,
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

  // Calculate category counts
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
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            No climate flow data available for {selectedCountry}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {insight}
        </p>
      </div>

      {/* Summary Stats */}
      {strongestLink && (
        <div className="mb-5 grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-700">{driverCount}</div>
            <div className="text-xs text-slate-500">Climate Drivers</div>
          </div>
          <div className="text-center p-2 bg-emerald-50 rounded-lg">
            <div className="text-lg font-bold text-emerald-700">{environmentalCount}</div>
            <div className="text-xs text-slate-500">Environmental</div>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <div className="text-lg font-bold text-amber-700">{economicCount}</div>
            <div className="text-xs text-slate-500">Economic</div>
          </div>
          <div className="text-center p-2 bg-rose-50 rounded-lg">
            <div className="text-lg font-bold text-rose-700">{humanCount}</div>
            <div className="text-xs text-slate-500">Human</div>
          </div>
        </div>
      )}

      {/* Data Summary */}
      {strongestLink && (
        <div className="mb-5 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <p className="text-xs text-slate-700 leading-relaxed">
            {selectedCountry}: {driverCount} climate drivers → {environmentalCount} environmental impacts → 
            {economicCount} economic outcomes → {humanCount} human impacts. 
            Strongest flow: {strongestLink.source?.name} to {strongestLink.target?.name} 
            (value: {Math.round(strongestLink.value)}).
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-slate-500">Line thickness = flow strength</span>
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
          Climate Drivers → Environmental → Economic → Human | Thicker lines = stronger relationship
        </text>

        {/* Background */}
        <rect x={5} y={35} width={width - 10} height={height - 45} fill="#fafbfc" rx={8} />

        {/* LINKS - with reduced maximum thickness */}
        <g>
          {sankeyData.links.map((link: any, i: number) => {
            const pathData = sankeyLinkHorizontal()(link);
            const isStrongest = strongestLink && link === strongestLink;
            const linkColor = processed.links[i]?.color || "#a855f7";
            const isHovered = hoveredLinkIndex === i;
            
            // Calculate base width - ensure it never gets too thick
            let baseWidth = link.width || 1.5;
            // Cap the maximum width to 8px
            baseWidth = Math.min(baseWidth, 8);
            // Ensure minimum width of 0.5px
            baseWidth = Math.max(baseWidth, 0.5);
            
            return (
              <LineItem
                key={i}
                path={pathData || ""}
                color={linkColor}
                opacity={isHovered ? 0.9 : (isStrongest ? 0.6 : 0.3)}
                strokeWidth={isHovered ? baseWidth * 1.2 : baseWidth}
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

        {/* NODES */}
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
                {/* Hover effect */}
                {isHovered && (
                  <rect
                    width={node.x1 - node.x0}
                    height={node.y1 - node.y0}
                    fill={nodeColor}
                    opacity={0.2}
                    rx={8}
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

        {/* Category labels */}
        <g>
          {[
            { x: 140, label: "Climate Drivers", color: "#f97316" },
            { x: 340, label: "Environmental", color: "#10b981" },
            { x: 540, label: "Economic", color: "#f59e0b" },
            { x: 740, label: "Human", color: "#ef4444" },
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
                    Value: <span className="font-semibold text-slate-800">{Math.round(hover.data.value)}</span>
                  </div>
                  <div className="text-slate-500 text-[10px] mt-2">
                    {hover.data.name === "Surface Temperature" && "Land and air temperature anomaly"}
                    {hover.data.name === "Sea Surface Temperature" && "Ocean surface temperature anomaly"}
                    {hover.data.name === "Sea Level" && "Sea level rise from thermal expansion"}
                    {hover.data.name === "Rainfall" && "Precipitation deviation from baseline"}
                    {hover.data.name === "Crop Yield" && "Agricultural productivity"}
                    {hover.data.name === "Livestock Yield" && "Livestock production"}
                    {hover.data.name === "Climate Altering Land" && "Land cover changes"}
                    {hover.data.name === "Disasters" && "Cyclones, floods, storm surges"}
                    {hover.data.name === "Economic Loss" && "Infrastructure and economic damage"}
                    {hover.data.name === "Tourist Arrivals" && "Tourism numbers"}
                    {hover.data.name === "People Affected" && "Displaced population"}
                    {hover.data.name === "Population Growth" && "Population change rate"}
                  </div>
                </>
              )}

              {hover.type === "link" && (
                <>
                  <strong className="text-slate-800">Connection</strong>
                  <div className="mt-1 text-slate-600">
                    {hover.data.source?.name} → {hover.data.target?.name}
                  </div>
                  <div className="text-slate-600">
                    Strength: <span className="font-semibold text-purple-600">{Math.round(hover.data.value)}</span>
                  </div>
                  <div className="text-slate-500 text-[10px] mt-2">
                    Data: {hover.data.label}
                  </div>
                </>
              )}
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}
