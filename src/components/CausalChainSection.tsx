"use client";

import ClimateInteractionMatrix from "@/vizualization/ClimateInteractionMatrix";

interface Props {
  climateFlowData: any[];
  selectedCountry: string;
  chartWidth: number;
}

export function CausalChainSection({
  climateFlowData,
  selectedCountry,
  chartWidth,
}: Props) {
 return (
  <>
    <div className="text-center mb-6">
      <p className="text-sm text-slate-500 max-w-2xl mx-auto mt-2">
        Climate impacts are not linear. Each driver reinforces multiple systems at once —
        creating feedback loops across environment, economy, and society.
      </p>
    </div>
    
    <ClimateInteractionMatrix
      data={climateFlowData}
      selectedCountry={selectedCountry}
      width={chartWidth * 2 + 40}
    />
  </>
);
}
