"use client";

import { useMemo, useState } from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import * as d3 from "d3";

type ClimateData = {
  country: string;
  year: number;
  temp: number;
  sea_surface_temperature: number;
  sea: number;
  rainfall: number;
  loss: number;
  people: number;
};

type Props = {
  width: number;
  height: number;
  data: ClimateData[];
  selectedCountry: string;
  title?: string;
  insight?: string;
};

const NODE_COLORS: Record<string, string> = {
  "Surface Temperature": "#ef4444",
  "Sea Surface Temperature": "#06b6d4",
  "Sea Level": "#3b82f6",
  "Rainfall": "#22c55e",
  "Economic Loss": "#f97316",
  "People Affected": "#a855f7",
};

const NODE_ICONS: Record<string, string> = {
  "Surface Temperature": "🌡️",
  "Sea Surface Temperature": "🌊",
  "Sea Level": "📈",
  "Rainfall": "☔",
  "Economic Loss": "💰",
  "People Affected": "👥",
};

const NODE_DESCRIPTIONS: Record<string, string> = {
  "Surface Temperature": "Air and land surface temperature anomaly",
  "Sea Surface Temperature": "Ocean surface warming from heat absorption",
  "Sea Level": "Rising sea levels from thermal expansion",
  "Rainfall": "Extreme precipitation events",
  "Economic Loss": "Disaster-related infrastructure and economic damage",
  "People Affected": "Human displacement, health impacts, and livelihoods",
};

export default function ClimateImpactDashboard({
  width,
  height,
  data,
  selectedCountry,
  title = "Climate Impact Cascade",
  insight = "This unified visualization traces the causal chain from climate drivers to human impacts. Thicker lines indicate stronger relationships. Hover over any element for details.",
}: Props) {
  const [hovered, setHovered] = useState<any>(null);
  const [view, setView] = useState<"sankey" | "timeline">("sankey");

  // Filter data for selected country
  const countryData = useMemo(() => {
    return data.filter(d => d.country === selectedCountry);
  }, [data, selectedCountry]);

  // Get latest year data for flow strength
  const latestData = useMemo(() => {
    if (countryData.length === 0) return null;
    return countryData[countryData.length - 1];
  }, [countryData]);

  // Calculate decade ranges
  const decades = useMemo(() => {
    const years = countryData.map(d => d.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const startDecade = Math.floor(minYear / 10) * 10;
    const endDecade = Math.floor(maxYear / 10) * 10;
    const decadeList: number[] = [];
    for (let year = startDecade; year <= endDecade; year += 10) {
      decadeList.push(year);
    }
    return decadeList;
  }, [countryData]);

  // Calculate average values by decade for timeline view
  const decadeAverages = useMemo(() => {
    return decades.map(decade => {
      const decadeData = countryData.filter(d => d.year >= decade && d.year < decade + 10);
      if (decadeData.length === 0) return null;
      
      return {
        decade,
        temp: decadeData.reduce((sum, d) => sum + d.temp, 0) / decadeData.length,
        sea_surface_temperature: decadeData.reduce((sum, d) => sum + d.sea_surface_temperature, 0) / decadeData.length,
        sea: decadeData.reduce((sum, d) => sum + d.sea, 0) / decadeData.length,
        rainfall: decadeData.reduce((sum, d) => sum + d.rainfall, 0) / decadeData.length,
        loss: decadeData.reduce((sum, d) => sum + d.loss, 0) / decadeData.length,
        people: decadeData.reduce((sum, d) => sum + d.people, 0) / decadeData.length,
      };
    }).filter(Boolean);
  }, [countryData, decades]);

  // Calculate annual averages for timeline
  const annualAverages = useMemo(() => {
    return countryData.map(d => ({
      year: d.year,
      temp: d.temp,
      sea_surface_temperature: d.sea_surface_temperature,
      sea: d.sea,
      rainfall: d.rainfall,
      loss: d.loss,
      people: d.people,
    }));
  }, [countryData]);

  // ─────────────────────────────────────────────
  // SANKEY FLOW DIAGRAM
  // ─────────────────────────────────────────────
  const sankeyData = useMemo(() => {
    if (!latestData) return null;

    const nodes = [
      { name: "Surface Temperature" },
      { name: "Sea Surface Temperature" },
      { name: "Sea Level" },
      { name: "Rainfall" },
      { name: "Economic Loss" },
      { name: "People Affected" },
    ];

    const normalize = (v: number) => Math.min(Math.max(Math.abs(v), 0.3), 30);

    const links = [
      { source: 0, target: 1, value: normalize(latestData.temp * 1.2), label: "Surface heat warms ocean" },
      { source: 1, target: 2, value: normalize(latestData.sea_surface_temperature), label: "Thermal expansion" },
      { source: 2, target: 4, value: normalize(latestData.sea * 1.5), label: "Coastal flooding" },
      { source: 3, target: 4, value: normalize(latestData.rainfall * 0.8), label: "Extreme precipitation" },
      { source: 4, target: 5, value: normalize(latestData.loss * 0.3), label: "Infrastructure damage & displacement" },
    ];

    const sankeyLayout = sankey<any, any>()
      .nodeWidth(24)
      .nodePadding(28)
      .extent([[80, 60], [width - 80, height - 100]]);

    const layout = sankeyLayout({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });
    return layout;
  }, [latestData, width, height]);

  // Calculate strongest link for storytelling
  const strongestLink = useMemo(() => {
    if (!sankeyData || !sankeyData.links.length) return null;
    return sankeyData.links.reduce((max: any, link: any) => 
      (link.value > max.value) ? link : max, sankeyData.links[0]);
  }, [sankeyData]);

  // Calculate total impact
  const totalLoss = countryData.reduce((sum, d) => sum + d.loss, 0);
  const totalPeople = countryData.reduce((sum, d) => sum + d.people, 0);

  if (!countryData.length || !latestData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white" style={{ width, height }}>
        <div className="text-center p-6">
          <div className="text-4xl mb-3 opacity-30">🌍</div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No Data Available</h3>
          <p className="text-xs text-slate-400 max-w-xs">No climate data available for {selectedCountry}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-purple-500">
          <p className="text-sm text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">💡 Story Insight:</span> {insight}
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="text-2xl font-bold text-blue-700">{countryData.length}</div>
          <div className="text-xs text-slate-500">Years of Data</div>
          <div className="text-[10px] text-slate-400">{Math.min(...countryData.map(d => d.year))} → {Math.max(...countryData.map(d => d.year))}</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-100">
          <div className="text-2xl font-bold text-orange-700">
            {totalLoss >= 1_000_000_000 ? `$${(totalLoss / 1_000_000_000).toFixed(1)}B` : 
             totalLoss >= 1_000_000 ? `$${(totalLoss / 1_000_000).toFixed(1)}M` : 
             `$${(totalLoss / 1_000).toFixed(0)}K`}
          </div>
          <div className="text-xs text-slate-500">Total Economic Loss</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-100">
          <div className="text-2xl font-bold text-purple-700">
            {totalPeople >= 1_000_000 ? `${(totalPeople / 1_000_000).toFixed(1)}M` : 
             totalPeople >= 1_000 ? `${(totalPeople / 1_000).toFixed(0)}K` : 
             totalPeople.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">People Affected</div>
        </div>
        <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="text-2xl font-bold text-emerald-700">
            {latestData.temp > 0 ? `+${latestData.temp.toFixed(1)}°C` : `${latestData.temp.toFixed(1)}°C`}
          </div>
          <div className="text-xs text-slate-500">Current Temp Anomaly</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-5 flex justify-center gap-2">
        <button
          onClick={() => setView("sankey")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "sankey" 
              ? "bg-purple-600 text-white shadow-md" 
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          🔀 Causal Flow Diagram
        </button>
        <button
          onClick={() => setView("timeline")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            view === "timeline" 
              ? "bg-purple-600 text-white shadow-md" 
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          📈 Timeline Trends
        </button>
      </div>

      {/* SANKEY VIEW */}
      {view === "sankey" && sankeyData && (
        <div className="relative">
          {/* Narrative */}
          {strongestLink && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-100">
              <p className="text-sm text-slate-700 leading-relaxed">
                In <span className="font-bold text-slate-900">{selectedCountry}</span>, the strongest causal link is from 
                <span className="font-bold text-red-500"> {strongestLink.source.name}</span> to 
                <span className="font-bold text-cyan-500"> {strongestLink.target.name}</span>, 
                with a flow strength of <span className="font-semibold text-purple-600">{strongestLink.value.toFixed(1)}</span>.
                This indicates that {strongestLink.source.name.toLowerCase()} variability is a primary driver of the climate impact cascade.
              </p>
            </div>
          )}

          <svg width={width} height={height} className="overflow-visible">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background */}
            <rect x={10} y={20} width={width - 20} height={height - 40} fill="#fafbfc" rx={12} />

            {/* Links */}
            <g>
              {sankeyData.links.map((link: any, i: number) => {
                const isHovered = hovered?.type === "link" && hovered.index === i;
                const isStrongest = strongestLink && link === strongestLink;
                return (
                  <path
                    key={i}
                    d={sankeyLinkHorizontal()(link) || ""}
                    stroke="#a855f7"
                    strokeOpacity={isHovered ? 0.9 : (isStrongest ? 0.7 : 0.35)}
                    strokeWidth={Math.max(2, isStrongest ? link.width * 1.3 : link.width || 1.5)}
                    fill="none"
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHovered({ type: "link", index: i, data: link })}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {sankeyData.nodes.map((node: any, i: number) => {
                const isHovered = hovered?.type === "node" && hovered.data?.name === node.name;
                return (
                  <g
                    key={i}
                    transform={`translate(${node.x0},${node.y0})`}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHovered({ type: "node", data: node })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <rect
                      width={node.x1 - node.x0}
                      height={node.y1 - node.y0}
                      fill={NODE_COLORS[node.name]}
                      opacity={isHovered ? 1 : 0.85}
                      stroke={isHovered ? "#0f172a" : "none"}
                      strokeWidth={isHovered ? 2 : 0}
                      rx={8}
                      filter={isHovered ? "url(#glow)" : "none"}
                    />
                    <text
                      x={-12}
                      y={(node.y1 - node.y0) / 2}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={12}
                      fill="#1e293b"
                      fontWeight={700}
                    >
                      {NODE_ICONS[node.name]} {node.name}
                    </text>
                    <text
                      x={8}
                      y={(node.y1 - node.y0) / 2 + 1}
                      dominantBaseline="middle"
                      fontSize={10}
                      fill="#ffffff"
                      fontWeight={700}
                    >
                      {Math.round(node.value)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Direction Arrow */}
            <text x={width / 2} y={45} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight="500">
              ← Climate Drivers &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Impacts →
            </text>
          </svg>
        </div>
      )}

      {/* TIMELINE VIEW */}
      {view === "timeline" && (
        <div className="relative">
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100">
            <p className="text-sm text-slate-700 leading-relaxed">
              The timeline shows <span className="font-bold text-slate-900">{selectedCountry}</span>'s climate trends over {countryData.length} years.
              <span className="font-bold text-red-500"> Temperature</span> and <span className="font-bold text-cyan-500">sea surface temperature</span> show warming trends,
              while <span className="font-bold text-orange-500">economic losses</span> and <span className="font-bold text-purple-500">people affected</span> indicate growing climate vulnerability.
            </p>
          </div>

          <svg width={width} height={450} className="overflow-visible">
            <rect x={10} y={10} width={width - 20} height={430} fill="#fafbfc" rx={12} />
            
            {/* Simplified timeline visualization */}
            <g transform="translate(80, 60)">
              {/* Y-axis labels */}
              <text x={-10} y={200} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight="500" transform="rotate(-90)">Impact Magnitude</text>
              
              {/* X-axis */}
              <line x1={0} y1={350} x2={width - 160} y2={350} stroke="#cbd5e1" strokeWidth={1.5} />
              <text x={(width - 160) / 2} y={380} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight="500">Year</text>
              
              {/* Decade markers */}
              {decades.map((decade, i) => {
                const x = (i / (decades.length - 1)) * (width - 160);
                return (
                  <g key={decade}>
                    <line x1={x} y1={350} x2={x} y2={355} stroke="#94a3b8" strokeWidth={1} />
                    <text x={x} y={370} textAnchor="middle" fontSize={9} fill="#64748b">{decade}s</text>
                  </g>
                );
              })}
              
              {/* Note about full timeline */}
              <text x={(width - 160) / 2} y={420} textAnchor="middle" fontSize={10} fill="#94a3b8" fontStyle="italic">
                View full Multi-Metric Timeline for detailed year-by-year analysis
              </text>
            </g>
          </svg>
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
        {Object.entries(NODE_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-600">{NODE_ICONS[name]} {name}</span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {hovered && hovered.type === "link" && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-xl px-4 py-3 rounded-lg z-50"
          style={{
            left: (window.event as any)?.clientX + 20,
            top: (window.event as any)?.clientY - 50,
          }}
        >
          <div className="font-semibold text-slate-800 text-sm mb-1">
            {hovered.data.source.name} → {hovered.data.target.name}
          </div>
          <div className="text-xs text-slate-600">
            Flow strength: <span className="font-bold text-purple-600">{hovered.data.value.toFixed(1)}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {NODE_DESCRIPTIONS[hovered.data.source.name]} → {NODE_DESCRIPTIONS[hovered.data.target.name]?.split(" ")[0]} impact
          </div>
        </div>
      )}

      {hovered && hovered.type === "node" && (
        <div
          className="fixed pointer-events-none bg-white border border-slate-200 shadow-xl px-4 py-3 rounded-lg z-50"
          style={{
            left: (window.event as any)?.clientX + 20,
            top: (window.event as any)?.clientY - 50,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[hovered.data.name] }} />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              {NODE_ICONS[hovered.data.name]} {hovered.data.name}
            </span>
          </div>
          <div className="text-sm text-slate-600">
            {NODE_DESCRIPTIONS[hovered.data.name]}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Impact score: {Math.round(hovered.data.value)}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center leading-relaxed">
          🔀 Toggle between Causal Flow (visualizing relationships) and Timeline (tracking trends) views · 
          Hover over any element for details · Thicker lines indicate stronger causal relationships
        </p>
      </div>
    </div>
  );
}