import { useState } from "react";
import TimeSankey from "@/vizualization/sankey/TimeSankey";
import BeeswarmChart from "@/vizualization/beeswarm/BeeswarmChart";

interface CausalChainSectionProps {
  climateFlowData: any[];
  beeswarmData: any[];
  selectedCountry: string;
  chartWidth: number;
}

export function CausalChainSection({ climateFlowData, beeswarmData, selectedCountry, chartWidth }: CausalChainSectionProps) {
  const [activeView, setActiveView] = useState<"sankey" | "beeswarm">("sankey");

  return (
    <div className="mb-12">
      <div className="text-center mb-6">
        <div className="text-[1.75rem] font-semibold mb-3 text-slate-900">🔗 Tracing the Causal Chain</div>
        <div className="text-sm text-slate-500 max-w-[680px] mx-auto">
          Toggle between Sankey flow diagram and beeswarm distribution to explore the complete climate cascade.
        </div>
        <div className="flex gap-4 justify-center mt-4">
          <button 
            onClick={() => setActiveView("sankey")} 
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "2rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              background: activeView === "sankey" ? "#0f172a" : "#ffffff",
              color: activeView === "sankey" ? "#ffffff" : "#475569",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
            }}
          >
            🔀 Sankey Flow Diagram
          </button>
          <button 
            onClick={() => setActiveView("beeswarm")} 
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "2rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              background: activeView === "beeswarm" ? "#0f172a" : "#ffffff",
              color: activeView === "beeswarm" ? "#ffffff" : "#475569",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
            }}
          >
            🐝 Beeswarm Distribution
          </button>
        </div>
      </div>
      <div className="p-2">
        {activeView === "sankey" && (
          <TimeSankey 
            width={chartWidth * 2 + 20} 
            height={420} 
            data={climateFlowData} 
            selectedCountry={selectedCountry} 
            title="Climate Impact Flow" 
            insight="This diagram traces the causal chain from climate drivers to human impacts. Thicker lines indicate stronger connections." 
          />
        )}
        {activeView === "beeswarm" && (
          <BeeswarmChart 
            width={chartWidth * 2 + 20} 
            height={500} 
            data={beeswarmData} 
            title="Climate Impact Distribution" 
            insight="Each dot represents a climate impact measurement. Size shows magnitude, color indicates type. Dots cluster by country (vertical) and decade (horizontal)." 
          />
        )}
      </div>
    </div>
  );
}