import { useState } from "react";
import ClimateInteractionMatrix from "@/vizualization/matrix/ClimateInteractionMatrix";
import BeeswarmChart from "@/vizualization/beeswarm/BeeswarmChart";

interface Props {
  climateFlowData: any[];
  beeswarmData: any[];
  selectedCountry: string;
  chartWidth: number;
}

export function CausalChainSection({
  climateFlowData,
  beeswarmData,
  selectedCountry,
  chartWidth,
}: Props) {
  const [activeView, setActiveView] = useState<
    "matrix" | "beeswarm"
  >("matrix");

  return (
    <div className="mb-12">

      {/* HEADER */}
      <div className="text-center mb-6">
        <div className="text-[1.75rem] font-semibold mb-3 text-slate-900">
          Climate System Interactions
        </div>

        <div className="text-sm text-slate-500 max-w-[720px] mx-auto">
          This section moves beyond linear cause-effect chains. It reveals how climate drivers
          simultaneously influence multiple systems across environment, economy, and society.
        </div>

        <div className="flex gap-4 justify-center mt-4">
          <button
            onClick={() => setActiveView("matrix")}
            className={`px-6 py-2 rounded-full text-sm border ${
              activeView === "matrix"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            System Matrix
          </button>

          <button
            onClick={() => setActiveView("beeswarm")}
            className={`px-6 py-2 rounded-full text-sm border ${
              activeView === "beeswarm"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600"
            }`}
          >
            Distribution View
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-2">
        {activeView === "matrix" && (
          <ClimateInteractionMatrix
            data={climateFlowData}
            selectedCountry={selectedCountry}
            width={chartWidth * 2 + 40}
          />
        )}

        {activeView === "beeswarm" && (
          <BeeswarmChart
            width={chartWidth * 2 + 40}
            height={500}
            data={beeswarmData}
            title="Climate Impact Distribution"
            insight="Each dot represents a measured impact across time and systems."
          />
        )}
      </div>
    </div>
  );
}
