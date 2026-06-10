"use client";

import { useMemo, useState } from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";

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
  }[];
  selectedCountry: string;
  title?: string;
  insight?: string;
};

const NODE_COLOR: Record<string, string> = {
  "Surface Temperature": "#f97316",
  "Sea Surface Temperature": "#06b6d4",
  "Sea Level": "#3b82f6",
  "Rainfall": "#22c55e",
  "Disasters": "#a855f7",
  "Economic Loss": "#f59e0b",
  "People Affected": "#ef4444",
};

function normalize(v: number) {
  return Math.max(Math.abs(v), 0.5);
}

export default function TimeSankey({
  width,
  height,
  data,
  selectedCountry,
  title = "Climate Impact Flow",
  insight = "This diagram traces the causal chain from climate drivers to human impacts. Thicker lines indicate stronger connections.",
}: Props) {
  const [hover, setHover] = useState<any>(null);

  const processed = useMemo(() => {
    const filtered = data.filter(d => d.country === selectedCountry);
    if (!filtered.length) return { nodes: [], links: [] };

    const latest = filtered[filtered.length - 1];

    const nodes = [
      { name: "Surface Temperature" },
      { name: "Sea Surface Temperature" },
      { name: "Sea Level" },
      { name: "Rainfall" },
      { name: "Disasters" },
      { name: "Economic Loss" },
      { name: "People Affected" },
    ];

    // Calculate link strengths using actual data fields
    // temp → sea_surface_temperature: Surface temp affects ocean temp
    const surfaceToSeaSurface = normalize(Math.abs(latest.temp) * 1.2);
    
    // sea_surface_temperature → sea: Ocean warming causes thermal expansion
    const seaSurfaceToSeaLevel = normalize(Math.abs(latest.sea_surface_temperature) * 1.0);
    
    // sea → disasters: Sea level rise increases coastal disaster risk
    const seaLevelToDisasters = normalize(Math.abs(latest.sea) * 1.5);
    
    // rainfall → disasters: Extreme precipitation causes flooding disasters
    const rainfallToDisasters = normalize(Math.abs(latest.rainfall) * 0.8);
    
    // disasters → loss: Disasters cause economic damage
    const disastersToLoss = normalize(Math.abs(latest.loss) * 0.3);
    
    // loss → people: Economic loss affects people's livelihoods
    const lossToPeople = normalize(Math.abs(latest.people) * 0.1);

    const links = [
      { source: 0, target: 1, value: surfaceToSeaSurface, label: "Surface heat warms ocean" },
      { source: 1, target: 2, value: seaSurfaceToSeaLevel, label: "Thermal expansion" },
      { source: 2, target: 4, value: seaLevelToDisasters, label: "Coastal flooding" },
      { source: 3, target: 4, value: rainfallToDisasters, label: "Extreme precipitation" },
      { source: 4, target: 5, value: disastersToLoss, label: "Infrastructure damage" },
      { source: 5, target: 6, value: lossToPeople, label: "Displacement & aid" },
    ];

    return { nodes, links };
  }, [data, selectedCountry]);

  const sankeyData = useMemo(() => {
    if (!processed.nodes.length) return null;

    const layout = sankey<any, any>()
      .nodeWidth(24)
      .nodePadding(22)
      .extent([[1, 60], [width - 1, height - 20]]);

    return layout({
      nodes: processed.nodes.map(d => ({ ...d })),
      links: processed.links.map(d => ({ ...d })),
    });
  }, [processed, width, height]);

  // Calculate total flow strength for storytelling
  const totalFlow = useMemo(() => {
    if (!sankeyData) return 0;
    return sankeyData.links.reduce((sum: number, link: any) => sum + (link.value || 0), 0);
  }, [sankeyData]);

  const strongestLink = useMemo(() => {
    if (!sankeyData || !sankeyData.links.length) return null;
    return sankeyData.links.reduce((max: any, link: any) => 
      (link.value > max.value) ? link : max, sankeyData.links[0]);
  }, [sankeyData]);

  if (!sankeyData) {
    return (
      <div 
        className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white"
        style={{ width, height }}
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30">🔀</div>
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
        <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-purple-500">
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      {/* Key Findings Summary Cards */}
      {strongestLink && (
        <div className="mb-5 grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-700">
              {strongestLink.source?.name || "—"}
            </div>
            <div className="text-xs text-slate-500">strongest driver</div>
            <div className="text-[10px] text-slate-400">→ {strongestLink.target?.name}</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-700">
              {sankeyData.links.length}
            </div>
            <div className="text-xs text-slate-500">causal connections</div>
            <div className="text-[10px] text-slate-400">in the chain</div>
          </div>
          <div className="text-center p-2 bg-teal-50 rounded-lg">
            <div className="text-lg font-bold text-teal-700">
              {sankeyData.nodes.length}
            </div>
            <div className="text-xs text-slate-500">impact stages</div>
            <div className="text-[10px] text-slate-400">from cause to effect</div>
          </div>
        </div>
      )}

      {/* Narrative Paragraph */}
      {strongestLink && (
        <div className="mb-5 p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
          <p className="text-sm text-slate-700 leading-relaxed">
            In <span className="font-bold text-slate-900">{selectedCountry}</span>, the climate impact cascade shows that 
            <span className="font-bold text-orange-600"> {strongestLink.source?.name?.toLowerCase()}</span> has the strongest influence on 
            <span className="font-bold text-purple-600"> {strongestLink.target?.name?.toLowerCase()}</span>, 
            with a flow strength of <span className="font-semibold">{Math.round(strongestLink.value)}</span> units.
            This suggests that {strongestLink.source?.name?.toLowerCase()} variability is a primary driver of disaster risk in the region.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-slate-500">📊 Flow strength = line thickness</span>
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(NODE_COLOR).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
              <span className="text-slate-500 text-[10px]">{name}</span>
            </div>
          ))}
        </div>
      </div>

      <svg width={width} height={height} className="overflow-visible">
        {/* Title / Instruction */}
        <text x={20} y={18} fontSize={10} fill="#64748b" fontWeight="500">
          ⚡ Causal flow: Left (drivers) → Right (impacts) | Thicker lines = stronger influence
        </text>

        {/* Background for better visibility */}
        <rect x={0} y={30} width={width} height={height - 30} fill="#fafbfc" rx={8} />

        {/* LINKS */}
        <g>
          {sankeyData.links.map((link: any, i: number) => {
            const isHovered = hover?.type === "link" && hover.index === i;
            const isStrongest = strongestLink && link === strongestLink;
            return (
              <path
                key={i}
                d={sankeyLinkHorizontal()(link) || ""}
                stroke="#a855f7"
                strokeOpacity={isHovered ? 0.9 : (isStrongest ? 0.7 : 0.35)}
                strokeWidth={Math.max(2, isStrongest ? link.width * 1.2 : link.width || 1.5)}
                fill="none"
                cursor="pointer"
                onMouseEnter={() => setHover({ type: "link", index: i, data: link })}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </g>

        {/* NODES */}
        <g>
          {sankeyData.nodes.map((node: any, i: number) => {
            const isHovered = hover?.type === "node" && hover.data?.name === node.name;
            return (
              <g
                key={i}
                transform={`translate(${node.x0},${node.y0})`}
                cursor="pointer"
                onMouseEnter={() => setHover({ type: "node", data: node })}
                onMouseLeave={() => setHover(null)}
              >
                <rect
                  width={node.x1 - node.x0}
                  height={node.y1 - node.y0}
                  fill={NODE_COLOR[node.name] || "#94a3b8"}
                  opacity={isHovered ? 1 : 0.85}
                  stroke={isHovered ? "#0f172a" : "none"}
                  strokeWidth={isHovered ? 2 : 0}
                  rx={6}
                  className="transition-all duration-150"
                />

                <text
                  x={-10}
                  y={(node.y1 - node.y0) / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="#1e293b"
                  fontWeight={600}
                >
                  {node.name}
                </text>

                {node.value > 0 && (
                  <text
                    x={8}
                    y={(node.y1 - node.y0) / 2 + 1}
                    dominantBaseline="middle"
                    fontSize={9}
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

        {/* Tooltip */}
        {hover && (
          <foreignObject x={20} y={55} width={300} height={150}>
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
                      style={{ backgroundColor: NODE_COLOR[hover.data.name] || "#94a3b8" }}
                    />
                    <strong className="text-slate-800">{hover.data.name}</strong>
                  </div>
                  <div className="text-slate-600">
                    Impact score: <span className="font-semibold text-slate-800">{Math.round(hover.data.value)}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] mt-2">
                    {hover.data.name === "Surface Temperature" && "🌡️ Land and air temperature anomaly"}
                    {hover.data.name === "Sea Surface Temperature" && "🌊 Ocean surface warming"}
                    {hover.data.name === "Sea Level" && "📈 Rising sea levels from thermal expansion"}
                    {hover.data.name === "Rainfall" && "☔ Extreme precipitation events"}
                    {hover.data.name === "Disasters" && "🌀 Cyclones, floods, storm surges"}
                    {hover.data.name === "Economic Loss" && "💰 Infrastructure & livelihood costs"}
                    {hover.data.name === "People Affected" && "👥 Human displacement & impact"}
                  </div>
                </>
              )}

              {hover.type === "link" && (
                <>
                  <strong className="text-slate-800">Causal Flow</strong>
                  <div className="mt-1 text-slate-600">
                    {hover.data.source?.name} → {hover.data.target?.name}
                  </div>
                  <div className="text-slate-600">
                    Strength: <span className="font-semibold text-purple-600">{Math.round(hover.data.value)}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] mt-2">
                    {hover.data.source?.name === "Surface Temperature" && hover.data.target?.name === "Sea Surface Temperature" && "🌡️ → 🌊: Surface warming heats the ocean"}
                    {hover.data.source?.name === "Sea Surface Temperature" && hover.data.target?.name === "Sea Level" && "🌊 → 📈: Thermal expansion raises sea level"}
                    {hover.data.source?.name === "Sea Level" && hover.data.target?.name === "Disasters" && "📈 → 🌀: Higher seas increase coastal flooding"}
                    {hover.data.source?.name === "Rainfall" && hover.data.target?.name === "Disasters" && "☔ → 🌀: Extreme rain causes inland flooding"}
                    {hover.data.source?.name === "Disasters" && hover.data.target?.name === "Economic Loss" && "🌀 → 💰: Disaster damage costs"}
                    {hover.data.source?.name === "Economic Loss" && hover.data.target?.name === "People Affected" && "💰 → 👥: Economic strain affects communities"}
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
          📊 Hover over any link or node to explore the causal chain · 
          Thicker lines indicate stronger relationships · 
          Traces path: Surface Temperature → Sea Surface Temperature → Sea Level → Disasters → Economic Loss → People
        </p>
      </div>
    </div>
  );
}